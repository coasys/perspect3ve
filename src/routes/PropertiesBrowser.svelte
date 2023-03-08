<script lang="ts">
  import '@junto-foundation/junto-elements';
  import '@junto-foundation/junto-elements/dist/main.css';
  import { parseExprUrl, type Ad4mClient, type PerspectiveProxy } from '@perspect3vism/ad4m';
  import { Literal, LinkQuery } from '@perspect3vism/ad4m';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { onMount, createEventDispatcher } from 'svelte';

  export let perspectiveID
  export let expression

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

  const dispatch = createEventDispatcher();

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

  async function update() {
	
	console.log("properties browser update", perspectiveID, expression)
	if(!perspectiveID) {
		perspective = null
		linkLanguageMeta = null
		return 
	}

	await ensuerAd4mClient()
	await ensurePerspective()
	
	if(expression && expression != "ad4m://self") {
		expressionData = null
		// First trying to handle expression as Literal
		try {
			console.log("trying to get literal from url", expression)
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
		} catch(e) {
			//console.error(e)
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
	} else {
		if(perspective.sharedUrl) {
			let nh = await ad4m.expression.get(perspective.sharedUrl)
			nh = JSON.parse(nh.data)
			linkLanguageMeta = await ad4m.languages.meta(nh.linkLanguage)
		} else {
			linkLanguageMeta = null
		}
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

  
</script>

<div class="properties-container">
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
			{#each properties as { name, value }}
			<div class="property">
				<div class="name">{name}</div>
				<div class="value">{value}</div>
			</div>
			{/each}
		</div>
	{/if}
  {:else}
	<j-spinner></j-spinner>
  {/if}
</div>

<style>
  .properties-container {
    display: flex;
    flex-direction: column;
    width: 250px;
    background-color: #f5f5f5;
    padding: 20px;
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
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 10px;
  }
  
  .property {
    display: flex;
    flex-direction: column;
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
</style>
