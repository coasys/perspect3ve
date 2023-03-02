<script lang="ts">
    import { getContext } from "svelte";
    import { Ad4mClient, Literal } from '@perspect3vism/ad4m'
    import { perspectivesStore } from "./PerspectivesStore";
    import { Network } from 'vis-network/esnext'
    import { DataSet } from 'vis-data'
    import md5 from 'md5'

    const AGENT_PERSPECTIVE_NAME = '__agent_public_perspective'

    let agentPerspective
    let neighbourhoods = []
    let privatePerspectives = []

    let container
    let nodes = []
    let nodesDataSet = new DataSet([])
    let nodePositions = {}
    let scale = 1
    let network

    const ad4m: Ad4mClient = getContext('ad4mClient')
    let perspectives = perspectivesStore(ad4m)
    perspectives.subscribe(update)

    async function initAgentPerspective() {
      const me = await ad4m.agent.me()
      const allPerspectives = await ad4m.perspective.all()
      agentPerspective = allPerspectives.find(p => p.name === AGENT_PERSPECTIVE_NAME)
      if(!agentPerspective) {
        agentPerspective = await ad4m.perspective.add(AGENT_PERSPECTIVE_NAME)
        agentPerspective.loadSnapshot(me.perspective)
      }
    }

    async function initGraph() {
        await createNetwork(container)
        update($perspectives)
    }

    initAgentPerspective()
    $: if(container) initGraph()

    async function update(newPerspectives) {
        for(let p of newPerspectives) {
            if(p.name != AGENT_PERSPECTIVE_NAME){
                if(p.sharedUrl) {
                    neighbourhoods = [...neighbourhoods, p]
                } else {
                    privatePerspectives = [...privatePerspectives, p]
                }
            } else {
                agentPerspective = p
            }
        }

        nodes = await createNodesFromPerspectives()
        nodesDataSet.clear()
        for(let node of nodes) {
            try{
                nodesDataSet.add(node)
            } catch(e) {

            }
        }
    }

    async function createNodesFromPerspectives() {
        let nodes = []
        
        if(agentPerspective) {
            let email
            try {
                let { did } = await ad4m.agent.me()
                email = Literal.fromUrl(await agentPerspective.getSingleTarget({source: did, predicate: 'foaf://mbox'})).get()
            }catch(e) {
                console.debug(e)
            }

            console.log("got email: ", email)
            let image
            if(email)
                image = `http://www.gravatar.com/avatar/${md5(email)}?s=360`


            console.log("imgae:", image)

            nodes.push({
                id: agentPerspective.uuid,
                label: "Agent Public Perspective",
                widthConstraint: 150,
                shape: image ? 'image' : 'box',
                x: 0,
                y: 0,
                image
            })
        }

        let all = privatePerspectives.length
        let step = 150
        let left = all/2 * -step
        for(let i=0; i < all; i++) {
            const p = privatePerspectives[i]
            nodes.push({
                id: p.uuid,
                label: p.name,
                widthConstraint: 150,
                shape: 'image',
                image: 'images/silvereyeflower.png',
                x: left + (i*step),
                y: 200
            })
        }
     
        
        all = neighbourhoods.length
        step = 150
        left = all/2 * -step
        for(let i=0; i < all; i++) {
            const p = neighbourhoods[i]
            nodes.push({
                id: p.uuid,
                label: p.name,
                widthConstraint: 150,
                shape: 'image',
                image: 'images/silvereyeflower.png',
                x: left + (i*step),
                y: -200
            })
        }

        return nodes
    }

    async function createNetwork(container) {        
        network = new Network(container, {nodes: nodesDataSet, edges: []}, {
            nodes: {
                borderWidth: 1,
                shape: 'box',
                color: 'teal',
                font: {
                    color: '#ffffff'
                }
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
                enabled: false
            }
        })

        for(let event of ['dragging', 'stabilizationProgress', 'stabilized', 'resize', 'afterDrawing']) {
            network.on(event, () => {
                getNodePositions()
            })
        }

        network.on('zoom', (params) => {
            scale = params.scale
            getNodePositions()
        })

        network.on('oncontext', params => {
            /*
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
            */
        })

        network.on('click', params => {
        })

        getNodePositions()
    }

    function getNodePositions() {
        nodePositions = {}
        for(let node of nodes) {
            try{
                const graphPos = network.getPosition(node.id)
                nodePositions[node.id]=network.canvasToDOM(graphPos)
            }catch(e){
                console.debug("Error in getNodePositions()", e)
            }
        }
    }


    async function createNewPerspective() {
		let number = 1
		let prefix = "New Perspective "
		while($perspectives.includes(prefix+number)) {
			number++
		}

		const name = prefix+number
		const result = await ad4m.perspective.add(name)
		console.log("Perspective added:", result)
	}
</script>

<div class="perspectives">
    <div class="graph" bind:this={container}>
    </div>

    {#each $perspectives as p}
        <div class="perspective-icon-wrapper" style={
            `top: ${nodePositions[p.uuid]?.y-15-(30*scale)}px; 
            left: ${nodePositions[p.uuid]?.x-15+(50*scale)}px;
            transform: scale(${scale*0.8});
            `}>
                {#if agentPerspective && p.uuid === agentPerspective.uuid}
                    <div class="zoom-handle material-icons zoom-me" data-to="PerspectiveWrapper" 
                        data-uuid={p.uuid}
                        data-settings=false
                        data-agentprofile=true
                    >fullscreen</div>
                {:else}
                    <div class="zoom-handle material-icons zoom-me" data-to="PerspectiveWrapper" 
                        data-uuid={p.uuid}
                        data-settings=true
                    >fullscreen</div>
                {/if}
        </div>
    {/each}

    <h2><div class="perspective-box plus-button" on:click={()=>createNewPerspective()}>+</div></h2>
</div>

<style>
    .perspectives {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }

    .graph {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    } 

    .perspective-icon-wrapper {
        position: absolute;
    }
    
    .zoom-handle {
        font-size: 30px;
        background-color: #00ffff73;
    }

    .perspective-box {
        position: relative;
        display: inline-block;
        width: 200px;
        height: 212px;
        margin: auto;
        border-radius: 100px;
        background-color: #00ffff73;
        text-align: center;
        line-height: 212px;
        background-image: url('../images/silvereyeflower.png');
    }

    .agent-perspective {
        background-color: red;
    }

    .perspective-list {
        display: inline-block;
        list-style-type: none;
        padding: 0;
    }

    .perspective-list-item {
        display: inline-block;
    }

    .perspective-icon {
        position: absolute;
        left: 0;
        width: 200px;
    }

    .perspective-name {
        font-weight: bold;
        position: absolute;
        left: 0;
        right: 0;
        margin-left: auto;
        margin-right: auto;
        font-size: 20px;
        text-shadow: 1px 2px #fafafa;
    } 

    .private {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 33%;
        background-color: seagreen;
        overflow: scroll;
    }

    .plus-button {
        position: absolute;
        right: 0;
        top: 0;
        width: 50px;
        height: 40px;
        font-size: 30px;
        line-height: normal;
        cursor: pointer;
    }
</style>