<script lang="ts">
    import { LanguageMeta, Perspective, type Ad4mClient, type PerspectiveProxy } from '@perspect3vism/ad4m';
    import { getAd4mClient } from '@perspect3vism/ad4m-connect';
    import { onMount } from 'svelte/internal';
    import { v4 as uuidv4 } from 'uuid';


    let ad4m: Ad4mClient
    export let perspective: PerspectiveProxy
    let linkLanguageMeta
    let showSharing = false

    let linkLanguageTemplates = []
    let linkLanguageSelect
    let selectedLinkLanguage
    let selectedMeta

    async function ensuerAd4mClient() {
        if (!ad4m) {
            ad4m = await getAd4mClient()
        }
    }

    async function getLinkLanguages() {
        try {
            await ensuerAd4mClient()
            await new Promise(r => setTimeout(r, 1000))
            console.log("getting link languages")
            const result = await ad4m.runtime.knownLinkLanguageTemplates()
            console.log("knownLinkLanguageTemplates", result)
            linkLanguageTemplates = []
            for(let address of result) {
                const meta = await ad4m.languages.meta(address)
                linkLanguageTemplates = [...linkLanguageTemplates, {address, meta}]
            }
            selectedLinkLanguage = linkLanguageTemplates[0]
        }catch(e) {
            console.error("Error getting link languages", e)
        }
        
    }

    async function populateFromPerspective() {
        await ensuerAd4mClient()
        if(perspective.sharedUrl) {
            let nh = await ad4m.expression.get(perspective.sharedUrl)
            nh = JSON.parse(nh.data)
            linkLanguageMeta = await ad4m.languages.meta(nh.linkLanguage)
        } else {
            linkLanguageMeta = null
        }
    }

    async function update() {
        await ensuerAd4mClient()
        await getLinkLanguages()   
    }

    onMount(async () => {
        await update()
    })

    $: if(perspective) {
        populateFromPerspective()
    }

    let sharingInProgress = false
    let sharingProgressMessage = ""
    let sharingError = null
    async function shareToNeighbourhood() {
        try {
            sharingInProgress = true
            sharingProgressMessage = "Cloning link language..."

            const values = {
                name: selectedMeta.name + " " + perspective.name,
                description: selectedMeta.description,
                uid: uuidv4()
            }
            
            const stringified = JSON.stringify(values)

            const newLinkLanguage = await ad4m.languages.applyTemplateAndPublish(selectedMeta.address, stringified)
            sharingProgressMessage = "Publishing Neighbourhood..."
            const newNeighbourhood = await ad4m.neighbourhood.publishFromPerspective(perspective.uuid, newLinkLanguage.address, new Perspective())
            sharingProgressMessage = "Published successfully as " + newNeighbourhood.sharedUrl
            perspective = await ad4m.perspective.byUUID(perspective.uuid)
            linkLanguageMeta = newLinkLanguage
            sharingInProgress = false
        } catch(e) {
            sharingInProgress = false
            sharingError = e.message
            console.error("Error sharing neighbourhood", e)
        }
    }

    
</script>

{#if perspective}
    
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
    {:else}
        {#if !showSharing}
            <j-button variant="transparent" on:click={()=>{showSharing=true}}>Share as collaborative Neighbourhood...</j-button>
        {:else}
            <j-text variant="label">Select Link Language:</j-text>
            <j-select 
                inputvalue="1" 
                bind:this={linkLanguageSelect}
                on:change={async (e) => {
                    if(e.detail != undefined) {
                        await getLinkLanguages()
                        const { address, meta } = linkLanguageTemplates[e.detail]
                        selectedLinkLanguage = address
                        selectedMeta = meta
                    } else {
                        selectedLinkLanguage = null
                        selectedMeta = null
                    }
                    
                }}

            >
                <j-menu>
                    {#each linkLanguageTemplates as { meta, address }}
                        <j-menu-item 
                            value="{address}"
                            selected="{address === selectedLinkLanguage}"
                        >{meta.name}</j-menu-item>
                    {/each}
                </j-menu>
            </j-select>
            {#if selectedMeta}
                <j-box>
                    <j-text variant="label">Address:</j-text>
                    <j-text variant="label" weight="bold">{selectedMeta.address}</j-text>
                    <j-text variant="label">Description:</j-text>
                    <j-text variant="label" weight="bold">{selectedMeta.description}</j-text>
                    <j-text variant="label">Author:</j-text>
                    <j-text variant="label" weight="bold">{selectedMeta.author}</j-text>
                    {#if selectedMeta.sourceCodeLink}
                        <j-flex gap="200" j="start" a="end">
                            <j-text variant="label">Source code link:</j-text>
                            <j-text variant="label" weight="bold">{selectedMeta.sourceCodeLink}</j-text>
                        </j-flex>
                    {/if}
                </j-box>
                <j-button variant="primary" on:click={shareToNeighbourhood} disabled={sharingInProgress}>Share</j-button>
                {#if sharingInProgress}
                    <j-spinner />
                    <j-text variant="label">{sharingProgressMessage}</j-text>
                {/if}
                {#if sharingError}
                    <j-text variant="label" class="error">{sharingError}</j-text>
                {/if}
            {/if}
        {/if}
    {/if}
{/if}

<style>
    .error {
        color: red;
    }
</style>