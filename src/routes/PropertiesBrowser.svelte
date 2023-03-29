<script lang="ts">
  import type { PerspectiveProxy, Ad4mClient } from '@perspect3vism/ad4m';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { onMount } from 'svelte';

  import PerspectiveProperties from './properties-pages/PerspectiveProperties.svelte';
  import ExpressionProperties from './properties-pages/ExpressionProperties.svelte';

  export let perspectiveID: string
  export let expression: string
  export let parent: string
  

  let ad4m: Ad4mClient
  let perspective: PerspectiveProxy|null = null

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
	if(!perspectiveID) {
		perspective = null
		return 
	}

	await ensuerAd4mClient()
	await ensurePerspective()
  }

  onMount(async () => {
	update()
  })

  $: if (perspectiveID || !perspectiveID || expression) {
	update()
  }

</script>

<div class="properties-container">
  {#if perspective}
	{#if expression == "ad4m://self"}
		<PerspectiveProperties perspectiveID={perspectiveID} />
	{:else}
		<ExpressionProperties 
			ad4m={ad4m}
			perspective={perspective}
			expression={expression} 
			parent={parent} />
	{/if}
  {:else}
	<j-spinner></j-spinner>
  {/if}
</div>

<style>
  .properties-container {
  }
</style>
