<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as PIXI from 'pixi.js';
  import '@pixi/math-extras';
  import * as TWEEN from '@tweenjs/tween.js';
  import type { HistoryElement } from './History';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { PerspectiveProxy, LinkExpression, Literal, SmartLiteral, Link } from '@perspect3vism/ad4m';  
  import { COORDS_PRED_PREFIX, ExpressionWidget, LEVEL_SCALE } from './ExpressionWidget';
  import Toolbar from './Toolbar.svelte';
  import PropertiesBrowser from './PropertiesBrowser.svelte';
  import MiniWindow from './MiniWindow.svelte';
  import EveChat from './EveChat.svelte';

  export let perspectiveID: string;
  let selectedExpression
  let selectionParent
  
  let toolbarItems = []

  const ZOOM_DURATION = 30

  let app: PIXI.Application | undefined;
  let renderer: PIXI.Renderer | undefined;
  let canvas: HTMLElement | undefined;

  let perspective: PerspectiveProxy | null;

  let history: ExpressionWidget[] = [];
  let currentWidget: ExpressionWidget | null = null;
  let seenWidgets: Set<ExpressionWidget> = new Set();
  let widgtesByExpr: Map<string, ExpressionWidget> = new Map();

  const dispatch = createEventDispatcher();

  let gradientBackground

  async function setMainExpressionWidget(widget: ExpressionWidget, formerMainWidget?: ExpressionWidget) {
    currentWidget = widget;
    const width = canvas!.clientWidth;
    const height = canvas!.clientHeight;

    selectionParent = widget.base

    if(formerMainWidget) {
      formerMainWidget.makeNonInteractiveRecursive()
      formerMainWidget.clearAllInteractionHandlers()
      formerMainWidget.clearEventCallbacks()
      formerMainWidget.freeze()
    }

    widget.clearEventCallbacks()
    widget.unfreeze()
    widget.container.scale.set(1)
    widget.container.position.set(width/2, height/2)
    widget.hideTitle()
    app?.stage.addChild(widget.container)

    if(!seenWidgets.has(widget)) {
      console.log("first time seen", widget.base)
      seenWidgets.add(widget);
      widgtesByExpr.set(widget.base, widget);
      await widget.addChildrenInteractive()
    } else {
      widget.makeAllChildrenInteractive()
    }

    const historyParent = history[history.length - 1];
    if(historyParent) {
      historyParent.container.interactive = true
      historyParent.onSelectionChanged((expr) => {
        if(expr == historyParent.base) {
          selectedExpression = expr
          dispatch('selectionChanged', expr)
          zoomOut(historyParent, currentWidget!)
        }
      })
    }
    
    widget.onSelectionChanged((expr) => {
        selectedExpression = expr
        dispatch('selectionChanged', expr)
      })
    widget.onDoubleClick((child) => {
      zoomIn(widget, child);
    })

    widget.container.interactive = true

    widget.freezeChildren()
  }

  function getOrCreateWidget(expr: string): ExpressionWidget {
    if(widgtesByExpr.has(expr)) {
      return widgtesByExpr.get(expr)!;
    }
    const layer = new PIXI.Container();
    const widget = new ExpressionWidget(
      expr, 
      perspective!, 
      layer,
      { width: canvas!.clientWidth, height: canvas!.clientHeight}
    )
    return widget;
  }

  $: if (perspectiveID || !perspectiveID) update();

  async function update() {
    console.log('update', perspectiveID);
    widgtesByExpr.get("ad4m://self")?.makeNonInteractiveRecursive()
    if(perspectiveID) {
      clear()
      initPixi()
      
      const ad4m = await getAd4mClient();
      perspective = await ad4m.perspective.byUUID(perspectiveID);

      createToolbar()
      sdnaUpdateListener()

      app?.stage.removeChildren()
      app?.stage.addChild(gradientBackground)
      const ad4mSelf = getOrCreateWidget('ad4m://self');
      ad4mSelf.container.position.set(canvas!.clientWidth / 2, canvas!.clientHeight / 2);
      setMainExpressionWidget(ad4mSelf);
      app?.stage.addChild(ad4mSelf.container);
    }
  }

  async function createToolbar() {
    toolbarItems = [
      {
        icon: 'card-text',
        label: 'Literal',
        onClick: async () => {
          console.log('creating new literal')
          const literal = await SmartLiteral.create(perspective!, "New Expression")

          perspective?.add(new Link({
            source: currentWidget?.base,
            predicate: `${COORDS_PRED_PREFIX}{"x": 0, "y": 0}`,
            target: literal.base
          }))
        },
      }]
    
    const sClasses = await perspective!.subjectClasses()

    console.log("subject classes", sClasses)

    // add subject classes to toolbar
    for(const sClass of sClasses) {
      console.log("add subject class", sClass, "to toolbar")
      let sdnaResult
      try {
        sdnaResult = await perspective!.infer(`subject_class("${sClass}", Class), p3_class_color(Class, Color), p3_class_icon(Class, Icon).`)
      }catch(e) {
        console.log("error", e)
      }
      let color
      let icon
      if(sdnaResult && sdnaResult.length > 0) {
        color = sdnaResult[0].Color
        icon = sdnaResult[0].Icon
      }
      toolbarItems = [...toolbarItems, {
        icon: icon?icon:'plus',
        color,
        label: sClass,
        onClick: async () => {
          console.log('creating new subject class')
          const literal = await SmartLiteral.create(perspective!, `New ${sClass}`)

          await perspective?.createSubject(sClass, literal.base)

          perspective?.add(new Link({
            source: currentWidget?.base,
            predicate: `${COORDS_PRED_PREFIX}{"x": 0, "y": 0}`,
            target: literal.base
          }))
        },
      }]
    }
  }

  function sdnaUpdateListener() {
    perspective?.addListener('link-added', (link: LinkExpression) => {
      if(link.data.source == "ad4m://self" && link.data.predicate == "ad4m://has_zome") {
        createToolbar()
      }
    })
  }

  function createGradientTexture(width, height, color1, color2, color3,  color4) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(0.25, color2);
    gradient.addColorStop(0.5, color3);
    gradient.addColorStop(1, color4);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return PIXI.Texture.from(canvas);
}

  function initPixi() {
    if(app && app.view)
      canvas?.removeChild(app.view);

    const width = canvas!.clientWidth;
    const height = canvas!.clientHeight;

    // Create a PixiJS application
    app = new PIXI.Application({
      width,
      height,
      //backgroundColor: 0x000011,
      antialias: true,
    });

    globalThis.__PIXI_APP__ = app;

    // Add the PixiJS view to the DOM
    canvas!.appendChild(app.view);

    const color1 = "#0569a6"
    const color2 = "#6bc7ec"
    const color3 = "#8f7998"
    const color4 = "#1b2e4e"

    const gradientTexture = createGradientTexture(app.screen.width, app.screen.height, 
      color1, color2, color3, color4);
    gradientBackground = new PIXI.Sprite(gradientTexture);
    app.stage.addChild(gradientBackground);

    // Create a PixiJS renderer
    //@ts-ignore
    renderer = PIXI.autoDetectRenderer({
      width,
      height
    });

    window.addEventListener('resize', () => {
      console.log('resize', canvas!.clientWidth, canvas!.clientHeight);
      // Set the width and height of the container to the new viewport size
      //app?.resize(canvas!.clientWidth, canvas!.clientHeight);
      renderer!.resize(canvas!.clientWidth, canvas!.clientHeight);
    });
  }

  function clear() {
    widgtesByExpr.clear();
    history = [];
    currentWidget = null;
    seenWidgets = new Set();
  }

  onMount(async () => {
    await update();
  });

  onDestroy(() => {
    // Clean up the PixiJS application and renderer
    app?.destroy(true);
    renderer?.destroy(true);
  });

  function lerp(start: number, end: number, t: number) {
    return start * (1 - t) + end * t;
  }

  function aggregateZoomDisplacement(parents: ExpressionWidget[], center: {x: number, y: number}) {
    let displacementX = 0
    let displacementY = 0

    for(let i = 0; i < parents.length; i++) {
      const parent = parents[i]
      displacementX += (parent.container.position.x-center.x) / (LEVEL_SCALE ** (parents.length-i))
      displacementY += (parent.container.position.y-center.y) / (LEVEL_SCALE ** (parents.length-i))
    }
    return {x: displacementX, y: displacementY}  
  }

  const zoomIn = (parent: ExpressionWidget, child: ExpressionWidget) => {
    const parentLayer = parent.container
    const childLayer = child.container

    let centerX = canvas!.clientWidth / 2;
    let centerY = canvas!.clientHeight / 2;
   
    const startScale = 1;
    const endScale = 1/LEVEL_SCALE;

    const startX = parentLayer.position.x
    const startY = parentLayer.position.y

    const endX = centerX - childLayer.position.x/LEVEL_SCALE 
    const endY = centerY - childLayer.position.y/LEVEL_SCALE 


    //console.log("endScale: ", endScale)
    let elapsed = 0;
    let done = false;
    const animateZoom = (delta: number) => {
      elapsed += delta;
      const progress = TWEEN.Easing.Exponential.InOut(Math.min(elapsed / ZOOM_DURATION, 1));
      const newScale = lerp(startScale, endScale, progress);
      const newX = lerp(startX, endX, progress);
      const newY = lerp(startY, endY, progress);

      parentLayer.scale.set(newScale);
      parentLayer.position.set(newX, newY);

      if (progress >= 1 && !done) {
        done = true;
        app!.ticker.remove(animateZoom);
        //app!.stage.removeChildren();
        if(!history.includes(parent)){
          history.push(parent);
          parent.extractChildWidget(child);
          setMainExpressionWidget(child, parent);
        }
      }
  };
  app!.ticker.add(animateZoom);
};

const zoomOut = (parentWidget: ExpressionWidget, childWidget: ExpressionWidget) => {
    const startScale = 1/LEVEL_SCALE;
    const endScale = 1;

    const childStartScale = 1;
    const childEndScale = LEVEL_SCALE;

    let elapsed = 0;

    let parentLayer = parentWidget.container

    let centerX = canvas!.clientWidth / 2;
    let centerY = canvas!.clientHeight / 2;

    const childEndX = centerX + childWidget.relativePosition.x
    const childEndY = centerY + childWidget.relativePosition.y

    let done = false;
    const animateZoom = (delta: number) => {
      function lerp(start: number, end: number, t: number) {
        return start * (1 - t) + end * t;
      }
      elapsed += delta;
      const progress = TWEEN.Easing.Exponential.InOut(Math.min(elapsed / ZOOM_DURATION, 1));
      const newScale = lerp(startScale, endScale, progress);
      parentLayer.scale.set(newScale);

      const childScale = lerp(childStartScale, childEndScale, progress);
      childWidget.container.scale.set(childScale);
      
      const newX = lerp(parentLayer.position.x, centerX, progress);
      const newY = lerp(parentLayer.position.y, centerY, progress);
      parentLayer.position.set(newX, newY);


      const childX = lerp(centerX, childEndX, progress);
      const childY = lerp(centerY, childEndY, progress);
      childWidget.container.position.set(childX, childY);

      if (progress >= 1 && !done) {
        done = true;
        app!.ticker.remove(animateZoom);
        //app!.stage.removeChildren();
        if(history.includes(parentWidget)) {
          history.pop();
          childWidget.container.scale.set(LEVEL_SCALE)
          childWidget.clearAllInteractionHandlers()
          childWidget.makeNonInteractiveRecursive()
          parentWidget.injectChildWidget(childWidget)
          setMainExpressionWidget(parentWidget, childWidget)
        }
      }
    };
    app!.ticker.add(animateZoom);
};

function perspectiveDeleted(event) {
    console.log('perspectiveDeleted', event.detail);
    if(event.detail === perspectiveID) {
      perspectiveID = null;
    }

    dispatch('perspectiveDeleted', event.detail);
  }
</script>


  

  <div bind:this={canvas} class="canvas">
    <ul class="breadcrumbs">
      {#each history as he, i}
        <li class="breadcrumb {i == (history.length - 1) ? 'interactive-breadcrumb' : ''}"
            on:click={()=>{
              if(i == history.length - 1)
                zoomOut(he, currentWidget)
            }}
          >
            {he.base}
            {#if i < history.length - 1}
              <span class="breadcrumb-separator">/</span>
            {/if}
          </li>
      {/each}
    </ul>
  </div>

  {#if perspective}
    <MiniWindow title="Tools" left="90" background="var(--j-color-ui-300)" width="160">
      <Toolbar title="Perspect3ve" items={toolbarItems} />
    </MiniWindow>
    <MiniWindow title="Properties" left="{canvas.clientWidth - 200}" width="320">
      <PropertiesBrowser perspectiveID={perspectiveID} expression={selectedExpression} parent={selectionParent} on:perspectiveDeleted={perspectiveDeleted}/>  
    </MiniWindow>
    <MiniWindow title="3ve" width="350">
      <EveChat on:sdnacreated={(event)=>{
        console.log('sdnacreated', event)
        const sdna = event.detail;
        perspective?.addSdna(sdna);
      }}></EveChat>
    </MiniWindow>
    
  {/if}

<style>
  main {
    position: relative;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .canvas {
    position: relative;
    display: block;
    height: calc(100vh - 64px);
    width: 100%;
  }

  .breadcrumbs {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    padding: 10px;
    list-style: none;
    display: inline;
    align-items: center;
    user-select: none;
    z-index: 1;
  }

  .breadcrumb {
    display: inline;
    margin: 0;
    padding: 0;
    font-size: 14px;
    color: #757575;
  }

  .breadcrumb-separator {
    margin: 0 5px;
    color: #bdbdbd;
  }

  .interactive-breadcrumb {
    cursor: pointer;
    color: #3f51b5;
  }
</style>
