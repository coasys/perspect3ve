<script lang="ts">
    import type { PerspectiveProxy } from '@perspect3vism/ad4m';
    import Dialog, { Title, Content, Actions } from '@smui/dialog';
    import ExpressionConstructorWizard from './ExpressionConstructorWizard.svelte';
    import Button, { Label, Icon as ButtonIcon } from '@smui/button';
    import { createEventDispatcher } from 'svelte';
    import { executeCustomAction } from "./executeCustomAction";

    const dispatch = createEventDispatcher();

    export let perspective: PerspectiveProxy

    let expressionWizard
    let expressionWizardDialog
    let classBeingInstantiated

    interface OntologyClass {
        Name: string,
        Action: string,
        Color: string
    }

    let ontologyClasses: OntologyClass[] = []

    perspective.infer("register_ontology_class(Name, c), instantiate_class(c, Action), class_color(c, Color)").then(results => {
        ontologyClasses = results
        console.log(ontologyClasses)
    })

    function classClicked(name: string) {
        classBeingInstantiated = name
        expressionWizard.reset()
        expressionWizardDialog.open()
    }

    async function expressionCreated(e) {
        let url = e.detail
        let ontologyClass = ontologyClasses.find(c => c.Name == classBeingInstantiated)
        if(!ontologyClass) {
            console.error("Could not find ontology class!")
            return
        }

        await perspective.add({source: 'ad4m://self', target: url})
        console.debug(ontologyClass.Action)
        let action = eval(ontologyClass.Action)
        await executeCustomAction(action, url, perspective)
        
        expressionWizardDialog.close()
    }
        


</script>

<div class="palette-container">
    <div class="palette-item">
        <span class="material-icons">text_fields</span>
    </div>
    {#each ontologyClasses as customClass}
        <div class="palette-item" on:click={()=>classClicked(customClass.Name)}>
            <span title="{customClass.Name}" class="ontology-class" style={`background-color: ${customClass.Color};`}>
                <span class="ontology-class-text">{customClass.Name}</span>
            </span>
        </div>
    {/each}
</div>

<div class="dialog-class">
    <Dialog bind:this={expressionWizardDialog}>
        <Title>Create Expression as base for {classBeingInstantiated}</Title>
        <Content>
            <i>Select language of base experssion:</i>
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
</div>


<style>
   .palette-container {
        background-color: bisque;
        width: 50px;
   } 

   .palette-item {
        width: 50px;
        height: 50px;
        padding: 3px;    
   }

   .ontology-class {
        position: relative;
        width: 42px;
        height: 42px;
        display: block;
        border-radius: 25px;
   }

   .ontology-class-text {   
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 10px;
   }

   .dialog-class {
    width: 444px;
    height: 419px;
   } 
</style>
