<script lang="ts">
    import Textfield, { Textarea } from '@smui/textfield';
    import Button, { Label, Icon as ButtonIcon } from '@smui/button';
    import { Link, LinkQuery, Literal, PerspectiveProxy } from '@perspect3vism/ad4m';
    import Card, { Content, Actions, ActionButtons } from '@smui/card';
    import hljs from 'highlight.js'

    export let perspective: PerspectiveProxy
    
    let editorInput
    let existingZomes = []

    async function add() {
        const literal = Literal.from(editorInput)
        await perspective.add(new Link({
            source: 'self',
            predicate: 'ad4m://has_zome',
            target: literal.toUrl()
        }))
        editorInput = ''
    }

    async function update() {
        let links = await perspective.get(new LinkQuery({
            source: 'self',
            predicate: 'ad4m://has_zome'
        }))

        let inactiveLinks = await perspective.get(new LinkQuery({
            source: 'self',
            predicate: 'ad4m://has_inactive_zome'
        }))

        existingZomes = [
            ...links.map(link => {
                return {
                    link,
                    code: Literal.fromUrl(link.data.target).get(),
                    active: true
                }
            }),
            ...inactiveLinks.map(link => {
                return {
                    link,
                    code: Literal.fromUrl(link.data.target).get(),
                    active: false
                }
            })
        ]
    }

    function deleteZome(zome) {
        perspective.remove(zome.link)
    }

    function makeInactiveZome(zome) {
        perspective.remove(zome.link)
        perspective.add(new Link({
            ...zome.link.data,
            predicate: 'ad4m://has_inactive_zome'
        }))
    }

    function makeActiveZome(zome) {
        perspective.remove(zome.link)
        perspective.add(new Link({
            ...zome.link.data,
            predicate: 'ad4m://has_zome'
        }))
    }

    perspective.addListener('link-added', update)
    perspective.addListener('link-removed', update)


    update()

</script>

{#each existingZomes as zome}
<Card variant="outlined">
    <Content>
        <div class="zome-code" class:inactive={!zome.active}>
            {@html hljs.highlight(zome.code, {language: 'prolog'}).value}
        </div>
    </Content>
    <Actions>
        <ActionButtons>
            <Button variant="outlined" on:click={()=>deleteZome(zome)}>
                <ButtonIcon class="material-icons">delete</ButtonIcon>
                <Label>Delete</Label>
            </Button>

            {#if zome.active}
                <Button variant="outlined" on:click={()=>makeInactiveZome(zome)}>
                    <ButtonIcon class="material-icons">toggle_off</ButtonIcon>
                    <Label>Deactivate</Label>
                </Button>
            {:else}
                <Button variant="outlined" on:click={()=>makeActiveZome(zome)}>
                    <ButtonIcon class="material-icons">toggle_on</ButtonIcon>
                    <Label>Activate</Label>
                </Button>
            {/if}
        </ActionButtons>
    </Actions>
</Card>


{/each}


<Textarea
    class="shaped-outlined"
    bind:value={editorInput}
    variant="outlined"
></Textarea>

<Button on:click={add}>
    <Label>Add</Label>
</Button>

<style>
    .zome-code {
        overflow: scroll;
        white-space: pre;
    }

    .inactive {
        opacity: 0.4;
    } 
</style>