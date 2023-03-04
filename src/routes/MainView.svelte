<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as PIXI from 'pixi.js';
  import '@pixi/math-extras';
  import '@pixi/interaction';
  import { HistoryElement } from './History';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { PerspectiveProxy, LinkExpression } from '@perspect3vism/ad4m';

  export let perspectiveID: string;

  let app: PIXI.Application | undefined;
  let renderer: PIXI.Renderer | undefined;
  let container: PIXI.Container | undefined;
  let canvas;

  let perspective: PerspectiveProxy | undefined;

  const LEVEL_SCALE = 0.24;

  let history: HistoryElement[] = [];
  let children = new Map<string, Set<string>>();
  let coords = new Map<string, { x: number; y: number }>();

  async function findCoordsLink(expr: string, parent: string): Promise<LinkExpression | null> {
    const results = await perspective.get({ source: parent, target: expr })
    return results.find((link) => link.data.predicate.startsWith("p3://child_coords_2d"))
  }

  async function getCoords(expr: string, parent: string): Promise<{ x: number; y: number }> {
    const key = `${parent} -> ${expr}`;

    if (!coords.has(key)) {
      const link = await findCoordsLink(expr, parent)
      if(link) {
        const payload = link.data.predicate.substring("p3://child_coords_2d".length)
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
    const predicate = `p3://child_coords_2d${payload}`
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
    console.log('renderExpressionLayer', expression);
    layer.addChild(createExpressionCircle(), createTextNode(expression));
    if (renderChildren) renderChildrenLayers(expression, layer);
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
      childLayer.addChild(createExpressionCircle(child, point), createTextNode(child));
      layer.addChild(childLayer);
    });
  }

  const zoomIn = (node, parentLayer, childLayer, parentNode) => {
    console.log('zooming in to', node);
    const startScale = 1;
    const endScale = 1 / childLayer.scale.x;
    let elapsed = 0;
    const animateZoom = (delta) => {
      function lerp(start, end, t) {
        return start * (1 - t) + end * t;
      }
      elapsed += delta;
      const progress = Math.min(elapsed / zoomDuration, 1);
      //console.log("progress:", progress)
      const newScale = lerp(startScale, endScale, progress);
      parentLayer.scale.set(newScale);
      const newX = lerp(
        canvas.clientWidth / 2,
        canvas.clientWidth / 2 - childLayer.position.x * endScale,
        progress
      );
      const newY = lerp(
        canvas.clientHeight / 2,
        canvas.clientHeight / 2 - childLayer.position.y * endScale,
        progress
      );
      parentLayer.position.set(newX, newY);
      if (progress >= 1) {
        app.ticker.remove(animateZoom);
        app.stage.removeChildren();
        history.push({
          expression: parentNode,
          x: parentLayer.position.x,
          y: parentLayer.position.y
        });
        setupLayers(node);
      }
    };
    app.ticker.add(animateZoom);
  };

  function renderChildrenLayers(expression: string, layer: PIXI.Container) {
    //console.log('renderChildrenLayers', expression);
    updateChildren(expression);
    //console.log('children:', children.get(expression));
    children.get(expression)?.forEach(async (child) => {
      let point = await getCoords(child, expression);
      //console.log("COORS:",expression, point)
      if (!point) {
        console.error('no point for child:', child);
        return;
      }

      let childLayer = new PIXI.Container();
      childLayer.scale.set(LEVEL_SCALE);
      childLayer.position.set(point.x, point.y);
      
      //console.log('adding child layer:', child, 'at', point);
      renderExpressionLayer(child, childLayer);
      renderChildrenCircles(child, childLayer);
      childLayer.interactive = true;
      //childLayer.buttonMode = true;
      //childLayer.hitArea = new PIXI.Rectangle(-2*childLayer.width, -2*childLayer.height, 2*childLayer.width, 2*childLayer.height);
      let isDragging = false;
      let dragStart = new PIXI.Point();
      let oneClick = false;
      let twoClicks = false;
      childLayer.on('pointerdown', (event) => {
        //zoomIn(child, layer, childLayer);
        if (oneClick) {
          twoClicks = true;
          setTimeout(() => {
            twoClicks = false;
          }, 200);
        }

        isDragging = true;
        console.log(event.data.global);
        dragStart.copyFrom(event.data.global);

        oneClick = true;
        setTimeout(() => {
          oneClick = false;
        }, 200);
      });
      childLayer.on('pointerup', () => {
        isDragging = false;
        if (twoClicks) {
          console.log('dblclick -> zooming in');
          zoomIn(child, layer, childLayer, expression);
        } else {
          updateCoords(child, expression, childLayer.position);
        }
      });
      childLayer.on('pointermove', (event) => {
        if (isDragging) {
          const currentPoint = event.data.global;
          childLayer.position.x += currentPoint.x - dragStart.x;
          childLayer.position.y += currentPoint.y - dragStart.y;
          //container.position.x = PIXI.utils.clamp(container.position.x, panBounds.x, panBounds.x + panBounds.width);
          //container.position.y = PIXI.utils.clamp(container.position.y, panBounds.y, panBounds.y + panBounds.height);
          dragStart.copyFrom(event.data.global);
        }
      });
      childLayer.on('dblclick', () => {
        console.log('dblclick -> zooming in');
        zoomIn(child, layer, childLayer);
      });

      layer.addChild(childLayer);
    });
  }

  function createExpressionCircle() {
    const circle = new PIXI.Graphics();
    circle.beginFill(0xff00ff, 0.2);
    circle.lineStyle(5, 0x5a5a5a);
    circle.drawCircle(0, 0, canvas.clientWidth / 2.5);
    circle.endFill();
    circle.interactive = true;
    circle.buttonMode = true;
    return circle;
  }

  function createTextNode(name) {
    const text = new PIXI.Text(name, {
      fontSize: 36,
      fill: 0x0000ff,
      align: 'center'
    });
    text.anchor.set(0.5, 0.5);
    return text;
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
    const layer = new PIXI.Container();
    let parent = history[history.length - 1];
    //debugger
    if (parent) {
      const parentLayer = new PIXI.Container();
      parentLayer.position.set(parent.x, parent.y);
      parentLayer.scale.set(1 / LEVEL_SCALE);
      renderExpressionLayer(parent.expression, parentLayer);
      //parentLayer.interactive = true;
      //parentLayer.buttonMode = true;

      app?.stage.addChild(parentLayer);

      const zoomOut = (node, parentLayer, childLayer) => {
        console.log('zooming in to', node);
        const startScale = 1 / LEVEL_SCALE;
        const endScale = 1;
        const startScaleInner = 1;
        const endScaleInner = LEVEL_SCALE;
        let elapsed = 0;

        const animateZoom = (delta) => {
          function lerp(start, end, t) {
            return start * (1 - t) + end * t;
          }
          elapsed += delta;
          const progress = Math.min(elapsed / zoomDuration, 1);
          //console.log("progress:", progress)
          const newScale = lerp(startScale, endScale, progress);
          const newScaleInner = lerp(startScaleInner, endScaleInner, progress);
          parentLayer.scale.set(newScale);
          layer.scale.set(newScaleInner);
          const newX = lerp(parent.x, canvas.clientWidth / 2, progress);
          const newY = lerp(parent.y, canvas.clientHeight / 2, progress);
          parentLayer.position.set(newX, newY);
          if (progress >= 1) {
            app.ticker.remove(animateZoom);
            app.stage.removeChildren();
            history.pop();
            setupLayers(parent?.expression);
          }
        };
        app.ticker.add(animateZoom);
      };
      parentLayer.on('pointerdown', (event) => {
        console.log('zooming out');
        zoomOut(parent, parentLayer);
      });
    }
    app?.stage.addChild(layer);
    layer.position.set(canvas.clientWidth / 2, canvas.clientHeight / 2);
    renderExpressionLayer(expr, layer, true);

    //renderChildrenCircles(expr, layer)
    //renderChildrenLayers(expr, layer)
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

    //setupLayers('ad4m://self');
    /*
    // Create a container for the circles and labels
    container = new PIXI.Container();
    app.stage.addChild(container);
    container.position.set(300, 300);
    const background = new PIXI.Graphics()
      .beginFill(0x050505)
      .drawRect(-renderer.width*5, -renderer.height*5, renderer.width*10, renderer.height*10)
      .endFill();

    container.addChild(background)

    // Render the PixiJS stage
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(app.stage);
    }
    animate();

    // Create the circles for the initial tree data
    createCircles(treeData, 0, 0, 0);

    // Enable dragging and panning of the container
    let isDragging = false;
    let dragStart = new PIXI.Point();
    let dragDelta = new PIXI.Point();
    
    container.background = new PIXI.Sprite(PIXI.Texture.WHITE);
    container.background.tint = 0x0a0a0a0;
    container.background.width = renderer.width;
    container.background.height = renderer.height;
    container.width = width;
    container.height = height;
    container.interactive = true
    */

    /*
    app.stage.on('pointerdown', event => {
      console.log("start dragging")
      isDragging = true;
      console.log(event.data.global)
      dragStart.copyFrom(event.data.global);
    });
    app.stage.on('pointermove', event => {
        if (isDragging) {
          const currentPoint = event.data.global;
          dragDelta.set(currentPoint.x - dragStart.x, currentPoint.y - dragStart.y);
          container.position.x += dragDelta.x;
          container.position.y += dragDelta.y;
          //container.position.x = PIXI.utils.clamp(container.position.x, panBounds.x, panBounds.x + panBounds.width);
          //container.position.y = PIXI.utils.clamp(container.position.y, panBounds.y, panBounds.y + panBounds.height);
          dragStart.copyFrom(event.data.global);
        }
    });
    app.stage.on('pointerup', event => {
      console.log("stop dragging")
      isDragging = false;
    });
    app.stage.on('pointerupoutside', event => {
      console.log("stop dragging")
      isDragging = false;
    });
    
*/

    //app.stage.addChild(pixiContainer);
    //pixiContainer.position.set(300, 300);

    //rootNode = treeData;
    //renderNodeDisplay(treeData, null);
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
