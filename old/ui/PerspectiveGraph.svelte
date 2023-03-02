<script lang="ts">
    import { getContext, createEventDispatcher } from "svelte";
    import { Ad4mClient, LinkExpression, Literal, parseExprUrl, PerspectiveProxy } from '@perspect3vism/ad4m'
    import ExpressionIcon from './ExpressionIcon.svelte';
    import ExpressionContextMenu from "./ExpressionContextMenu.svelte";
    import { linksStoreForPerspective } from "./LinksStore";
    import { Network } from 'vis-network/esnext/index'
    import VisGraph from "./VisGraph";
    import LinkContextMenu from "./LinkContextMenu.svelte";
    import { debounce } from "./uiUtils"

    export let perspective: PerspectiveProxy
    export let uuid: string 

    const ad4m: Ad4mClient = getContext('ad4mClient')
    const zumly = getContext('zumly')
    const dispatch = createEventDispatcher()

    const POSITION_PREDICATE = 'perspect3ve://2d_position'

    let agentDID
    ad4m.agent.me().then(agent => {
        agentDID = agent.did
    })
    

    if(!perspective && uuid) {
        (async () => {
            perspective = await ad4m.perspective.byUUID(uuid)
        })()
    }

    if(!uuid && perspective) {
        uuid = perspective.uuid
    }

    //@ts-ignore
    ad4m.perspective.addPerspectiveUpdatedListener(async p => {
        //@ts-ignore
        if(p.uuid == perspective.uuid || p.uuid == uuid) {
            //@ts-ignore
            perspective = await ad4m.perspective.byUUID(perspective.uuid)
        }
    })

    async function update() {
        console.log("UPDATE")
        await graphFromPerspective(perspective)
        network.setData({nodes: graph.nodes, edges: graph.edges})
        getNodePositions()
    }

    let network
    let networkDiv
    let nodePositions
    let graph
    let scale = 1

    $: if(perspective && networkDiv) {
        init()
    }

    async function init() {
        await graphFromPerspective(perspective)
        await createNetwork(networkDiv)
    }

    async function graphFromPerspective(p) {
        graph = new VisGraph(p)
        await graph.load()
    }

    async function createNetwork(container) {
        network = new Network(container, {nodes: graph.nodes, edges: graph.edges}, {
            groups: {
                linkLanguageLink: {color:{background:'#FF3366'}},
                metaLinks: {color:{background:'#33A1FF'}}
            },
            nodes: {
                borderWidth: 1,
                shape: 'box',
                color: 'teal'
            },
            edges: {
                color: 'black',
                arrows: {
                    to: {
                        enabled: true,
                    }
                },
                arrowStrikethrough: false,
                smooth: false,
            },
            physics: {
                hierarchicalRepulsion: {
                    centralGravity: 0,
                    springLength: 620,
                    springConstant: 0.005,
                    nodeDistance: 310,
                    avoidOverlap: 0.15
                },
                minVelocity: 0.75,
                solver: "hierarchicalRepulsion"
            },
            layout: {
                randomSeed: 2
            }
        })

        for(let event of ['dragging', 'stabilizationProgress', 'stabilized', 'resize', 'afterDrawing']) {
            network.on(event, () => {
                getNodePositions()
            })
        }

        for(let event of ['stabilized']) {
            network.on(event, () => {
                debouncedWriteNodePositions()
            })
        }

        network.on('zoom', (params) => {
            scale = params.scale
            getNodePositions()
        })

        network.on('oncontext', params => {
            if(params.nodes.length > 0) {
                let url = params.nodes[0]
                let pos = params.pointer.DOM
                expressionContextMenu.open(pos.x, pos.y, url)
            } else if(params.edges.length > 0) {
                let edgeId = params.edges[0]
                //@ts-ignore
                let { from, to, label, link } = graph.edges.find(e=> e.id===edgeId)
                console.log('oncontext link:', link)
                let pos = params.pointer.DOM
                if(link)
                    linkContextMenu.open(pos.x, pos.y, link)
            }
        })

        network.on('click', params => {
            if(params.nodes.length > 0) {
                let url = params.nodes[0]
                dispatch('expressionClicked', url)
            } else {
                dispatch('non-expressionClicked')
            }
        })

        getNodePositions()
    }

    function getNodePositions() {
        nodePositions = []
        for(let node of graph.nodes) {
            nodePositions.push( {
                id: node.id,
                label: node.label,
                pos: network.canvasToDOM(network.getPosition(node.id)),
            })
        }
    }

    function writeNodePositions() {
        for(let node of graph.nodes) {
            const pos = network.getPosition(node.id)
            const incomingEdges = graph.edges.filter(e => e.label == POSITION_PREDICATE && e.to == node.id)
            if(incomingEdges.length == 0) {
                // only store position for non-position nodes
                perspective.setSingleTarget({
                    source: node.id,
                    predicate: POSITION_PREDICATE,
                    target: Literal.from(pos).toUrl()
                })
            }
        }

        console.debug("Node positions saved.")
    }



    const debouncedWriteNodePositions = debounce(writeNodePositions, 1000)

    let linksStore
    let expressionContextMenu
    let linkContextMenu
    let iconStates = {}


    $: if(perspective) {
        linksStoreForPerspective(ad4m, perspective).then(store => {
            linksStore = store
        })
        const updateIfNotPositionLink = (link: LinkExpression) => {
            if(link.author == agentDID && link.data.predicate == POSITION_PREDICATE)
                return
            update()
        }
        perspective.addListener('link-added', updateIfNotPositionLink)
        perspective.addListener('link-removed', updateIfNotPositionLink)
    }


    function onExpressionContextMenu(event) {
        const { expressionURL, mouseEvent, parentLink } = event.detail
        expressionContextMenu.open(mouseEvent.clientX, mouseEvent.clientY, expressionURL, parentLink)
    }

    function onExpressionSwitchHeaderContent(event) {
        const expression = event.detail
        if(iconStates[expression] != 'rotated') {
            iconStates[expression] = 'rotated'
        } else {
            iconStates[expression] = ''
        }
    }

    function onDeleteExpression(event) {
        const expression = event.detail
        $linksStore.forEach(l => {
            if(l.data.target === expression || l.data.source === expression) {
                console.log("deleting expression:", l)
                ad4m.perspective.removeLink(perspective.uuid, l)
            }
        })
    }

    function onDeleteLink(event) {
        const link = event.detail
        perspective.remove(link)
    }

    function shouldRenderExpressionIcon(label: string|object) {
        if(typeof label != 'string' || label.startsWith('literal://'))
            return false

        let isValidUrl
        try {
            const ref = parseExprUrl(label)
            isValidUrl = true
        } catch(e) {
            isValidUrl = false
        }

        return isValidUrl
    }

    let perspectives
    async function getPerspectives() {
        perspectives = await ad4m.perspective.all()
    }
    getPerspectives()

    function uuidForNeighbourhood(url) {
        let p = perspectives.find(p => p.sharedUrl == url)
        if(p) return p.uuid
        else return null
    }

    function noop(){}

    function triggerZumly(e) {

        //@ts-ignore
        zumly.onZoom(e)
    }

</script>

<div 
    on:mousewheel|stopPropagation={noop} 
    on:touchstart|stopPropagation={noop}
>

{#if !perspective || !perspective.uuid}
    <h1>Loading...</h1>
{:else}

<div class="network-wrapper">
    {#if nodePositions}
        <div class="expression-icons">
            {#each nodePositions as node}
                {#if shouldRenderExpressionIcon(node.id)}
                    <div class="expression-icon-wrapper" style={
                        `top: ${node.pos.y+(30*scale)}px; 
                        left: ${node.pos.x}px;
                        transform: scale(${scale*0.8});
                        `}>
                        {#if node.id.startsWith('neighbourhood://') && uuidForNeighbourhood(node.url)}
                            <div class="zoom-me nh-zoom" 
                                data-to="PerspectiveWrapper" 
                                data-uuid={uuidForNeighbourhood(node.id)}
                                on:mouseup={(e)=>triggerZumly(e)}
                            >
                                <h1>{node.id}</h1>
                            </div>
                        {:else}
                            <ExpressionIcon 
                                expressionURL={node.id} 
                                perspectiveUUID={perspective.uuid}
                                on:context-menu={onExpressionContextMenu} 
                                rotated={iconStates[node.id] === 'rotated'}
                            />
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
    <div class="network" bind:this={networkDiv}>
    </div>
</div>

<ExpressionContextMenu bind:this={expressionContextMenu}
    on:switch-header-content={onExpressionSwitchHeaderContent}
    on:delete={onDeleteExpression}
    on:link={(e)=>{dispatch('link-from-expression', e.detail)}}
    on:add-child={(e)=>dispatch('create-target-for-expression', e.detail)}
></ExpressionContextMenu>
<LinkContextMenu bind:this={linkContextMenu}
    on:delete={onDeleteLink}
>
</LinkContextMenu>

{/if}

</div>
<style>
    .network-wrapper {
        position: absolute;
        top: 30px;
        left: 0;
        right: 0;
        height: 100%;
    }

    .network {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        z-index: 1;
    }

    .expression-icons {
        z-index: 2;
    }

    .expression-icon-wrapper {
        position: absolute;
        z-index: 2;
    }

    .nh-zoom {
        width: 300px;
        height: 200px;
        background-color: red;
        z-index: 1;
    }
</style>