<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as PIXI from 'pixi.js';
  import '@pixi/math-extras'
  import '@pixi/interaction'

  let app: PIXI.Application|undefined;
  let renderer: PIXI.Renderer|undefined;
  let container: PIXI.Container|undefined;
  let canvas

  const NODE_RADIUS = 50;

let pixiContainer;
let rootNode;

function createNodeCircle(node) {
  const circle = new PIXI.Graphics();
  circle.beginFill(0xff00ff);
  circle.lineStyle(2, 0x000000);
  circle.drawCircle(0, 0, NODE_RADIUS);
  circle.endFill();
  circle.interactive = true;
  circle.buttonMode = true;
  circle.node = node;
  circle.on('pointerdown', onNodeClick);
  return circle;
}

function createTextNode(node) {
  const text = new PIXI.Text(node.name, {
    fontSize: 16,
    fill: 0x000000,
    align: 'center',
  });
  text.anchor.set(0.5);
  return text;
}

function createNodeDisplay(node) {
  const display = new PIXI.Container();
  const circle = createNodeCircle(node);
  const text = createTextNode(node);
  display.addChild(circle, text);
  display.node = node;
  return display;
}

function renderNodeDisplay(node, parentDisplay) {
  console.log("renderNodeDisplay:", node)
  const display = createNodeDisplay(node);
  console.log("display:", display)
  if (parentDisplay) {
    console.log("parentDisplay:", parentDisplay)
    display.x = NODE_RADIUS * 2;
    parentDisplay.addChild(display);
  } else {
    console.log("root node")
    display.x = app.renderer.width / 2;
    display.y = app.renderer.height / 2;
    app.stage.addChild(display);
  }
  if (node.children) {
    for (const child of node.children) {
      renderNodeDisplay(child, display);
    }
  }
}

function onNodeClick() {
  const node = this.node;
  const parentDisplay = this.parent;
  const newRoot = createNodeDisplay(node);
  newRoot.x = app.renderer.width / 2;
  newRoot.y = app.renderer.height / 2;
  app.stage.removeChildren();
  app.stage.addChild(newRoot);
  renderNodeDisplay(node, newRoot);
  rootNode = node;
}

    // Define the tree data structure
    const treeData = {
      id: 'A',
      children: [
          {
              id: 'B',
              children: [
                  {
                      id: 'C'
                  },
                  {
                      id: 'D'
                  }
              ]
          },
          {
              id: 'E'
          }
      ]
  };
      

  // Define the circle size and spacing
  const circleRadius = 30;
  const circleSpacing = 80;

  // Define the zooming animation duration
  const zoomDuration = 50;

  // Define the pan speed and boundaries
  const panSpeed = 100;
  const panBounds = new PIXI.Rectangle(-1000, -1000, 2000, 2000);

  

  // Define a recursive function to create the circles and add them to the container
  const createCircles = (node: any, x: number, y: number, depth: number) => {
    console.log("createCircles:", node)
    // Create the circle
    const circle = new PIXI.Graphics();
    circle.beginFill(0x0000ff);
    circle.drawCircle(x, y, circleRadius);
    circle.endFill();
    //circle.x = x;
    //circle.y = y;
    circle.interactive = true;
    circle.on('pointerdown', () => {
      console.log("click cicrle")
      console.log(node)
        if (node.children) {
          console.log("click cicrle 2")
          // Zoom in to show the children circles
          const containerScale = container.scale.x;
          const zoomIn = () => {
            const startScale = container.scale.x;
            const endScale = startScale * 2;
            let elapsed = 0;
            const animateZoom = delta => {
              function lerp(start, end, t) {
                return start * (1 - t) + end * t;
              }
              elapsed += delta;
              const progress = Math.min(elapsed / zoomDuration, 1);
              console.log("progress:", progress)
              const newScale = lerp(startScale, endScale, progress);
              container.scale.set(newScale);
              const newPosition = new PIXI.Point(-x + renderer.width / 2, -y + renderer.height / 2);
              const deltaPosition = newPosition.clone().subtract(container.position);
              const distance = deltaPosition.magnitude()
              const speed = Math.min(distance / zoomDuration, panSpeed);
              deltaPosition.normalize().multiplyScalar(speed);
              container.position.add(deltaPosition);
              if (progress >= 1) {
                app.ticker.remove(animateZoom);
                app.stage.removeChildren();
                container.removeChildren();
                createCircles(node, 0, 0, 0);
                container.position.set(x, y);
                node.children.forEach((child, index) => {
                  const angle = (index / node.children.length) * Math.PI * 2;
                  const childX = (circleRadius + circleSpacing) * Math.cos(angle);
                  const childY = (circleRadius + circleSpacing) * Math.sin(angle);
                  createCircles(child, childX, childY, depth + 1);
                });
              }
            };
            app.ticker.add(animateZoom);
          };
          zoomIn();
        }
    });
    console.log("adding circle:", circle)
    container.addChild(circle);


    // Add the circle label
    const label = new PIXI.Text(node.id, {
      fontSize: 20,
      fill: 0xff0000,
      align: 'center'
    });
    label.anchor.set(0.5);
    label.x = x;
    label.y = y + circleRadius + 10;
    console.log("label:", label)
    container.addChild(label);

    console.log("recursively adding children", node.children)
    // Add the children circles recursively
    if (node.children) {
      node.children.forEach((child, index) => {
        const angle = (index / node.children.length) * Math.PI * 2;
        const childX = (circleRadius + circleSpacing) * Math.cos(angle);
        const childY = (circleRadius + circleSpacing) * Math.sin(angle);
        createCircles(child, childX, childY, depth + 1);
      });
    }
  };
                  


  onMount(() => {

    pixiContainer = new PIXI.Container();

    app = new PIXI.Application({
      width: pixiContainer.clientWidth,
      height: pixiContainer.clientHeight,
      antialias: true,
    });
/*
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    console.log("width:", width)
    console.log("height:", height)
    
    // Create a PixiJS application
    app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x000011
    });

    // Add the PixiJS view to the DOM
    canvas.appendChild(app.view);
    // Create a container for the circles and labels
    container = new PIXI.Container();
    app.stage.addChild(container);
    container.position.set(300, 300);

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
    

    

    
    app.stage.addChild(pixiContainer);
    pixiContainer.position.set(300, 300);


    rootNode = treeData;
    renderNodeDisplay(treeData, null);
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
  