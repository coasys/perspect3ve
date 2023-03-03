<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as PIXI from 'pixi.js';
  import '@pixi/math-extras'
  import '@pixi/interaction'

  let app: PIXI.Application|undefined;
  let renderer: PIXI.Renderer|undefined;
  let container: PIXI.Container|undefined;
  let canvas

  const LEVEL_SCALE = 0.24

  let children = new Map<string, string[]>()
  let coords = new Map<string, {x: number, y: number}>()

  function updateCoords(expr: string) {
    return _upateCoords(expr, treeData)
  }

  function updateChildren(expr: string) {
    return _updateChildren(expr, treeData)
  }

  function _upateCoords(expr: string, currentTreeItem: any) {
    if(currentTreeItem.id === expr) {
      coords.set(expr, {x: currentTreeItem.x, y: currentTreeItem.y})
      return true
    }
    if(currentTreeItem.children) {
      for(let child of currentTreeItem.children) {
        if(_upateCoords(expr, child)) {
          return true
        }
      }
    }
    return false
  }

  function _updateChildren(expr: string, currentTreeItem: any) {
    if(currentTreeItem.id === expr) {
      if(currentTreeItem.children) {
        children.set(expr, currentTreeItem.children.map((child) => child.id))
      }
      return true
    }
    if(currentTreeItem.children) {
      for(let child of currentTreeItem.children) {
        if(_updateChildren(expr, child)) {
          return true
        }
      }
    }
    return false
  }

  const treeData = {
      id: 'A',
      x: 0,
      y: 0,
      children: [
          {
              id: 'B',
              x: 100,
              y: 0,
              children: [
                  {
                      id: 'C',
                      x: 200,
                      y: 100,
                  },
                  {
                      id: 'Dee',
                      x: -100,
                      y: -300,
                  }
              ]
          },
          {
              id: 'E',
              x: -30,
              y: -50,
          }
      ]
  };

  function renderExpressionLayer(expression: string, layer: PIXI.Container, renderChildren: boolean = false) {
    console.log("renderExpressionLayer", expression)
    updateCoords(expression)
    let point = coords.get(expression)
    if(!point) {
      console.error("no point for expression:", expression)
      return
    }
    layer.addChild(createExpressionCircle(), createTextNode(expression))
    if(renderChildren) renderChildrenLayers(expression, layer)
  }
  
  function renderChildrenCircles(expression: string, layer: PIXI.Container) {
    console.log("renderChildrenCircles", expression)
    updateChildren(expression)
    console.log("children:", children.get(expression))
    children.get(expression)?.forEach((child) => {
      let point = coords.get(child)
      if(!point) {
        updateCoords(child)
      }
      point = coords.get(child)

      if(!point) {
        console.error("no point for child:", child)
        return
      }

      console.log("adding child:", child, "at", point)
      let childLayer = new PIXI.Container()
      childLayer.position.set(point.x, point.y)
      childLayer.scale.set(LEVEL_SCALE)
      childLayer.addChild(createExpressionCircle(child, point), createTextNode(child))
      layer.addChild(childLayer)
    })
  }

  const zoomIn = (node, parentLayer, childLayer) => {
    console.log("zooming in to", node)
    const startScale = 1;
    const endScale = 1/childLayer.scale.x;
    let elapsed = 0;
    const animateZoom = delta => {
      function lerp(start, end, t) {
        return start * (1 - t) + end * t;
      }
      elapsed += delta;
      const progress = Math.min(elapsed / zoomDuration, 1);
      //console.log("progress:", progress)
      const newScale = lerp(startScale, endScale, progress);
      parentLayer.scale.set(newScale);
      const newX = lerp(canvas.clientWidth/2, canvas.clientWidth/2-childLayer.position.x*endScale, progress);
      const newY = lerp(canvas.clientHeight/2, canvas.clientHeight/2-childLayer.position.y*endScale, progress);
      parentLayer.position.set(newX, newY)
      if (progress >= 1) {
        app.ticker.remove(animateZoom);
        app.stage.removeChildren();
        setupLayers(node)
      }
    };
    app.ticker.add(animateZoom);
  };
          

function renderChildrenLayers(expression: string, layer: PIXI.Container) {
  console.log("renderChildrenLayers", expression)
  updateChildren(expression)
  console.log("children:", children.get(expression))
  children.get(expression)?.forEach((child) => {
    let point = coords.get(child)
    if(!point) {
      updateCoords(child)
    }
    point = coords.get(child)

    if(!point) {
      console.error("no point for child:", child)
      return
    }

    let childLayer = new PIXI.Container()
    childLayer.position.set(point.x, point.y)
    childLayer.scale.set(LEVEL_SCALE)
    console.log("adding child layer:", child, "at", point)
    renderExpressionLayer(child, childLayer)
    renderChildrenCircles(child, childLayer)
    childLayer.interactive = true;
    //childLayer.buttonMode = true;
    childLayer.hitArea = new PIXI.Rectangle(0, 0, childLayer.width, childLayer.height);
    let dblclickInterval = 
    childLayer.on('pointerdown', () => {
      zoomIn(child, layer, childLayer);
    });
    childLayer.on('pointermove', () => {
      console.log(child)
    });
    childLayer.on('dblclick', () => {
      console.log("dblclick -> zooming in")
      zoomIn(child, layer, childLayer);
    });
    
    layer.addChild(childLayer)
  })
}

function createExpressionCircle() {
  const circle = new PIXI.Graphics();
  //circle.beginFill(0xff00ff);
  circle.lineStyle(5, 0xffff0f);
  circle.drawCircle(0, 0, canvas.clientWidth / 2.5);
  //circle.endFill();
  circle.interactive = true;
  circle.buttonMode = true;
  //circle.on('pointerdown', onNodeClick);
  return circle;
}

function createTextNode(name) {
  const text = new PIXI.Text(name, {
    fontSize: 36,
    fill: 0x0000ff,
    align: 'center',
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
    app!.stage.children.forEach((child) => {
      app!.stage.removeChild(child);
    })
    const layer = new PIXI.Container();
    renderExpressionLayer(expr, layer, true)
    //renderChildrenCircles(expr, layer)
    //renderChildrenLayers(expr, layer)
    layer.position.set(canvas.clientWidth/2, canvas.clientHeight/2)
    app?.stage.addChild(layer);
  }

  
                  


  onMount(() => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    
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
      console.log("resize", canvas.clientWidth, canvas.clientHeight)
      // Set the width and height of the container to the new viewport size
      app?.resize(canvas.clientWidth, canvas.clientHeight);
      renderer.resize(canvas.clientWidth, canvas.clientHeight);
    });

    setupLayers('A')
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

<div bind:this={canvas} class="canvas"></div>

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
  