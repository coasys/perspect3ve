<script lang="ts">
  import { Agent, Link, LinkExpression, parseExprUrl, Perspective, PerspectiveProxy, SmartLiteral, type Ad4mClient } from '@perspect3vism/ad4m';
  import { Literal, LinkQuery } from '@perspect3vism/ad4m';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { onMount, createEventDispatcher, afterUpdate, getContext } from 'svelte';
  
  import { PROFILE_NAME } from './config';

  import PerspectiveProperties from './properties-pages/PerspectiveProperties.svelte';
  import ExpressionProperties from './properties-pages/ExpressionProperties.svelte';

  export let perspectiveID
  export let expression
  export let parent
  

  let ad4m: Ad4mClient
  let perspective: PerspectiveProxy



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
		linkLanguageMeta = null
		return 
	}

	await ensuerAd4mClient()
	await ensurePerspective()

	properties = []

	if(expression && expression != "ad4m://self") {
		populateFromExpression()
	} 
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
