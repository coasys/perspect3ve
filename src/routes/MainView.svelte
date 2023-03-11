<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as PIXI from 'pixi.js';
  import '@pixi/math-extras';
  import '@pixi/interaction';
  import * as TWEEN from '@tweenjs/tween.js';
  import type { HistoryElement } from './History';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { PerspectiveProxy, LinkExpression, Literal, SmartLiteral, Link } from '@perspect3vism/ad4m';  
  import { COORDS_PRED_PREFIX, ExpressionWidget, LEVEL_SCALE } from './ExpressionWidget';
  import Toolbar from './Toolbar.svelte';

  export let perspectiveID: string;
  
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

  async function setMainExpressionWidget(widget: ExpressionWidget, formerMainWidget? : ExpressionWidget) {
    console.log("setMainExpressionWidget", widget.base)
    currentWidget = widget;
    widget.unfreeze()

    if(!seenWidgets.has(widget)) {
      console.log("first time seen", widget.base)
      seenWidgets.add(widget);
      widgtesByExpr.set(widget.base, widget);
      await widget.addChildrenInteractive()
    } else {
      widget.makeAllChildrenInteractive()
    }

    if(formerMainWidget) {
      formerMainWidget.makeNonInteractiveRecursive()
      formerMainWidget.clearInteractionHandlers()
      formerMainWidget.clearEventCallbacks()
      formerMainWidget.destroy()
    }

    const historyParent = history[history.length - 1];
    if(historyParent) {
      historyParent.onSelectionChanged((expr) => {
        if(expr == historyParent.base) {
          dispatch('selectionChanged', expr)
          zoomOut(historyParent, currentWidget!)
        }
      })
    }
    
    widget.clearEventCallbacks()
    widget.onSelectionChanged((expr) => {
        dispatch('selectionChanged', expr)
      })
    widget.onDoubleClick((child) => {
      zoomIn(widget, child);
    })

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
      createToolbar()
      const ad4m = await getAd4mClient();
      perspective = await ad4m.perspective.byUUID(perspectiveID);
      app?.stage.removeChildren()
      const ad4mSelf = getOrCreateWidget('ad4m://self');
      ad4mSelf.container.position.set(canvas!.clientWidth / 2, canvas!.clientHeight / 2);
      setMainExpressionWidget(ad4mSelf);
      app?.stage.addChild(ad4mSelf.container);
    }
  }

  async function createToolbar() {
    toolbarItems = [
      {
        icon: 'plus',
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
      },
      {
        icon: 'minus',
        onClick: () => {
          console.log('clicked minus');
        },
      },
      {
        icon: 'home',
        onClick: () => {
          console.log('clicked home');
        },
      },
    ]
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
      backgroundColor: 0x000011,
      antialias: true,
    });

    // Add the PixiJS view to the DOM
    canvas!.appendChild(app.view);

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
    let parentLayer = parent.container
    const childLayer = child.container

    let centerX = canvas!.clientWidth / 2;
    let centerY = canvas!.clientHeight / 2;
   
    const topLevelWidget = history[0]
    if(topLevelWidget) {
      parentLayer = topLevelWidget.container
    }

    const allParents = [...history]
    allParents.push(parent)

    const {x: displacementX, y: displacementY} = aggregateZoomDisplacement(history, {x: centerX, y: centerY})
    
    const startScale = 1/(LEVEL_SCALE ** history.length);
    const endScale = 1/(LEVEL_SCALE ** (history.length + 1));

    const startX = parentLayer.position.x
    const startY = parentLayer.position.y

    const endX = displacementX - childLayer.position.x/LEVEL_SCALE + centerX
    const endY = displacementY - childLayer.position.y/LEVEL_SCALE + centerY


    //console.log("endScale: ", endScale)
    let elapsed = 0;
    const animateZoom = (delta: number) => {
      elapsed += delta;
      const progress = TWEEN.Easing.Exponential.InOut(Math.min(elapsed / ZOOM_DURATION, 1));
      const newScale = lerp(startScale, endScale, progress);
      const newX = lerp(startX, endX, progress);
      const newY = lerp(startY, endY, progress);

      parentLayer.scale.set(newScale);
      parentLayer.position.set(newX, newY);

      if (progress >= 1) {
        app!.ticker.remove(animateZoom);
        //app!.stage.removeChildren();
        history.push(parent);
        setMainExpressionWidget(child, parent);
      }
  };
  app!.ticker.add(animateZoom);
};

const zoomOut = (parentWidget: ExpressionWidget, childWidget: ExpressionWidget) => {
    const startScale = 1/(LEVEL_SCALE ** (history.length));
    const endScale = 1/(LEVEL_SCALE ** (history.length - 1));

    console.log("startScale: ", startScale)
    console.log("endScale: ", endScale)

    let elapsed = 0;

    let parentLayer = parentWidget.container
    const topLevelWidget = history[0]
    if(topLevelWidget) {
      parentLayer = topLevelWidget.container
    }

    let centerX = canvas!.clientWidth / 2;
    let centerY = canvas!.clientHeight / 2;

    console.log(history)
    const oldDisplacement = aggregateZoomDisplacement(history, {x: centerX, y: centerY})
    const historyClipped = history.slice(0, history.length-1)
    console.log(historyClipped)
    let newDisplacement = aggregateZoomDisplacement(historyClipped, {x: centerX, y: centerY})

    let displacementX = 0
    let displacementY = 0

    for(let i = 0; i < historyClipped.length; i++) {
      const parent = historyClipped[i]
      displacementX += (parent.relativePosition.x - centerX) / (LEVEL_SCALE ** (historyClipped.length-i-1)) 
      displacementY += (parent.relativePosition.y - centerY) / (LEVEL_SCALE ** (historyClipped.length-i-1))
    }
    
    newDisplacement = {x: displacementX, y: displacementY}

    const pos = `${parentLayer.position.x} ${parentLayer.position.y}`
    console.log("oldPos", parentLayer.position.x, parentLayer.position.y)
    console.log("oldDisplacement: ", oldDisplacement)
    console.log("newDisplacement: ", newDisplacement)

    const animateZoom = (delta: number) => {
      function lerp(start: number, end: number, t: number) {
        return start * (1 - t) + end * t;
      }
      elapsed += delta;
      const progress = TWEEN.Easing.Exponential.InOut(Math.min(elapsed / ZOOM_DURATION, 1));
      const newScale = lerp(startScale, endScale, progress);
      parentLayer.scale.set(newScale);
      
      const newX = lerp(parentLayer.position.x, newDisplacement.x + centerX, progress);
      const newY = lerp(parentLayer.position.y, newDisplacement.y + centerY, progress);
      parentLayer.position.set(newX, newY);
      console.log('newX', newX, 'newY', newY)
      if (progress >= 1) {
        app!.ticker.remove(animateZoom);
        //app!.stage.removeChildren();
        history.pop();
        setMainExpressionWidget(parentWidget, childWidget)
      }
    };
    app!.ticker.add(animateZoom);
};


</script>
<Toolbar title="Perspect3ve" items={toolbarItems} />
<div bind:this={canvas} class="canvas" />

<style>
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .canvas {
    display: block;
    height: 100%;
    width: 100%;
  }
</style>
