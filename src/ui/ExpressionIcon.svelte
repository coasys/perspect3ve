<script lang="ts">
    import type { Expression } from "@perspect3vism/ad4m"
    import { Literal, parseExprUrl, Perspective } from "@perspect3vism/ad4m"
    import iconComponentFromString from "./iconComponentFromString";
    import { getContext, createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    import emailValidator from 'email-validator'
    import md5 from 'md5'
    import {Graphic} from '@smui/list';
    import { DoubleBounce } from 'svelte-loading-spinners'
    import iconComponentName from "./iconComponentName";

    export let expressionURL: string
    export let parentLink: Expression
    export let componentConstructor
    export let selected: boolean
    export let perspectiveUUID: string
    export let plain: boolean

    const ad4m: Ad4mClient = getContext('ad4mClient')

    let error

    let expression = null
    let expressionRaw = null
    let iconReady = false
    let loading = true
    let authorName = null
    let authorEmail = null

    let perspectiveProxy
    let me

    ad4m.agent.me().then(m => me = m)
    ad4m.perspective.byUUID(perspectiveUUID).then(p => perspectiveProxy = p)

    
    $: if(expressionURL && loading) ad4m.expression.get(expressionURL).then(result => {
        expression = result
        loading = false
    })

    $: if(expressionURL && plain && loading) ad4m.expression.getRaw(expressionURL).then(result => {
        expressionRaw = result
        loading = false
    })

    $: if(expression) ad4m.expression.get(expression.author).then(result => {
        let author = JSON.parse(result.data)
        console.log("Expression author:", author)

        let did = author.did
        let firstName, lastName, email
        let perspective = new Perspective(author.perspective.links)

        console.log("single target: ", perspective.getSingleTarget({source: did, predicate: 'foaf://givenName'}))
        try {
            firstName = Literal.fromUrl(perspective.getSingleTarget({source: did, predicate: 'foaf://givenName'})).get()
        }catch(e) {
            firstName = "<not set>"
        }

        try {
            lastName = Literal.fromUrl(perspective.getSingleTarget({source: did, predicate: 'foaf://familyName'})).get()
        }catch(e) {
            lastName = "<not set>"
        }

        try {
            email = Literal.fromUrl(perspective.getSingleTarget({source: did, predicate: 'foaf://mbox'})).get()
        }catch(e) {
            email = "<not set>"
        }
        
        authorName = `${firstName} ${lastName}`
        authorEmail = email
    })
    

    //let expression: void | Expression = null
    let customElementName: void | string = null

    let container

    async function getComponentConstructor() {
        componentConstructor = customElements.get(customElementName)
        if(!componentConstructor) {
            try {
                const exprRef = parseExprUrl(expressionURL)
                const lang = await ad4m.languages.byAddress(exprRef.language.address)
                const code = lang.icon.code
                componentConstructor = iconComponentFromString(code, "icon")
                customElements.define(customElementName, componentConstructor)
            } catch (e) {
                console.error(e)
                componentConstructor = customElements.get(customElementName)
            }
        }
    }

    $: if(!loading) {
        customElementName = iconComponentName(expression.language.address)
    }

    $: if(customElementName) {
        if(!componentConstructor) {
            getComponentConstructor()
        }
    }
    
    
    $: if(container && componentConstructor && !loading && perspectiveProxy && me) {
        iconReady = false
        //try{
            const icon = new componentConstructor({target: container})
            //const expression = JSON.parse(JSON.stringify($queryResult))
            //expression.data = JSON.parse(expression.data)
            icon.expression = expression
            icon.base = expressionURL
            icon.perspective = perspectiveProxy
            icon.expressionClient = ad4m.expression
            icon.me = me
            icon.includeBase = false
            while(container.lastChild)
                container.removeChild(container.lastChild)
            container.appendChild(icon)
            iconReady = true
        //}catch(e) {
        //    error = e
        //}

    }

    let width
    let height
    let depth = 30

    $: if(container && iconReady) {
        width = container.offsetWidth
        height = container.offsetHeight
    }

    export let rotated = false

    function rightClick(mouseEvent) {
        mouseEvent.stopPropagation()
        dispatch('context-menu', {expressionURL , mouseEvent, parentLink})
    }


</script>

{#if plain }
<div>
    {#if loading}
        <DoubleBounce size="60" color="#7f81ff" unit="px" duration="1s"></DoubleBounce>
    {:else}
        {expressionRaw}
    {/if}
</div>
{:else}
<div class="box" on:contextmenu={rightClick} style={`transform: rotateY(${rotated?180:0}deg)`}>
<div class="displacement-container" style={`transform: translateX(-${width/2}px);`}>
    {#if loading}
        <DoubleBounce size="60" color="#7f81ff" unit="px" duration="1s"></DoubleBounce>
    {:else}
    <div class="box__face container" class:selected class:invalid="{!expression?.proof?.valid}" bind:this={container}>
        <span class="error">{error}</span>
    </div>
    <div class="box__face back" style={`transform:   rotateY(180deg) translateZ(${depth}px); width: ${width}px; height: ${height}px;`}>
        <div class="backside-content">
            <div>
                <h2 class="header">Author</h2>
                {#if emailValidator.validate(authorEmail) }
                    <img class="avatar" src="http://www.gravatar.com/avatar/{md5(authorEmail)}?s=75" alt="gravatar">
                {/if}
                <span class="property">Name:</span><span class="value">{authorName}</span>
                <br>
                <span class="property">Email:</span><span class="value">{authorEmail}</span>
                <br>
                <span class="property">DID:</span> <span class="value">{expression?.author}</span>
            </div>
            <div>
                <h2 class="header">Timestamp</h2> 
                <span class="value">{expression?.timestamp}</span>
            </div>
            <h2 class="header">URL</h2> <span class="value">{expressionURL}</span>
            <div class="signature-verification">
                {#if !expression?.proof}
                    <span class="broken">
                        Signature MISSING
                        <Graphic class="material-icons" aria-hidden="true" style="color: red; margin-right: 0;">rounded_corner</Graphic>
                    </span>
                {:else}
                    {#if expression?.proof?.valid}
                        <span class="verified">
                            Signature verified
                            <Graphic class="material-icons" aria-hidden="true" style="color: green; margin-right: 0;">verified</Graphic>
                        </span>
                    {/if}
                    {#if expression?.proof?.invalid}
                        <span class="broken">
                            Signature BROKEN
                            <Graphic class="material-icons" aria-hidden="true" style="color: red; margin-right: 0;">warning</Graphic>
                        </span>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
    <div class="box__face right" style={`transform:  translateX(${width-depth/2}px)  translateZ(-${depth/2}px) rotateY(90deg); width: ${depth}px; height: ${height}px;`}>right</div>
    <div class="box__face left" style={`transform:  translateX(-${depth/2}px) rotateY(-90deg) translateX(-${depth/2}px); width: ${depth}px; height: ${height}px;`}>left</div>
    {/if}
</div>
</div>
{/if}

<style>
    .container {
        display: inline-block;
        border: 2px solid;
        overflow: hidden;
    }

    .invalid {
        border: 5px solid red !important;
    }

    .selected {
        border: 10px solid yellow !important;
    }

    .box {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.5s;
    }

    .box__face {
        position: absolute;
        background-color:rgb(27, 32, 32);
        border: 1px solid rgb(127, 129, 255);
    }

    .backside-content {
        overflow: auto;
        color: white;
    }

    .backside-content .header {
        margin-top: 0;
        margin-bottom: 5px;
        color: rgb(127, 129, 255)
    }

    .backside-content .property {
        margin-right: 2px;
        color: rgb(127, 129, 255)
    }

    .backside-content .value {
        color: rgb(127, 219, 255);
        word-break: break-all;
    }

    .displacement-container {
        transform-style: preserve-3d;
    }

    .child-plane {
        transform: translateZ(-2000px);
    }

    .inline {
        display: inline;
        transform-style: preserve-3d;
    }

    .avatar {
        float: left;
        margin-left: 5px;
        margin-right: 5px;
        width: 75px;
        height: 75px;
    }

    .signature-verification {
        position: absolute;
        bottom: 0;
        right: 0;
    }
    .verified {
        color: green;
    }

    .broken {
        color: red;
    }

    .error {
        color: red;
        background-color: white;
        width: 100%;
        height: 400px;
    } 
</style>