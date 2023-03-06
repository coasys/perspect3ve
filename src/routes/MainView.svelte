<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as PIXI from 'pixi.js';
  import '@pixi/math-extras';
  import '@pixi/interaction';
  import { HistoryElement } from './History';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { PerspectiveProxy, LinkExpression, Literal, SmartLiteral, Link } from '@perspect3vism/ad4m';
    import { ExpressionWidget } from './ExpressionWidget';

  

  export let perspectiveID: string;

  let app: PIXI.Application | undefined;
  let renderer: PIXI.Renderer | undefined;
  let canvas;

  let perspective: PerspectiveProxy | undefined;

  let history: HistoryElement[] = [];
  let coords = new Map<string, { x: number; y: number }>();
  let currentExpression: string | null = null;

  let selectedExpression = null
  const dispatch = createEventDispatcher();

  function setupLayers(expr: string) {
    coords.clear();

    app!.stage.children.forEach((child) => {
      app!.stage.removeChild(child);
    });

    currentExpression = expr

    app?.stage.addChild(createToolbar())
    const layer = new PIXI.Container();
    let parent = history[history.length - 1];
    //debugger
    if (parent) {
      const parentLayer = new PIXI.Container();
      parentLayer.position.set(parent.x, parent.y);
      parentLayer.scale.set(1 / LEVEL_SCALE);
      const parentWidget = new ExpressionWidget(
        parent.expression, 
        perspective, 
        parentLayer,
        { width: canvas.clientWidth, height: canvas.clientHeight}
      )
      app?.stage.addChild(parentLayer);

      parentLayer.on('pointerdown', (event) => {
        console.log('zooming out');
        zoomOut(parent, parentLayer);
      });
    }
    app?.stage.addChild(layer);
    layer.position.set(canvas.clientWidth / 2, canvas.clientHeight / 2);
    const widget = new ExpressionWidget(
      expr, 
      perspective, 
      layer,
      { width: canvas.clientWidth, height: canvas.clientHeight}
    )
    widget.addChildrenInteractive()
  }

  $: if (perspectiveID || !perspectiveID) update();

  async function update() {
    if(perspectiveID) {
      const ad4m = await getAd4mClient();
      perspective = await ad4m.perspective.byUUID(perspectiveID);
      setupLayers('ad4m://self');
    } else {
      setupLayers('')
    }
  }

  function createToolbar(): PIXI.Container {
    // Create a new PIXI.Container object for the toolbar
    const toolbar = new PIXI.Container();
    toolbar.width = renderer.width;
    toolbar.height = 50;
    app.stage.addChild(toolbar);

    // Create a new PIXI.Graphics object for the circle
    const circle = new PIXI.Graphics();
    circle.beginFill(0xff0000);
    circle.drawCircle(0, 0, 25);
    circle.endFill();
    circle.interactive = true;
    circle.buttonMode = true;
    circle.home = {x: 30, y: 30};
    circle.position = circle.home;

    // Add event listeners for the pointer events
    circle.on('pointerdown', async () => {
      // create new smart literal
      const literal = await SmartLiteral.create(perspective, "New Expression")

      perspective?.add(new Link({
        source: currentExpression,
        predicate: `${COORDS_PRED_PREFIX}{"x": 0, "y": 0}`,
        target: literal.base
      }))
    })
          //.on('pointerup', onDragEnd)
          //.on('pointerupoutside', onDragEnd)
          //.on('pointermove', onDragMove);

    // Add the circle to the toolbar
    toolbar.addChild(circle);
    return toolbar
  }

  onMount(async () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Create a PixiJS application
    app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x000011
    });

    // Add the PixiJS view to the DOM
    canvas.appendChild(app.view);

    // Create a PixiJS renderer
    renderer = PIXI.autoDetectRenderer({
      width,
      height
    });

    window.addEventListener('resize', () => {
      console.log('resize', canvas.clientWidth, canvas.clientHeight);
      // Set the width and height of the container to the new viewport size
      app?.resize(canvas.clientWidth, canvas.clientHeight);
      renderer.resize(canvas.clientWidth, canvas.clientHeight);
    });
  });

  onDestroy(() => {
    // Clean up the PixiJS application and renderer
    app?.destroy(true);
    renderer?.destroy(true);
  });
</script>

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
    border: 2px red solid;
  }
</style>
