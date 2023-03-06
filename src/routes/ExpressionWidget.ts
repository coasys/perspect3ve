import * as PIXI from 'pixi.js';
import '@pixi/math-extras';
import '@pixi/interaction';
import { LinkQuery, type LinkExpression, type PerspectiveProxy } from '@perspect3vism/ad4m';
import { Graphics } from 'pixi.js';

const COORDS_PRED_PREFIX = "p3://child_coords_2d"
const LEVEL_SCALE = 0.24;

const OUTLINE_COLOR = 0x5a5a5a;
const OUTLINE_COLOR_SELCTED = 0xffffff;
const OUTLINE_WIDTH = 5;
const OUTLINE_WIDTH_SELECTED = 8;




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




export class ExpressionWidget {
    #base: string
    #perspective: PerspectiveProxy
    #container: PIXI.Container
    #selected: boolean = false
    #graphic: PIXI.Graphics | null = null
    #text: PIXI.Text | null = null
    #childrenCoords: Map<string, {x: number, y: number}> = new Map()
    #childrenWidgets: Map<string, ExpressionWidget> = new Map()
    #canvasSize: {width: number, height: number} = {width: 0, height: 0}

    constructor(
        expression: string, 
        perspective: PerspectiveProxy, 
        container: PIXI.Container,
        canvasSize: {width: number, height: number}
    ) {
        this.#base = expression;
        this.#perspective = perspective;
        this.#container = container
        this.#canvasSize = canvasSize
        this.addGraphAndText()
    }

    addGraphAndText() {
        this.#graphic = this.#createExpressionCircle()
        this.#text = this.#createTextNode(this.#base)
        this.#container.addChild(this.#graphic, this.#text)
    }

    async updateChildrenCoords() {
        const result: LinkExpression[] = await this.#perspective.get({ source: this.#base });        
        for(const link of result) {
            const child = link.data.target  
            if(link.data.predicate.startsWith(COORDS_PRED_PREFIX)) {
                const payload = link.data.predicate.substring(COORDS_PRED_PREFIX.length)
                const point = JSON.parse(payload)
                this.#childrenCoords.set(child, point)
            } else {
                if(!this.#childrenCoords.get(child)) {
                    let point = {x: 0, y: 0}
                    this.#childrenCoords.set(child, point)
                }
            }            
        }
    }

    addChild(child: string, point: {x: number, y: number}) {
        let childLayer = new PIXI.Container();
        childLayer.scale.set(LEVEL_SCALE);
        childLayer.position.set(point.x, point.y);

        const childWidget = new ExpressionWidget(child, this.#perspective, childLayer, this.#canvasSize)
        this.#childrenWidgets.set(child, childWidget)

        this.#container.addChild(childLayer)
        return { childWidget, childLayer }
    }

    async addChildrenLeafs() {
        await this.updateChildrenCoords();
        
        this.#childrenCoords.forEach((point, child) => {
            this.addChild(child, point)
        })
    }

    async addChildrenInteractive() {
        await this.updateChildrenCoords();
        
        this.#childrenCoords.forEach((point, child) => {
            const { childWidget, childLayer } = this.addChild(child, point)

            childWidget.addChildrenLeafs()
          
          
          childLayer.interactive = true;
          let isDragging = false;
          let isPointerDown = false;
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
    
            isPointerDown = true;
            isDragging = false;
            console.log(event.data.global);
            dragStart.copyFrom(event.data.global);
    
            oneClick = true;
            setTimeout(() => {
              oneClick = false;
            }, 200);
          });
          childLayer.on('pointerup', () => {
            if (twoClicks) {
                console.log('dblclick -> zooming in');
                zoomIn(child, layer, childLayer, expression);
            } else {
                if(isDragging) {
                    this.#updateChildCoords(child, childLayer.position)
                    isDragging = false;
                } 

                childWidget.setSelected(true)
                this.#childrenWidgets.forEach((widget, key) => {
                    if(key !== child) {
                        widget.setSelected(false)
                    }
                })
                
                isPointerDown = false;
            }
          });
          childLayer.on('pointermove', (event) => {
            if (isPointerDown) {
              isDragging = true;
              const currentPoint = event.data.global;
              childLayer.position.x += currentPoint.x - dragStart.x;
              childLayer.position.y += currentPoint.y - dragStart.y;
              dragStart.copyFrom(event.data.global);
            }
          });
    
          this.#container.addChild(childLayer);
        });
      }


    setSelected(selected: boolean) {
        if(this.#selected === selected) return

        this.#selected = selected
        this.#graphic!.clear()
        this.#drawExpressionCircle(this.#graphic!)
    }

    async #updateChildCoords(child: string, point: { x: number; y: number }) {
        this.#childrenCoords.set(child, point)
        let link = await this.#findCoordsLink(child)
        while(link) {
          await this.#perspective.remove(link)
          link = await this.#findCoordsLink(child)
        }
        await this.#writeCoordsLink(child, point)
    }

    async #findCoordsLink(expr: string): Promise<LinkExpression | undefined> {
        const results = await this.#perspective.get(new LinkQuery({ source: this.#base, target: expr }))
        return results.find((link) => link.data.predicate.startsWith(COORDS_PRED_PREFIX))
    }

    async #writeCoordsLink(expr: string, point: {x: number, y: number}) {
        const payload = JSON.stringify({x: point.x, y: point.y})
        const predicate = `${COORDS_PRED_PREFIX}${payload}`
        await this.#perspective.add({ source: this.#base, target: expr, predicate })
    }

    

    #createExpressionCircle(): PIXI.Graphics {
        const circle = new PIXI.Graphics();
        this.#drawExpressionCircle(circle)
        circle.interactive = true;
        circle.buttonMode = true;
        return circle;
    }

    #drawExpressionCircle(graphic: PIXI.Graphics) {
        graphic.beginFill(0xff00ff, this.#selected ? 0.5 : 0.2);
        if(this.#selected)
            graphic.lineStyle(OUTLINE_WIDTH_SELECTED, OUTLINE_COLOR_SELCTED);
        else
            graphic.lineStyle(OUTLINE_WIDTH, OUTLINE_COLOR);
        graphic.drawCircle(0, 0, this.#canvasSize.width / 2.5);
        graphic.endFill();
    }
    
    #createTextNode(str) {
        let align = 'center';
        let yAnchor = 0.5;

        try {
            str = Literal.fromUrl(str).get()
        } catch(e) {}

        if (typeof str == 'object'){
            str = JSON.stringify(str, null, 2)
            align = 'left'
            yAnchor = 1
        } 

        const text = new PIXI.Text(str, {
            fontSize: 36,
            fill: 0x0000ff,
            align
        });
        text.anchor.set(0.5, yAnchor);
        return text;
    }
}