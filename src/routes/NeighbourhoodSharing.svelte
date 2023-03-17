<script lang="ts">
    import { type Ad4mClient, type PerspectiveProxy } from '@perspect3vism/ad4m';
    import { getAd4mClient } from '@perspect3vism/ad4m-connect';
    import { onMount } from 'svelte/internal';

    let ad4m: Ad4mClient
    export let perspective: PerspectiveProxy
    let linkLanguageMeta

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

    async function populateFromPerspective() {
        if(perspective.sharedUrl) {
            let nh = await ad4m.expression.get(perspective.sharedUrl)
            nh = JSON.parse(nh.data)
            linkLanguageMeta = await ad4m.languages.meta(nh.linkLanguage)
        } else {
            linkLanguageMeta = null
        }
    }

    onMount(async () => {
        await ensuerAd4mClient()
        //await ensurePerspective()
        await populateFromPerspective()
    })

    $: if(perspective) populateFromPerspective()
</script>

{#if perspective}
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
{/if}