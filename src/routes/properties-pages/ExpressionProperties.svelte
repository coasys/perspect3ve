<script lang="ts">
    import { Agent, Link, LinkExpression, parseExprUrl, Perspective, PerspectiveProxy, SmartLiteral, type Ad4mClient } from '@perspect3vism/ad4m';
    import { Literal, LinkQuery } from '@perspect3vism/ad4m';
    import { onMount, createEventDispatcher, afterUpdate, getContext } from 'svelte';
    import { FILE_STORAGE_LANG } from '../../config';
    import { flattenPrologList } from '../../util';
    import { BACKGROUND_PREDICATE } from '../ExpressionWidget';
    import ImageCropper from '../ImageCropper.svelte';
    import ExpressionChat from './ExpressionChat.svelte';

    export let ad4m: Ad4mClient
    export let perspective: PerspectiveProxy
    export let expression: string
    export let parent

    let title: string
    let expressionData
    let expressionAuthor: string
    let expressionTimestamp: string
    let expressionType: string
    let properties = []
    let cropDialog
    let tab="properties"
    let tabs
    let propertySelect

    async function setAuthorTimestampFromLink() {
        const links = await perspective.get(new LinkQuery({source: parent, target: expression}))

        if(links && links.length>0) {
            const first = links[0]
            expressionAuthor = first.author
            expressionTimestamp = first.timestamp
        } else {
            expressionAuthor = "unknown"
            expressionTimestamp = "unknown"
        }
    }

    async function checkSmartLiteral() {
        if(!expression) return
        if(await SmartLiteral.isSmartLiteralBase(perspective, expression)) {
            expressionType = "smart literal"
            const smartLiteral: SmartLiteral = new SmartLiteral(perspective, expression)
            const data = await smartLiteral.get()
            console.log("smart literal data", data)
            properties = [...properties, {
                name: "Title", 
                value: data,
                onChange: (value) => smartLiteral.set(value)
            }]
            title = data
            await setAuthorTimestampFromLink()
            return true
        } else {
            return false
        }
    }

    function capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function propertyNameToSetterName(property: string): string {
        return `set${capitalize(property)}`
    }

    async function checkSdnaClasses() {
        if(!expression) return
        const classResults = await perspective.infer(`subject_class(ClassName, C), instance(C, "${expression}"), findall(Prop, property(C, Prop), PropList).`)
        console.log(classResults)
        if(classResults.length > 0) {
            const className = classResults[0].ClassName
            const classProps = flattenPrologList(classResults[0].PropList)
            console.log(className, classProps)

            expressionType = className

            const proxy = await perspective.getSubjectProxy(expression, className)

            for(const prop of classProps) {
                let options
                try {
                    options = await perspective.infer(`subject_class("${className}", C), property_named_option(C, "${prop}", Value, Label).`)
                    console.log(`For ${prop} - options:`, options)
                } catch(e) {

                }

                const value = await proxy[prop]

                if(prop == "title" || prop == "Title" || prop == "name" || prop == "Name") {
                    title = value
                }

                properties = [...properties, {
                    name: prop, 
                    value,
                    options,
                    onChange: (value) => proxy[propertyNameToSetterName(prop)](value)
                }]
                
            }
            await setAuthorTimestampFromLink()
            return true
        } else {
            return false
        }
    }

    async function checkBackgroundImage() {
        if(!expression) return
        const results = perspective.get(new LinkQuery({source: expression, predicate: BACKGROUND_PREDICATE}))
        let bgImage
        if(results.length > 0) {
            bgImage = results[0].target
        }

        properties = [...properties, {
            name: "Background Image", 
            value: bgImage || "<not set>",
            onEdit: () => {
                console.log(cropDialog)
                cropDialog.open = true
            }
        }]
    }

    function blobUriToBase64(blobUri) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
                xhr.onload = function() {
                const reader = new FileReader();
                reader.onloadend = function() {
                    resolve(reader.result.split(',')[1]);
                };
                reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = function() {
                reject(new Error('Failed to load Blob data'));
            };
            xhr.open('GET', blobUri);
            xhr.responseType = 'blob';
            xhr.send();
        });
    }

    async function handleSetBackgroundImage(blob) {
        const base64 = await blobUriToBase64(blob)
        console.log("base64", base64)
        const fileData = {
            name: "bg_image",
            file_type: "image/png",
            data_base64: base64
        }
        
        const fileExprAddr = await ad4m.expression.create(fileData, FILE_STORAGE_LANG)
        console.log("fileExprAddr", fileExprAddr)
        if(!expression) throw "Couldn't set background image - File Store Language returned null"
        await perspective.setSingleTarget(new Link({
            source: expression!, 
            predicate: BACKGROUND_PREDICATE, 
            target: fileExprAddr
        }))
        update()
    }

    function checkLiteral() {
        try {
            expressionData = Literal.fromUrl(expression).get()
            switch(typeof expressionData) {
                case "string":
                    title = expressionData
                    break
                case "number":
                    title = expressionData.toString()
                    break
                case "boolean":
                    title = expressionData.toString()
                    break
                case "object": 
                    console.log("object", expressionData)
                    if(expressionData.data != undefined) {
                        console.log("object data", expressionData.data)
                        title = expressionData.data
                    } else {
                        console.log("object stringify", expressionData)
                        title = JSON.stringify(expressionData)
                    }
                default:
                    expressionData = JSON.stringify(expressionData)
            }
            expressionType = "literal " + typeof expressionData
            return true
        } catch(e) {
            return false
        }
    }

    async function checkSDNA() {
        const links = await perspective.get(new LinkQuery({target: expression}))
        console.log("expression links:", links)
        if(links.length) {
            console.log(links)
            expressionAuthor = links[0].author
            expressionTimestamp = links[0].timestamp
            // Treat SDNA differently
            if(links.find(l => l.data.predicate == "ad4m://has_zome")) {
                expressionType = "SDNA"
                title = "Social DNA"
            }
        }
    }

    async function populateFromExpression() {
        expressionData = null
        title = "<no title>"
        checkBackgroundImage()
        if(await checkSdnaClasses()) return
        if(await checkSmartLiteral()) return
        if(checkLiteral()) {
            await checkSDNA()
            return
        }

        // Last resort, get the expression data from language
        const result = await ad4m.expression.get(expression)
        if(result) {
            const { author, timestamp, data, language } = result
            expressionAuthor = author
            expressionTimestamp = timestamp
            expressionType = language.name ? language.name : language.address
            expressionData = data
            title = data
        } else {
            let exprRef = parseExprUrl(expression)
            expressionType = exprRef.language.name ? exprRef.language.name : exprRef.language.address
            expressionData = exprRef.expression
            title = exprRef.expression
        }
    }

    async function deleteCurrent() {
        if(window.confirm(`Are you sure you want to delete ${expression} this from ${parent}?`)) {
            console.log("deleteCurrent", expression, parent)
            const links = await perspective.get(new LinkQuery({source: parent, target: expression}))
            await perspective.removeLinks(links)
            expression = parent
        }
    }


    async function update() {
        properties = []

        if(expression) {
            populateFromExpression()
        } 
    }

    onMount(async () => {
        update()
    })

    $: if (perspective || expression) {
        update()
    }
</script>


<div class="header">
    {#if title}
        {#if title.length > 50}
            <j-text variant="subheading" size="800" weight="bold">{title.slice(0, 50)}...</j-text>
        {:else}
            <j-text variant="subheading" size="800" weight="bold">{title}</j-text>
        {/if}
    {:else if expressionData}
        {#if typeof expressionData == 'string'}
            <j-text variant="heading" size="800" weight="bold">{expressionData}</j-text>
        {:else if typeof expressionData == 'object' && expressionData.name}
            <j-text variant="heading" size="800" weight="bold">{expressionData.name}</j-text>
        {:else if typeof expressionData == 'object' && expressionData.data}
            <j-text variant="heading" size="800" weight="bold">{expressionData.data}</j-text>
        {:else}
            {#if expression.length > 50}
                <j-text variant="heading" size="800" weight="bold">{expression.slice(0, 50)}...</j-text>
            {:else}
                <j-text variant="heading" size="800" weight="bold">{expression}</j-text>
            {/if}
        {/if}
    {/if}
    <j-text variant="label">Type/Language:</j-text>
    <j-text variant="label" weight="bold">{expressionType}</j-text>
    <j-text variant="label">{expressionTimestamp}</j-text>
    <j-text variant="label">{expressionAuthor}</j-text>
    <j-text variant="label">{expression}</j-text>
</div>

<j-tabs bind:this={tabs} on:change={(e)=>{tab=tabs.value; console.log('tab', tab)}}>
    <j-tab-item value="properties" checked={tab=="properties"}>Props.</j-tab-item>
    <j-tab-item value="actions" checked={tab=="actions"} >Actions</j-tab-item>
    <j-tab-item value="chat" checked={tab=="chat"}><j-icon name="chat-left-dots"/></j-tab-item>
</j-tabs>

<div class="tabs-content">

    {#if tab=="actions"}
        {#if expression}
            <j-flex>
                <j-button variant="transparent" on:click={deleteCurrent}>Delete</j-button>
            </j-flex>
        {/if}
    {/if}


    {#if tab=="properties"}
        {#if expressionType == "SDNA"}
            <j-box>
                <j-text variant="heading-sm" size="400">{expressionData}</j-text>
            </j-box>
        {/if}

        


        <div class="properties">
            {#each properties as prop}
            <div class="property">
                <div class="name">{prop.name}</div>
                {#if prop.onChange != undefined}
                    {#if prop.isEditing}
                        {#if prop.options }
                            <j-select inputvalue="1" bind:this={propertySelect}>
                                <j-menu>
                                    {#each prop.options as option}
                                        <j-menu-item 
                                            value="{option.Value}"
                                            selected="{option.Value == prop.value}"
                                        >{option.Label}</j-menu-item>
                                    {/each}
                                </j-menu>
                            </j-select>
                            <j-button 
                                on:click={() => {
                                    if(propertySelect.value == undefined) return
                                    prop.value = propertySelect.value
                                    prop.onChange(propertySelect.value)
                                    prop.isEditing = false
                                }
                            }>Save</j-button>
                            <j-button on:click={() => {
                                prop.isEditing = false
                            }}>Cancel</j-button>
                        {:else}
                            <j-input
                                type="text"
                                full="true"
                                value={prop.value}
                                on:keydown={(event) => {
                                    console.log(event)
                                    if(event.key === 'Enter') {
                                        const newValue = event.srcElement.value
                                        prop.value = newValue
                                        prop.onChange(newValue)
                                        prop.isEditing = false
                                    }
                                    event.stopPropagation()
                                }}
                                on:blur={() => prop.isEditing = false}
                            />
                        {/if}
                    {:else}
                        <j-text variant="label" weight="bold">{prop.value || '<not set>'}</j-text>
                        <j-button size="xs" variant="link" style="padding-bottom: 3px"
                            on:click={() => prop.isEditing = true} 
                        >
                            <j-icon name="pencil" size="xs" />
                        </j-button>
                    {/if}
                {/if}

                {#if prop.onEdit != undefined}
                    <j-button size="xs" variant="link" style="padding-bottom: 3px"
                        on:click={() => prop.onEdit()} 
                    >
                        <j-icon name="pencil" size="xs" />
                    </j-button>
                {/if}
            </div>
            {/each}
        </div>
    {/if}

    {#if tab=="chat"}
        <ExpressionChat ad4m={ad4m} perspective={perspective} expression={expression}></ExpressionChat>
    {/if}
</div>

<j-modal bind:this={cropDialog} class="modal">
	<header class="header" slot="header">
	  <j-text variant="heading">Set Background for {title}</j-text>
	  <ImageCropper 
		on:cancel={() => cropDialog.open = false}
		on:cropped={(event) => {
			cropDialog.open = false
			handleSetBackgroundImage(event.detail)
		}}
	></ImageCropper>
	</header>
</j-modal>



<style>  
    .content {
      max-height: calc(0.8*100vh);
      width: 450px;
      overflow: scroll;
    } 
    
    .header {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
    }
    
    .description {
      font-size: 14px;
      color: #888888;
      margin-bottom: 10px;
    }
    
    .author {
      font-size: 14px;
      color: #888888;
      margin-bottom: 5px;
    }
    
    .timestamp {
      font-size: 14px;
      color: #888888;
      margin-bottom: 10px;
    }
  
    .tabs-content {
      max-height: 300px;
      overflow: scroll;
    }
    
    .properties {
      grid-template-columns: repeat(2, 1fr);
      grid-gap: 10px;
      
    }
    
    .property {
      display: block;
      border: 1px solid #cccccc;
      padding: 10px;
    }
    
    .name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .value {
      font-size: 14px;
      color: #888888;
    }
    
    .header {
      padding: 20px
    }
  
    .footer {
      float: right;
    }
    
  </style>
  