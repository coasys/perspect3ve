<script lang="ts">
    export let perspective
    export let perspectiveId

    import Textfield, {Input} from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text/index';
	import FloatingLabel from '@smui/floating-label';
    import LineRipple from '@smui/line-ripple';
    import Button, {Label} from '@smui/button';
    import Select, {Option} from '@smui/select';
    import { getContext, createEventDispatcher } from 'svelte';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import { v4 as uuid } from 'uuid'
    import { Circle3 } from 'svelte-loading-spinners'
    import type { Ad4mClient } from '@perspect3vism/ad4m';
    import { Perspective } from '@perspect3vism/ad4m';

    const ad4m: Ad4mClient = getContext('ad4mClient')

    let showPublishPanel = false
    let publishLinkLanguage = ''
    let publishName = ''
    let publishDescription = ''
    let publishUUID = uuid()
    let isPublishing = false
    let linkLanguages = []
    let publishingStatus = ''
    let publishedLinkLanguage

    let perspectiveTemp = {name: '<loading>'}

    const dispatch = createEventDispatcher();

    async function init() {
        const addresses = await ad4m.runtime.knownLinkLanguageTemplates()

        linkLanguages = []
        for(const adr of addresses) {
            try{
                linkLanguages.push(await ad4m.languages.meta(adr))
            } catch(e) {
                console.warn(e)
            }
        }

        console.log("LinkLanguages:", linkLanguages)
        update()
    }

    init()

    async function update() {
        console.log("update:", perspective, perspectiveId)
        const uuid = perspective ? perspective.uuid : perspectiveId
        if(!uuid) return
        perspective = await ad4m.perspective.byUUID(uuid)
        perspectiveTemp = JSON.parse(JSON.stringify(perspective))
        perspectiveTemp.name = perspective.name

        if(perspective.sharedUrl) {
            let nh = await ad4m.expression.get(perspective.sharedUrl)
            nh = JSON.parse(nh.data)
            console.log('NH:', nh)
            const linkLanguageMeta = await ad4m.languages.meta(nh.linkLanguage)
            console.log(linkLanguageMeta)
            publishedLinkLanguage = linkLanguageMeta
        }
    }

    

    ad4m.perspective.addPerspectiveUpdatedListener(update)

    async function save() {
        await ad4m.perspective.update(perspective.uuid, perspectiveTemp.name)
        dispatch('submit', perspective.uuid)
    }

    function cancel() {
        dispatch('cancel')
    }

    async function publish() {
        isPublishing = true

        publishingStatus = "Cloning LinkLanguage..."
        console.log("publishLinkLanguage:", publishLinkLanguage)

        const uniqueLinkLanguage = await ad4m.languages.applyTemplateAndPublish(
            publishLinkLanguage, 
            JSON.stringify({ uuid: publishUUID, name: `Social-Context LinkLanguage for NH: ${publishName}` })
        );

        publishingStatus = `LinkLanguage cloned with address: ${uniqueLinkLanguage.address}!\nPublishing Neighbourhood...`

        // TODO: add name, type (or linkLanguage name) and description to meta perspective
        const meta = new Perspective()
        const neighbourhoodUrl = await ad4m.neighbourhood.publishFromPerspective(
            perspective.uuid,
            uniqueLinkLanguage.address,
            meta
        )

        publishingStatus = 'Done!'

        isPublishing = false
        showPublishPanel = false
    }

    function randomizeUuid() {
        publishUUID = uuid()
    }

</script>

{#if perspective}
<div class="perspective-settings-container">
    <DataTable> 
        <Body>
            <Row>
                <Cell>Name:</Cell>
                <Cell><Textfield bind:value={perspective.name} label="Name" /></Cell>
            </Row>
            <Row>
                <Cell>Sharing:</Cell>
                {#if perspective.sharedUrl}
                    <Cell>
                        <h3>This Perspective is shared</h3>
                        <div>
                            <span>{perspective.sharedUrl}</span>
                        </div>
                        {#if publishedLinkLanguage}
                        <div>
                            <h4>Link Language</h4>
                            <div>
                                <span>Name:</span>
                                <span>{publishedLinkLanguage.name}</span>
                            </div>
                            <div>
                                <span>Description:</span>
                                <span>{publishedLinkLanguage.description}</span>
                            </div>
                            <div>
                                <span>Address:</span>
                                <span>{publishedLinkLanguage.address}</span>
                            </div>
                            {#if publishedLinkLanguage.templated}
                            <div>
                                <span>Template source:</span>
                                <span>{publishedLinkLanguage.templateSourceLanguageAddress}</span>
                            </div>
                            <div>
                                <span>Template parameters:</span>
                                <span>{publishedLinkLanguage.templateAppliedParams}</span>
                            </div>
                            {/if}
                            {#if publishedLinkLanguage.sourceCodeLink}
                            <div>
                                <span>Source code link:</span>
                                <span>{publishedLinkLanguage.sourceCodeLink}</span>
                            </div>
                            {/if}
                        </div>
                        {/if}
                        <!--
                        <div>
                            <span>Name: </span>
                            <span>{perspective.sharedPerspective.name}</span>
                        </div>
                        <div>
                            <span>Description: </span>
                            <span>{perspective.sharedPerspective.description}</span>
                        </div>
                        <div>
                            <span>Type: </span>
                            <span>{perspective.sharedPerspective.type}</span>
                        </div>
                        -->
                    </Cell>
                {:else}
                    <Cell>
                        {#if showPublishPanel}
                            <h3>Publish as</h3>
                            <!--
                            <Textfield fullwidth lineRipple={false} label="Name">
                                <Input bind:value={publishName} id="input-name" aria-controls="name-helper-text" aria-describedby="name-helper-text" />
                                <FloatingLabel for="input-name">Name</FloatingLabel>
                                <LineRipple />
                            </Textfield>
                            <HelperText id="name-helper-text">Name of the shared Perspective others will see</HelperText>
                            
                            <Textfield fullwidth lineRipple={false} label="Description">
                                <Input bind:value={publishDescription} id="input-desc" aria-controls="desc-helper-text" aria-describedby="desc-helper-text" />
                                <FloatingLabel for="input-desc">Description</FloatingLabel>
                                <LineRipple />
                            </Textfield>
                            <HelperText id="desc-helper-text">Text describing the shared Perspective</HelperText>
                            -->
                            <Select bind:value={publishLinkLanguage} label="Link Language">
                                {#each linkLanguages as linkLanguage}
                                    <Option value={linkLanguage.address} selected={false}>{linkLanguage.name}</Option>
                                {/each}
                            </Select>

                            <Textfield fullwidth lineRipple={false} label="UUID for LinkLanguage clone">
                                <Input bind:value={publishUUID} id="input-uuid" aria-controls="uuid-helper-text" aria-describedby="uuid-helper-text" />
                                <FloatingLabel for="input-uuid">UUID for LinkLanguage clone</FloatingLabel>
                                <LineRipple />
                            </Textfield>
                            <HelperText id="uuid-helper-text">An arbitrary string that makes this LinkLanguage clone unique</HelperText>
                            <Button variant="raised" on:click={randomizeUuid}>
                                Randomize
                            </Button>



                            <p>
                                {#if isPublishing}
                                    {publishingStatus} <Circle3></Circle3>
                                {/if}
                            </p>

                            <Button variant="raised" on:click={publish}>
                                Publish!
                            </Button>
                            <Button variant="outlined" on:click={() => showPublishPanel=false}>
                                Cancel
                            </Button>
                        {:else}
                            <h3>This Perspective is private</h3>
                            <p></p>
                            <Button variant="raised" on:click={() => showPublishPanel=true}>
                                Publish Perspective...
                            </Button>
                        {/if}
                    </Cell>
                {/if}
            </Row>
        </Body>
    </DataTable>
</div>

<Button variant="raised" on:click={save} style="margin: 40px; padding: 25px;">
    <Label>Save</Label>
</Button>
<!--
<Button variant="outlined" on:click={cancel}>
    <Label>Cancel</Label>
</Button>
-->

{/if}
<style>
    .perspective-settings-container {
        float: left;
    }
</style>