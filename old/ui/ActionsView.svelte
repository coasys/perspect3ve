<script lang="ts">
    import Textfield, { Textarea } from '@smui/textfield';
    import Button, { Label, Icon as ButtonIcon } from '@smui/button';
    import { Link, LinkQuery, Literal, PerspectiveProxy } from '@perspect3vism/ad4m';
    import Card, { Content, Actions, ActionButtons } from '@smui/card';
    import Select, { Option } from '@smui/select';
    import hljs from 'highlight.js'

    export let perspective: PerspectiveProxy
    
    let existingActions = []
    let newName = ''
    let newCode = []
    let newCommand = 'addLink'
    let newParams1 = ''
    let newParams2 = ''
    let newParams3 = ''

    async function addCommand() {
        let command = {
            action: newCommand
        }
        //@ts-ignore
        command.source = newParams1
        //@ts-ignore
        command.predicate = newParams2
        //@ts-ignore
        command.target = newParams3
        newCode = [...newCode, command]
    }

    async function add() {
        const actionNode = `ad4m://expression_action:${newName}`
        await perspective.add(new Link({
            source: 'self',
            predicate: 'ad4m://has_action',
            target: actionNode
        }))

        await perspective.add(new Link({
            source: actionNode,
            predicate: 'ad4m://has_body',
            target: Literal.from(newCode).toUrl()
        }))
    }

    async function update() {
        let links = await perspective.get(new LinkQuery({
            source: 'self',
            predicate: 'ad4m://has_action'
        }))

        const urlPrefix = 'ad4m://expression_action:'
        links = links.filter(l=>l.data.target.startsWith(urlPrefix))

        existingActions = []
        for(let link of links) {
            console.log(link.data)
            
            const actionNode = link.data.target
            const name = actionNode.substr(urlPrefix.length)

            console.log('actionNode', actionNode)
            let bodyLinks = await perspective.get(new LinkQuery({
                source: actionNode,
                predicate: 'ad4m://has_body'
            }))
            console.log('bodyLinks', bodyLinks)

            if(bodyLinks.length == 1) {
                const bodyLink = bodyLinks[0]
                existingActions = [...existingActions, {
                    link,
                    code: Literal.fromUrl(bodyLink.data.target).get(),
                    name
                }]
            }
        }
    }

    function deleteAction(action) {
        perspective.remove(action.link)
    }

    perspective.addListener(() => {
        update()
        return null
    })

    perspective.removeListener(() => {
        update()
        return null
    })

    update()

</script>

{#each existingActions as action}
<Card variant="outlined">
    <Content>
        <div class="action-name">{action.name}</div>
        <div class="action-code">
            <ul>
                {#each action.code as cmd}
                    <li>
                    {#if cmd.action == 'addLink'}
                        addLink({cmd.source},{cmd.predicate},{cmd.target})
                    {:else if cmd.action == 'removeLink'}
                        removeLink({cmd.source},{cmd.predicate},{cmd.target})
                    {:else}
                        unrecognized command
                    {/if}
                    </li>
                {/each}
            </ul>
        </div>
    </Content>
    <Actions>
        <ActionButtons>
            <Button variant="outlined" on:click={()=>deleteAction(action)}>
                <ButtonIcon class="material-icons">delete</ButtonIcon>
                <Label>Delete</Label>
            </Button>
        </ActionButtons>
    </Actions>
</Card>


{/each}

<hr>
<h3>Create new perspective action</h3>
<Textfield 
    bind:value={newName} 
    variant="outlined" 
    label="New Action Name">
</Textfield>

<ul>
    {#each newCode as cmd}
        <li>
        {#if cmd.action == 'addLink'}
            addLink({cmd.source},{cmd.predicate},{cmd.target})
        {:else if cmd.action == 'removeLink'}
            removeLink({cmd.source},{cmd.predicate},{cmd.target})
        {:else}
            unrecognized command: {cmd.action}
        {/if}
        </li>
    {/each}
</ul>

<Card>
    <Content>
        <Select class="shaped-outlined"
        variant="outlined"
        bind:value={newCommand}
        label="Command type">
            <Option value="addLink">addLink</Option>
            <Option value="removeLink">removeLink</Option>
        </Select>
        
        <div class="params">
            <Textfield 
                bind:value={newParams1} 
                variant="outlined" 
                label="source">
            </Textfield>
            <Textfield 
                bind:value={newParams2} 
                variant="outlined" 
                label="predicate">
            </Textfield>
            <Textfield 
                bind:value={newParams3} 
                variant="outlined" 
                label="target">
            </Textfield>
        </div>
    </Content>
    <ActionButtons>
        <Button on:click={addCommand}>
            <Label>Add Command</Label>
        </Button>
    </ActionButtons>
</Card>



<Button on:click={add} enabled={newCode.length > 0}>
    <Label>Write new Action</Label>
</Button>

<style>
    .action-name {
        font-weight: bold;
    }

    .zome-code {
        overflow: scroll;
        white-space: pre;
    }

    .new-command {
        border: 1px black solid;
        border-radius: 10px;
    }

    .params {
        display: flex;
    }
</style>