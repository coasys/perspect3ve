<script lang="ts">
    import { getContext } from "svelte";
    import { Ad4mClient, Link, LinkQuery, Literal, PerspectiveProxy } from "@perspect3vism/ad4m"
    import Tab, { Icon, Label } from '@smui/tab';
    import TabBar from '@smui/tab-bar';
    import Perspective from './Perspective.svelte'
    import PerspectiveGraph from "./PerspectiveGraph.svelte";
    import ExpressionBrowser from './ExpressionBrowser.svelte';
    import PerspectiveSettings from './PerspectiveSettings.svelte';
    import AgentProfileSettings from './AgentProfileSettings.svelte';
    import Button, {Label as ButtonLabel, Icon as ButtonIcon} from '@smui/button';
    import IconButton from '@smui/icon-button';
    import PerspectiveShell from "./PerspectiveShell.svelte";
    import LinkWizard from "./LinkWizard.svelte";
    import PrologExpressionView from "./PrologExpressionView.svelte";
    import ActionsView from "./ActionsView.svelte";
    import { debounce } from "./uiUtils"
    import ConstructionPalette from "./ConstructionPalette.svelte";
    import { executeCustomAction } from "./executeCustomAction";

    export let uuid: string
    export let settings: string
    export let agentprofile: string

    const ad4m: Ad4mClient = getContext('ad4mClient')
    let perspective: PerspectiveProxy|null

    ad4m.perspective.byUUID(uuid).then((p)=>{
        perspective = p
        const debouncedUpdateToolbar = debounce(updateToolbar, 150)
        perspective.addListener("link-added", debouncedUpdateToolbar)
        perspective.addListener("link-removed", debouncedUpdateToolbar)
    })

    let showFooterPanel = false
    let showSidePanel = false
    let showLinkWizard = false

    let linkWizard
    let newLinkSource
    let newLinkPredicate
    let newLinkTarget

    let selectedExpression
    let customActions = []
    let sdnaFlows = []
    let sdnaFlowActions = {}
    let sdnaFlowStates = {}

    function openLinkWizard() {
        linkWizard.reset()
        showLinkWizard = true
    }

    let pickMode = false
    let pickTarget = ''

    function pickExpression(event) {
        pickMode = true
        pickTarget = event.detail
    }

    function expressionClicked(event){
        let url = event.detail
        if(pickMode) {
            pickMode = false
            switch(pickTarget) {
                case 'source':
                    linkWizard.source = url;
                    break;
                case 'predicate':
                    linkWizard.predicate = url;
                    break;
                case 'target':
                    linkWizard.target = url;
                    break;
            }
        } else {
            selectedExpression = url
        }
    }

    function nonExpressionClicked(event) {
        selectedExpression = ''
    }

    function updateToolbar() {
        console.log("UPDATE TOOLBAR")
        updateCustomActions()
        updateSDNA()
    }

    $: if(selectedExpression || !selectedExpression) {
        updateToolbar()
    }

    async function updateSDNA() {
        if(!selectedExpression) {
            sdnaFlowActions = {}
            sdnaFlows = []
            sdnaFlowStates = {}
            return
        }
        
        try {
            sdnaFlows = await perspective.availableFlows(selectedExpression)
            console.debug("sdnaFlows:", sdnaFlows)
            for(let flow of sdnaFlows) {
                try{
                    sdnaFlowActions[flow] = await perspective.flowActions(flow, selectedExpression)
                    console.debug("sdnaFlowActions[flow]:", sdnaFlowActions[flow])    
                } catch(e) {
                    sdnaFlowActions[flow] = []
                }
                
                try{
                    sdnaFlowStates[flow] = await perspective.flowState(flow, selectedExpression)
                    console.debug("sdnaFlowStates[flow] :", sdnaFlowStates[flow] )
                } catch(e) {
                    sdnaFlowStates[flow] = NaN
                }
            }
        } catch(e) {
            console.debug("No SDNA flows defined:", e)
        }

    }

    async function updateCustomActions() {
        customActions = []
        let results 
        try {
            results = await perspective.infer(`customAction(X, "${selectedExpression}")`)
        } catch(e) {
            console.debug("No custom actions defined:", e)
        }
        
        if(results) {
            for(let result of results) {
                let actionUrl: string = result.X
                
                if(actionUrl.startsWith('ad4m://expression_action:')) {
                    let name = actionUrl.substring(25)
                    let [body] = await perspective.get(new LinkQuery({source: actionUrl, predicate: 'ad4m://has_body'}))
                    if(body) {
                        let code = Literal.fromUrl(body.data.target).get()
                        customActions = [...customActions, {name, code}]
                    }
                }
            }
        }
    }
    

    if(typeof settings === 'string')
        settings = JSON.parse(settings)

    let tabs = [
        { k: 1, label: 'Expression Browser', icon: 'web' },
        { k: 4, label: 'Social DNA', icon: 'engineering' },
        { k: 5, label: 'Actions', icon: 'engineering' }
    ]

    let active = tabs[0]

    if(settings) {
        tabs.push({ k: 2, label: 'Perspective Settings', icon: 'settings' })
    }

    if(agentprofile) {
        tabs.push({ k: 3, label: 'Agent Wizard', icon: 'account_circle' })
        active = tabs[tabs.length-1]
        showSidePanel = true
    }

    async function publishAsAgentPerspective() {
      const snapshot = await perspective.snapshot()
      console.log("Publishing perspective as agent perspective: ", snapshot)
      await ad4m.agent.updatePublicPerspective(snapshot)
    }

    function noop(){}
    
    let me
    let did
    async function init() {
        me = await ad4m.agent.me()
        did = me.did
    }

    init()
</script>

<div class="perspective-wrapper"
    on:mousewheel|stopPropagation={noop} 
    on:touchstart|stopPropagation={noop}
    on:mouseup|stopPropagation={noop}
    on:keydown|stopPropagation
    on:keyup|stopPropagation
    on:keypress|stopPropagation
>
    <div class="header">
        <h1>
            {#if agentprofile}
                Your Agent Profile
            {:else}
                {perspective?.name}
            {/if}
        </h1>
        {#if agentprofile && me}
            ({me.did})
        {/if}
    </div>

    {#if perspective}
        <div class:picker={pickMode}>
            <PerspectiveGraph 
                perspective={perspective}
                on:expressionClicked={expressionClicked}
                on:non-expressionClicked={nonExpressionClicked}
                on:link-from-expression={(e)=>{
                    newLinkSource = e.detail
                    showLinkWizard = true
                    pickMode = true
                    pickTarget = 'target'
                }}
                on:create-target-for-expression={(e)=>{
                    newLinkSource = e.detail
                    showLinkWizard = true
                    linkWizard.createExpression('target')
                }}
            ></PerspectiveGraph>
        </div>
    {:else}
        <h2>Loading...</h2>
    {/if}

    {#if perspective}
    <div class="palette">
        <ConstructionPalette perspective={perspective}></ConstructionPalette>
    </div>
    {/if}
    

    <div class="side-panel" style={`width: ${showSidePanel ? '400px' : '0'};`}>
        <div class="side-panel-handle">
            <IconButton class="material-icons" on:click={() => showSidePanel = !showSidePanel}>
                {showSidePanel ? 'chevron_right' : 'chevron_left'}
            </IconButton>
        </div>
        <div class="side-header">
            <TabBar {tabs} let:tab key={(tab) => tab.k} bind:active style="display: inline;">
                <Tab
                    {tab}
                    stacked={true}
                    indicatorSpanOnlyContent={true}
                    tabIndicator$transition="fade"
                    >
                    <Icon class="material-icons">{tab.icon}</Icon>
                    <Label>{tab.label}</Label>
                </Tab>
            </TabBar>
        </div>

        <div class="side-content">
            {#if active.k === 1 }
                <ExpressionBrowser></ExpressionBrowser>
            {:else if active.k === 2 }
                {#if uuid}
                    <PerspectiveSettings perspectiveId={uuid}>
                    </PerspectiveSettings>
                {/if}
            {:else if active.k === 3 }
                {#if showSidePanel}
                    <AgentProfileSettings 
                        did={did}
                        agentPerspective={perspective}
                    ></AgentProfileSettings>
                {/if}
            {:else if active.k === 4 }
                {#if perspective}    
                    <PrologExpressionView perspective={perspective}>
                    </PrologExpressionView>
                {/if}
            {:else if active.k === 5 }
                {#if perspective}    
                    <ActionsView perspective={perspective}>
                    </ActionsView>
                {/if}
            {/if}
        </div>
    </div>

    <div class="footer-panel" style={`height: ${showFooterPanel ? '200px' : '50px'};`}>
        {#if perspective}
            <div class="invisible" class:visible={showLinkWizard}>
                <LinkWizard 
                    bind:this={linkWizard}
                    bind:source={newLinkSource}
                    bind:predicate={newLinkPredicate}
                    bind:target={newLinkTarget}
                    on:cancel={()=>{showLinkWizard=false; pickMode=false;}}
                    on:ok={()=>{showLinkWizard=false; pickMode=false;}}
                    on:pick={pickExpression}
                    perspective={perspective}
                >
                </LinkWizard>
            </div>
        {/if}
        {#each sdnaFlows as flow}
            <div class="sdna-panel">
                <span class="sdna-header">
                    <span class="material-icons">handshake</span>
                    {flow}
                </span>
                {#if !isNaN(sdnaFlowStates[flow])}
                    <span class="sdna-state">{sdnaFlowStates[flow]*100}%</span>
                {:else}
                    <Button variant="raised" on:click={()=>perspective.startFlow(flow, selectedExpression)}>
                        <ButtonIcon class="material-icons">add</ButtonIcon>
                    </Button>                    
                {/if}
                <span class="sdna-buttons">
                    {#if sdnaFlowActions[flow]}
                        {#each sdnaFlowActions[flow] as action}
                            <Button variant="raised" on:click={()=>perspective.runFlowAction(flow, selectedExpression, action)}>
                                <ButtonLabel>{action}</ButtonLabel>
                            </Button>    
                        {/each}
                    {/if}
                </span>
            </div>
        {/each}
        <div class="footer-header">
            <span class="toolbar">
                <IconButton class="material-icons" on:click={() => showFooterPanel = !showFooterPanel}>
                    {showFooterPanel ? 'expand_more' : 'expand_less'}
                </IconButton>
            </span>
            <span class="footer-title">
                REPL
            </span>
            <span class="tool-buttons">
                {#each customActions as action}
                    <Button variant="raised" on:click={()=>executeCustomAction(action.code, selectedExpression, perspective)}>
                        <ButtonLabel>{action.name}</ButtonLabel>
                    </Button>    
                {/each}
                <Button variant="raised" on:click={openLinkWizard}>
                    <ButtonIcon class="material-icons">add</ButtonIcon>
                    <ButtonLabel>Add Link/Expression</ButtonLabel>
                </Button>
                {#if agentprofile}
                    <Button variant="raised" on:click={publishAsAgentPerspective}>
                        <ButtonLabel>Publish Profile</ButtonLabel>
                    </Button>
                {/if}
            </span>
        </div>
        
        <div class="footer-content">
            {#if perspective}
                <PerspectiveShell perspective={perspective}></PerspectiveShell>
            {/if}
        </div>
    </div>

</div>

<style>
    h1 {
        margin: 5px 20px;
        display: inline;
    }

    .header {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        height: 50px;
        background-color: #44aaee6b;
    }

    .perspective-wrapper {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: #e1f6f7db;
        padding: 20px;
    }

    .footer-panel {
        position: absolute;
        height: 200px;
        right: 0;
        bottom: 0;
        left: 0;
        transition: height 0.5s;
        z-index: 10;
    }

    .footer-header { 
        position: relative;
        height: 42px; 
        background-color: #44aaee6b;
    }

    .sdna-panel {
        height: 42px; 
        margin-top: -42px;
        padding: 10px 0 0 15px;
        background-color: #44eeda6b;
    }

    .sdna-header {
        font-weight: bold;
        font-size: 19px;
        margin-right: 4px;
    } 

    .footer-title {
        margin-left: 50px;
        line-height: 50px;
    }

    .tool-buttons {
        position: absolute; 
        right: 0; 
        top: 2px;
    }

    .toolbar {
        position: absolute;
        left: 0;
        top: 0;
        height: 50px;
    }

    .footer-content {
        background-color: black;
        height: 160px;
        overflow-x: scroll;
        padding-left: 10px
    }

    .side-panel {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 400px;
        padding-left: 50px;
        transition: width 0.5s;
        background-color: white;
        overflow-x: hidden;
        z-index: 10;
    }

    .side-panel-handle {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 50px;
        background-color: darkslateblue;
        line-height: 95vh;
        color: white;
        font-weight: bold;
    }

    .side-header {
        position: relative;
    }

    .side-content {
        position: relative;
        overflow: scroll;
        height: 80%;
    }

    .picker {
        cursor: crosshair;
    }

    .invisible {
        display: none;
    }

    .visible {
        display: block;
    }

    .palette {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translate(0, -50%);
        z-index: 10;
    } 
</style>