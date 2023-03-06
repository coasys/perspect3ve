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
  let children = new Map<string, Set<string>>();
  let coords = new Map<string, { x: number; y: number }>();
  let containers = new Map<string, PIXI.Container>();
  let currentExpression: string | null = null;

  let selectedExpression = null
  const dispatch = createEventDispatcher();

  async function findCoordsLink(expr: string, parent: string): Promise<LinkExpression | null> {
    const results = await perspective.get({ source: parent, target: expr })
    return results.find((link) => link.data.predicate.startsWith("p3://child_coords_2d"))
  }

  async function getCoords(expr: string, parent: string): Promise<{ x: number; y: number }> {
    const key = `${parent} -> ${expr}`;

    if (!coords.has(key)) {
      const link = await findCoordsLink(expr, parent)
      if(link) {
        const payload = link.data.predicate.substring(COORDS_PRED_PREFIX.length)
        const point = JSON.parse(payload)
        coords.set(key, { x: point.x, y: point.y })
        console.log('found coords for:', key, point)
        return point
      }
    }
    console.warn('no coords found for:', key)
    return { x: 0, y: 0 }
    
  }

  async function updateCoords(expr: string, parent: string, point: { x: number; y: number }) {
    const key = `${parent} -> ${expr}`;
    coords.set(key, point);
    let link = await findCoordsLink(expr, parent)
    while(link) {
      await perspective.remove(link)
      link = await findCoordsLink(expr, parent)
    }
    const payload = JSON.stringify({x: point.x, y: point.y})
    const predicate = `${COORDS_PRED_PREFIX}${payload}`
    await perspective.add({ source: parent, target: expr, predicate })
  }

  async function updateChildren(expr: string) {
    //debugger
    if (perspective) {
      const result = await perspective.get({ source: expr });
      if (result) {
        const childrenArray = result.map((link) => link.data.target);
        const childrenSet = new Set(childrenArray);
        children.set(expr, childrenSet);
       //console.log('updated children for:', expr);
      }
    } else {
      console.warn('updateChildren called before perspective was set');
    }
  }

  function _updateChildren(expr: string, currentTreeItem: any) {
    if (currentTreeItem.id === expr) {
      if (currentTreeItem.children) {
        children.set(
          expr,
          currentTreeItem.children.map((child) => child.id)
        );
      }
      return true;
    }
    if (currentTreeItem.children) {
      for (let child of currentTreeItem.children) {
        if (_updateChildren(expr, child)) {
          return true;
        }
      }
    }
    return false;
  }

  function renderExpressionLayer(
    expression: string,
    layer: PIXI.Container,
    renderChildren: boolean = false
  ) {
    containers.set(expression, layer);
    layer.addChild(createExpressionCircle(expression == selectedExpression), createTextNode(expression));
    if (renderChildren) 
      renderChildrenLayers(expression, layer)
    else
      renderChildrenCircles(expression, layer)
  }

  function updateExpressionLayer(expression: string) {
    let layer = containers.get(expression)
    if(layer) {
      layer.children.forEach(child => {
        layer?.removeChild(child)
      })
      renderExpressionLayer(expression, layer, false)
    }
  }

  function renderChildrenCircles(expression: string, layer: PIXI.Container) {
    console.log('renderChildrenCircles', expression);
    //updateChildren(expression);
    console.log('children:', children.get(expression));
    children.get(expression)?.forEach(async (child) => {
      let point = await getCoords(child, expression)
      if (!point) {
        console.error('no point for child:', child);
        return;
      }

      console.log('adding child:', child, 'at', point);
      let childLayer = new PIXI.Container();
      childLayer.position.set(point.x, point.y);
      childLayer.scale.set(LEVEL_SCALE);
      childLayer.addChild(createExpressionCircle(), createTextNode(child));
      layer.addChild(childLayer);
    });
  }




  // Define the zooming animation duration
  const zoomDuration = 50;

  // Define the pan speed and boundaries
  const panSpeed = 100;
  const panBounds = new PIXI.Rectangle(-1000, -1000, 2000, 2000);

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
      children.clear();
      coords.clear();
      await updateChildren('ad4m://self');
      //await updateCoords('ad4m://self');
      //debugger
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
