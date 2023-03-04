<script>
  import '@junto-foundation/junto-elements';
  import '@junto-foundation/junto-elements/dist/main.css';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { onMount } from 'svelte';

  export let perspectiveID
  export let expression

  let ad4m
  let perspective

  let isEditingPerspectiveName = false
  let editName
  let nameInput

  async function ensuerAd4mClient() {
	if (!ad4m) {
		ad4m = await getAd4mClient()
	}
  }

  async function update() {
	console.log("update settings", perspectiveID)
	await ensuerAd4mClient()
	perspective = await ad4m.perspective.byUUID(perspectiveID)
	editName = perspective.name
  }

  onMount(async () => {
	update()
  })

  $: if (perspectiveID) {
	update()
  }

  const item = {
    title: 'Sample Item',
    description: 'This is a sample item.',
    author: 'John Doe',
    timestamp: 'March 1, 2023'
  };
  
  const properties = [
    { name: 'Property 1', value: 'Value 1' },
    { name: 'Property 2', value: 'Value 2' },
    { name: 'Property 3', value: 'Value 3' }
  ];

  function handleEditName() {
    isEditingPerspectiveName = true;
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
		<div class="header">
			<j-text variant="heading" size="800" weight="bold">Perspective settings</j-text>
			<j-text variant="label">Name:</j-text>
			{#if isEditingPerspectiveName}
				<j-input
					type="text"
					full="true"
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
				<j-flex>
					<j-text>{perspective.name || '<not set>'}</j-text>
						<j-button size="xs" variant="link" circle="true"
							on:click={() => isEditingPerspectiveName = true} 
						>
							<j-icon name="pencil" size="small" />
						</j-button>
				</j-flex>
				
			{/if}
			
			<div class="author">{item.author}</div>
			<div class="timestamp">{item.timestamp}</div>
		</div>
	{:else}
		<div class="header">
			<j-text variant="heading" size="800" weight="bold">{item.title}</j-text>
			<j-text class="description">{item.description}</j-text>
			<div class="author">{item.author}</div>
			<div class="timestamp">{item.timestamp}</div>
		</div>
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
    width: 300px;
    background-color: #f5f5f5;
    padding: 20px;
  }
  
  .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
  }
  
  .title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
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
