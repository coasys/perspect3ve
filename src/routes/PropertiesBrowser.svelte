<script lang="ts">
  import '@junto-foundation/junto-elements';
  import '@junto-foundation/junto-elements/dist/main.css';
  import { Link, parseExprUrl, SmartLiteral, type Ad4mClient, type PerspectiveProxy } from '@perspect3vism/ad4m';
  import { Literal, LinkQuery } from '@perspect3vism/ad4m';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { onMount, createEventDispatcher } from 'svelte';
  import { FILE_STORAGE_LANG } from '../config';
  import { flattenPrologList } from '../util';
  import { BACKGROUND_PREDICATE } from './ExpressionWidget';
  import ImageCropper from './ImageCropper.svelte';

  export let perspectiveID
  export let expression
  export let right=126;
  export let top=90;

  let ad4m: Ad4mClient
  let perspective: PerspectiveProxy
  let title: string
  let expressionData
  let expressionAuthor: string
  let expressionTimestamp: string
  let expressionType: string
  let properties = []

  let isEditingPerspectiveName = false
  let nameInput
  let linkLanguageMeta

  let editingProp
  let cropDialog
  let cropper

  const dispatch = createEventDispatcher();



    let moving = false

    function start() {
        moving = true
    }

    function stop() {
        moving = false
    }

    function move(e) {
        if (moving) {
            console.log(e.movementX, e.movementY)
            right -= e.movementX
            top += e.movementY
        }
    }

  async function ensuerAd4mClient() {
	if (!ad4m) {
		ad4m = await getAd4mClient()
	}
  }

  async function ensurePerspective() {
	if (!perspective || perspective.uuid != perspectiveID) {
		perspective = await ad4m.perspective.byUUID(perspectiveID)
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
		return true
	} else {
		return false
	}
  }

  export function capitalize(str: string) {
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
			
			const options = await perspective.infer(`subject_class("${className}", C), property_named_option(C, "${prop}", Value, Label).`)
			console.log(`For ${prop} - options:`, options)

			const value = await proxy[prop]

			if(prop == "title" || prop == "Title") {
				title = value
			}

			properties = [...properties, {
				name: prop, 
				value,
				options,
				onChange: (value) => proxy[propertyNameToSetterName(prop)](value)
			}]
			
		}

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

  async function populateFromPerspective() {
	if(perspective.sharedUrl) {
		let nh = await ad4m.expression.get(perspective.sharedUrl)
		nh = JSON.parse(nh.data)
		linkLanguageMeta = await ad4m.languages.meta(nh.linkLanguage)
	} else {
		linkLanguageMeta = null
	}
  }

  async function update() {
	if(!perspectiveID) {
		perspective = null
		linkLanguageMeta = null
		return 
	}

	await ensuerAd4mClient()
	await ensurePerspective()

	properties = []

	if(expression && expression != "ad4m://self") {
		populateFromExpression()
	} else {
		populateFromPerspective()
	}
  }

  onMount(async () => {
	update()
  })

  $: if (perspectiveID || !perspectiveID || expression) {
	update()
  }




  async function handleSaveName() {
    isEditingPerspectiveName = false;
	await ad4m.perspective.update(perspective.uuid, nameInput.value)
	perspective = await ad4m.perspective.byUUID(perspectiveID)
  }

  
  let propertySelect
  let collapsed = false
</script>


<svelte:window on:mouseup={stop} on:mousemove={move}/>
<div class="properties-container" style="right: {right}px; top: {top}px;" on:mousedown={start}>
  <span class="title">
		Properties
		<div class="window-controls">
			{#if collapsed}
				<j-button variant="link"
					on:click={()=>collapsed = false}>
					<j-icon style="color: white" name="arrows-angle-expand"/>
				</j-button>
			{:else}
				<j-button variant="link"
					on:click={()=>collapsed = true}>
					<j-icon style="color: white" name="arrows-angle-contract"/>
				</j-button>
			{/if}
		</div>
  </span>
  {#if !collapsed}
  {#if perspective}
	{#if expression == "ad4m://self"}
		<j-box pb="800">
			<j-text variant="heading" size="600" weight="bold">Perspective settings</j-text>
			<j-flex gap="200" j="start" a="end">
				<j-text variant="label">Name: </j-text>
				{#if isEditingPerspectiveName}
					<j-input
						type="text"
						full="true"
						value={perspective.name}
						bind:this={nameInput}
						on:keydown={(event) => {
							if(event.key === 'Enter') {
								handleSaveName()
							}
							event.stopPropagation()
						}}
						on:blur={() => isEditingPerspectiveName = false}
					/>
				{:else}
					<j-text variant="label" weight="bold">{perspective.name || '<not set>'}</j-text>
					<j-button size="xs" variant="link" style="padding-bottom: 3px"
						on:click={() => isEditingPerspectiveName = true} 
					>
						<j-icon name="pencil" size="xs" />
					</j-button>
				{/if}
			</j-flex>
		</j-box>
			

		<j-box>
			<j-text variant="heading-sm" size="400">Sharing / Neighbourhood</j-text>
			
				<j-text variant="label">URL:</j-text>
				<j-text variant="label" weight="bold">{perspective.sharedUrl || '<not shared>'}</j-text>
			

			{#if linkLanguageMeta}
				<j-box pt="400" pb="400">
					<j-text variant="heading-sm" size="400">Link Language:</j-text>
					<j-text variant="label" weight="bold">{linkLanguageMeta.name}</j-text>
					<j-text variant="label" weight="bold">{linkLanguageMeta.address}</j-text>
					<j-flex gap="200" j="start" a="end">
						<j-text variant="label">Description:</j-text>
						<j-text variant="label" weight="bold">{linkLanguageMeta.description}</j-text>
					</j-flex>
				</j-box>
				
			
				{#if linkLanguageMeta.templated}
					<j-box pb="400">
						<j-text variant="heading-sm" size="400">Templated</j-text>
						<j-text variant="label">Source:</j-text>
						<j-text variant="label" weight="bold">{linkLanguageMeta.templateSourceLanguageAddress}</j-text>
						<j-text variant="label">Template parameters:</j-text>
						<j-text variant="label" weight="bold">{linkLanguageMeta.templateAppliedParams}</j-text>
					</j-box>
				{/if}
				{#if linkLanguageMeta.sourceCodeLink}
					<j-flex gap="200" j="start" a="end">
						<j-text variant="label">Source code link:</j-text>
						<j-text variant="label" weight="bold">{linkLanguageMeta.sourceCodeLink}</j-text>
					</j-flex>
				{/if}
			{/if}
		
		</j-box>

		<j-box pt="300">
			<j-button color="red" variant="transparent" size="xs"
				on:click={() => {
					if(window.confirm("Are you sure you want to delete this perspective?")) {
						ad4m.perspective.remove(perspective.uuid)
						dispatch('perspectiveDeleted', perspective.uuid)
					}
				}}
			>
				Delete Perspective
			</j-button>
		</j-box>
	{:else}
		<div class="header">
			{#if title}
				{#if title.length > 50}
					<j-text variant="heading" size="800" weight="bold">{title.slice(0, 50)}...</j-text>
				{:else}
					<j-text variant="heading" size="800" weight="bold">{title}</j-text>
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
								bind:this={editingProp}
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
  {:else}
	<j-spinner></j-spinner>
  {/if}
  {/if}
  <j-modal bind:this={cropDialog} class="modal">
	<header class="header" slot="header">
	  <j-text variant="heading">Set Background for {title}</j-text>
	  <ImageCropper 
	  	bind:this={cropper} 
		on:cancel={() => cropDialog.open = false}
		on:cropped={(event) => {
			cropDialog.open = false
			handleSetBackgroundImage(event.detail)
		}}
	></ImageCropper>
	</header>
  </j-modal>
  
</div>

<style>
  .properties-container {
	position: absolute;
	cursor: move;
    display: flex;
    flex-direction: column;
    width: 250px;
    background-color: #f5f5f5c5;
    
  }

  .title {
      display: block;
      margin: 0;
      font-size: 24px;
      color: white;
      background-color: black;
      padding: 8px 5px;
	  line-height: 38px;
    }

  .window-controls {
	float: right;
  } 
  
  .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 50px;
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
