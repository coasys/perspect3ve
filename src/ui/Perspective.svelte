<script lang="ts">
    import { getContext, createEventDispatcher } from "svelte";
    import type { Perspective } from '@perspect3vism/ad4m'
    import { exprRef2String, hashLinkExpression, linkEqual, Link } from '@perspect3vism/ad4m';
    import ExpressionIcon from './ExpressionIcon.svelte';
    import iconComponentFromString from './iconComponentFromString';
    import ConstructionMenu from './ConstructionMenu.svelte'
    import ExpressionContextMenu from "./ExpressionContextMenu.svelte";
    import { linkTo2D, coordToPredicate } from './uiUtils';
    import { linksStoreForPerspective } from "./LinksStore";

    export let perspective: Perspective
    export let uuid: String

    const dispatch = createEventDispatcher();
    const ad4m: Ad4mClient = getContext('ad4mClient')

    if(!perspective && uuid) {
        (async () => {
            perspective = await ad4m.perspective.byUUID(uuid)
        })()
    }

    ad4m.perspective.addPerspectiveUpdatedListener(async p => {
        //@ts-ignore
        if(p.uuid == perspective.uuid || p.uuid == uuid) {
            //@ts-ignore
            perspective = await ad4m.perspective.byUUID(perspective.uuid)
        }
    })


    let linksStore
    let constructionMenu
    let languages = []
    let languageIcons = {
        'note-ipfs': 'note',
        'url-iframe': 'link'
    }
    let constructorIconComponents = {}
    let iconStates = {}

    let content
    let container
    let zoom = 0
    let translateX = 0
    let translateY = 0
    let isPanning = false
    let isMovingExpression = false
    let movingLink
    let movingLinkOriginal
    let isLinking = false
    let linkingSource
    let linkingCursor = {}
    let dropMove = false
    let dropMoveTarget

    $: if(content && zoom!=undefined && translateX!=undefined && translateY!=undefined) {
        console.debug("SET TRANSFORM:", zoom)
        content.setAttribute("style", calcPerspectiveContentStyle())
    }

    function calcPerspectiveContentStyle() {
        return `
            position: absolute; 
            width: 100%; height: 100%; 
            top: 0; left: 0;
            transform: translateX(${translateX}px) translateY(${translateY}px) translateZ(${zoom}px);
            transform-style: preserve-3d;
        `
    }

    function handleMouseWheel(event) {
        let factor = 0.3
        const normalized = Math.abs(zoom/3)
        if(zoom < 0 && normalized > 2) {
            factor = 0.3 * Math.log2(normalized)    
        } 

        zoom -= event.deltaY * factor

        if(zoom > 45) zoom = 45
        console.log("zoom:", zoom)
    }

    function zoomNormalizedMouseMove(coords) {
        let factor
        if(zoom < 0) {
            const dist = -zoom
            factor = 1 + (dist/1000)
        } else {
            const dist = zoom
            factor = 1 - (dist/1000)
        }

        return {
            x: coords.x * factor,
            y: coords.y * factor,
        }
    }

    function dist(c1, c2) {
        const x = c1.x - c2.x
        const y = c1.y - c2.y
        return Math.sqrt(x*x + y*y)
    }

    function hoveredLink(coords, moving) {
        for(const i in $linksStore) {
            const link = $linksStore[i]
            if(link.data.source === "root" && link.data.predicate?.startsWith("coord2d://") && link.data.target != moving.target) {
                const linkCoords = linkTo2D(link)
                const d = dist(coords, linkCoords)
                if(d < 300) return link
            }
        }
        return null
    }

    function handleMouseMove(event) {
        const d = zoomNormalizedMouseMove({x: event.movementX, y: event.movementY })
        if(isPanning) {
            translateX += d.x
            translateY += d.y
        }

        if(isMovingExpression) {
            let point = linkTo2D(movingLink)
            point.x += d.x
            point.y += d.y
            movingLink.data.predicate = coordToPredicate(point)
            dropMoveTarget = hoveredLink(point, movingLink.data)
            if(dropMoveTarget) {
                dropMove = true
                console.log("drop move!")
            } else {
                dropMove = false
            }
            //linksStore.update(movingLink)
        }

        if(isLinking) {
            linkingCursor = zoomNormalizedMouseMove({
                x: event.clientX,
                y: event.clientY
            })
            console.log("linking cursor:", JSON.stringify(linkingCursor))
        }
    }

    function getLinkIdFromPath(event) {
        for(const i in event.path) {
            console.log(event.path[i])
            if(event.path[i].dataset && event.path[i].dataset.linkId !== undefined)
                return event.path[i].dataset.linkId
        }
        return undefined
    }

    function handleMouseDown(event) {
        if(event.button === 2) return
        if(event.target == content || event.target == container)
            isPanning = true
        else {
            console.log("clicked something else:", event.path)
            const linkId = getLinkIdFromPath(event)
            console.log("link id:", linkId)
            if(linkId) {
                const hoveredLink = $linksStore.find(l => hashLinkExpression(l) == linkId)
                if(isLinking) {
                    const newLink = {
                        source: linkingSource.data.target,
                        target: hoveredLink.data.target,
                    }
                    ad4m.perspective.addLink(perspective.uuid, newLink)
                } else {
                    if(hoveredLink) {
                        movingLink = {
                            author: hoveredLink.author,
                            timestamp: hoveredLink.timestamp,
                            data: {
                                source: hoveredLink.data.source,
                                predicate: hoveredLink.data.predicate,
                                target: hoveredLink.data.target,
                            },
                            proof: {
                                key: hoveredLink.proof.key,
                                signature: hoveredLink.proof.signature
                            }
                        }
                        movingLinkOriginal = JSON.parse(JSON.stringify(movingLink))
                        isMovingExpression = true
                        console.log("MOVING")
                    }
                    else {
                        console.error("Couldn't find link with ID", linkId)
                        console.error("have links", $linksStore)
                    }
                }
                
                
            }
        }
    }

    function handleMouseUp(event) {
        console.debug(isMovingExpression, movingLink, movingLinkOriginal)
        if(isMovingExpression && !linkEqual(movingLink, movingLinkOriginal)) {
            let newLinkObject = JSON.parse(JSON.stringify(movingLink))
            if(dropMove) {
                newLinkObject.data.source = dropMoveTarget.data.target
            }
            delete newLinkObject.id
            console.debug("Updating link:", JSON.stringify(movingLinkOriginal), JSON.stringify(newLinkObject.data))
            ad4m.perspective.updateLink(perspective.uuid, movingLinkOriginal, newLinkObject.data)
        }

        isPanning = false
        isMovingExpression = false
        isLinking = false
        linkingSource = false
    }

    function contextMenu(event) {
        isPanning = false
        isMovingExpression = false
        constructionMenu.open(event.clientX, event.clientY)
    }

    ad4m.languages.byFilter("expressionUI").then( expressionUILanguages => {
        languages = expressionUILanguages
    })


    async function commitExpression(lang, content, container) {
        const exprURL = await ad4m.expression.create(JSON.stringify(content), lang.address)
        console.log("Created new expression:", exprURL)
        ad4m.perspective.addLink(perspective.uuid, new Link({source: 'root', target: exprURL}))
        container.innerHTML = ''
    }

    async function createExpression(lang) {
        console.log("Create expression:", lang, JSON.stringify(lang))
        if(!constructorIconComponents[lang.name]) {
            const language = await ad4m.languages.byAddress(lang.address)
            const code = language.constructorIcon.code
            const ConstructorIcon = iconComponentFromString(code, lang.name)
            constructorIconComponents[lang.name] = ConstructorIcon
            customElements.define(lang.name+"-constructor", ConstructorIcon);
        }

        const container = document.getElementById("constructor-container")

        container.innerHTML = ''
        const constructorIcon = new constructorIconComponents[lang.name]()
        constructorIcon.commitExpression = async (content) => {
            commitExpression(lang, content, container)
        }
        constructorIcon.discard = () => {
            container.innerHTML = ''
        }
        
        container.appendChild(constructorIcon)
    }

    $: if(perspective) {
        linksStoreForPerspective(ad4m, perspective).then(store =>{
            linksStore = store
        })
    }


    let expressionContextMenu

    function onExpressionContextMenu(event) {
        const { expressionURL, mouseEvent, parentLink } = event.detail
        expressionContextMenu.open(mouseEvent.clientX, mouseEvent.clientY, expressionURL, parentLink)
        isPanning = false
        isMovingExpression = false
    }

    function onExpressionSwitchHeaderContent(event) {
        const expression = event.detail
        if(iconStates[expression] != 'rotated') {
            iconStates[expression] = 'rotated'
        } else {
            iconStates[expression] = ''
        }
        isPanning = false
        isMovingExpression = false
    }

    function onDeleteExpression(event) {
        const expression = event.detail
        $linksStore.forEach(l => {
            if(l.data.target === expression) {
                console.log("deleting expression:", l)
                ad4m.perspective.removeLink(perspective.uuid, l)
            }
        })
    }

    function onLinkExpression(event) {
        const link = event.detail
        isLinking = true
        linkingSource = link
    }

    function noop(){}

</script>

<div 
    on:mousewheel|stopPropagation={noop} 
    on:touchstart|stopPropagation={noop}
    on:mouseup|stopPropagation={noop}
>

{#if !perspective || !perspective.uuid}
    <h1>Loading...</h1>
{:else}

<div class="perspective-container" 
    on:mousewheel={handleMouseWheel}
    on:mousemove={handleMouseMove}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
    on:contextmenu={contextMenu}
    bind:this={container}
    >
    <div class="perspective-content" bind:this={content}>
        <ul class="inline">
            {#each $linksStore as link}
                {#if link.data.source === 'root'}
                    {#if isMovingExpression && movingLink && linkEqual(link, movingLinkOriginal)}
                    <li class="inline expression-list-container" 
                        style={`position: absolute; transform: translateX(${linkTo2D(movingLink).x}px) translateY(${linkTo2D(movingLink).y}px);`}
                        data-link-id={hashLinkExpression(link)}
                        >
                        <div class="drop-move-container" style={`transform: translateZ(${dropMove ? -2000 : 0}px);`}>
                            <ExpressionIcon expressionURL={link.data.target} perspectiveUUID={perspective.uuid}/>
                        </div>
                    </li>
                    {:else}
                    <li class="inline expression-list-container" 
                        style={`position: absolute; transform: translateX(${linkTo2D(link).x}px) translateY(${linkTo2D(link).y}px);`}
                        data-link-id={hashLinkExpression(link)}
                        >
                        <ExpressionIcon
                            expressionURL={link.data.target}
                            parentLink={link}
                            perspectiveUUID={perspective.uuid}
                            on:context-menu={onExpressionContextMenu} 
                            rotated={iconStates[link.data.target] === 'rotated'}
                            selected={linkingSource?.data?.target === link.data.target}>
                        </ExpressionIcon>
                    </li>
                    {/if}
                {/if}
            {/each}
        </ul>        
        <div id="constructor-container"></div>

        {#if isLinking && linkingSource && linkingCursor.x && linkingCursor.y}
            <svg class="link-path" width="100000" height="100000">
                <path d={`M${linkTo2D(linkingSource).x+10000+400},${linkTo2D(linkingSource).y+10000} L${linkingCursor.x-5+10000},${linkingCursor.y-5+10000} Z`} stroke="red" stroke-width="3" fill="none"/>
            </svg>
        {/if}
    </div>
</div>

<ConstructionMenu bind:this={constructionMenu} 
    languages={languages} 
    languageIcons={languageIcons}
    on:language-clicked={({detail: lang}) => createExpression(lang)}
></ConstructionMenu>
<ExpressionContextMenu bind:this={expressionContextMenu}
    on:switch-header-content={onExpressionSwitchHeaderContent}
    on:delete={onDeleteExpression}
    on:link={onLinkExpression}
></ExpressionContextMenu>

{/if}

</div>
<style>
    .perspective-container {
        position: absolute;
        top: 30px;
        left: 0;
        right: 0;
        height: 100%;
        perspective: 1000px;
        transform-style: preserve-3d;
    }

    .debug {
        position: fixed;
        width: 100%;
        z-index: -10;
    }

    .inline {
        display: inline;
        transform-style: preserve-3d;
    }

    .link-path {
        position: absolute;
        top: 0;
        left: 0;
        transform: translateX(-10000px) translateY(-10000px);
    }

    .drop-move-container {
        transition: transform 0.5s;
    }
</style>