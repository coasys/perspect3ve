<svelte:options accessors={true}></svelte:options>
<script lang="ts">
    import { Link, PerspectiveProxy } from '@perspect3vism/ad4m';
    import Button, { Label, Icon as ButtonIcon } from '@smui/button';
    import Dialog, { Title, Content, Actions } from '@smui/dialog';
    import { createEventDispatcher } from 'svelte';
    import ExpressionConstructorWizard from './ExpressionConstructorWizard.svelte';
    import LinkUrlPicker from './LinkUrlPicker.svelte';

    const dispatch = createEventDispatcher();

    export let source=""
    export let predicate=""
    export let target=""
    export let perspective: PerspectiveProxy

    export function reset() {
        source = predicate = target = ""
    }

    let expressionWizard
    let expressionWizardDialog
    let targetForExpressionWizard

    function addLink() {
        perspective.add(new Link({
            source,
            predicate,
            target
        }))
        dispatch('ok')
    }

    export function createExpression(target: string) {
        targetForExpressionWizard = target
        expressionWizard.reset()
        expressionWizardDialog.open()
    }

    function expressionCreated(e) {
        let url = e.detail
        switch(targetForExpressionWizard) {
            case 'source': source = url; break;
            case 'target': target = url; break;
            case 'predicate': predicate = url; break;
        }
        expressionWizardDialog.close()
    }
    
</script>

<Dialog bind:this={expressionWizardDialog}>
    <Title>Create Expression</Title>
    <Content>
        <i>For {targetForExpressionWizard}</i>
        <ExpressionConstructorWizard
            bind:this={expressionWizard}
            on:expression-created={expressionCreated}>
        </ExpressionConstructorWizard>
    </Content>
    <Actions>
        <Button on:click={expressionWizardDialog.close}>
            <Label>Cancel</Label>
        </Button>
    </Actions>
</Dialog>

<div class="container">
    <div class="flex">
        <span class="paper">
            <LinkUrlPicker 
                label="Source" 
                bind:value={source} 
                on:pick={(e)=>dispatch('pick', e.detail)}
                on:create={()=>createExpression('source')}>
            </LinkUrlPicker>
        </span>
        <span class="paper">
            <LinkUrlPicker 
                label="Predicate" 
                bind:value={predicate}
                on:pick={(e)=>dispatch('pick', e.detail)}
                on:create={()=>createExpression('predicate')}>
            </LinkUrlPicker>
        </span>
        <span class="paper">
            <LinkUrlPicker 
                label="Target" 
                bind:value={target}
                on:pick={(e)=>dispatch('pick', e.detail)}
                on:create={()=>createExpression('target')}>
            </LinkUrlPicker>
        </span>
    </div>
    

    <Button variant="outlined" on:click={()=>dispatch('cancel')}>
        <Label>Cancel</Label>
    </Button>
    <Button variant="raised" on:click={addLink}>
        <Label>Add Link</Label>
    </Button>
</div>

<style>
    .container {
        margin-top: -200px;
        height: 200px;
        background-color: #ffffffe0;
        text-align: center;
    }

    .flex {
        display: flex;
        margin-bottom: 10px;
    }

    .paper {
        display: inline-block;
        flex: auto;
    }
</style>