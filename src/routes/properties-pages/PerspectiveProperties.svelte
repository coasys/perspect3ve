<script lang="ts">
    import { PerspectiveProxy, type Ad4mClient } from '@perspect3vism/ad4m';
    import { getAd4mClient } from '@perspect3vism/ad4m-connect';
    import { onMount } from 'svelte';
    import NeighbourhoodSharing from '../NeighbourhoodSharing.svelte';
    export let perspectiveID: string = ""

    let ad4m: Ad4mClient
    let perspective: PerspectiveProxy|null = null

    let isEditingPerspectiveName = false
    let nameInput

    async function ensuerAd4mClient() {
        if (!ad4m) ad4m = await getAd4mClient()
    }

    async function ensurePerspective() {
        if (!perspective || perspective.uuid != perspectiveID) {
            perspective = await ad4m.perspective.byUUID(perspectiveID)
        }
    }

    async function populateFromPerspective() {
        if(perspective!.sharedUrl) {
            let nh = await ad4m.expression.get(perspective!.sharedUrl)
            nh = JSON.parse(nh.data)
        }
    }

    async function update() {
        if(!perspectiveID) {
            perspective = null
            return 
        }

        await ensuerAd4mClient()
        await ensurePerspective()

        populateFromPerspective()
    }

    onMount(async () => {
        update()
    })

    $: if (perspectiveID || !perspectiveID) {
        update()
    }




  async function handleSaveName() {
    isEditingPerspectiveName = false;
	await ad4m.perspective.update(perspective.uuid, nameInput.value)
	perspective = await ad4m.perspective.byUUID(perspectiveID)
  }

</script>
{#if perspective}
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
        <NeighbourhoodSharing perspective={perspective} />
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

{/if}

