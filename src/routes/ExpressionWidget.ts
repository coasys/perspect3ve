import * as PIXI from 'pixi.js';
import '@pixi/math-extras';
import '@pixi/interaction';
import { LinkQuery, type LinkExpression, type PerspectiveProxy, Literal } from '@perspect3vism/ad4m';

export const COORDS_PRED_PREFIX = "p3://child_coords_2d"
export const LEVEL_SCALE = 0.16;

const OUTLINE_COLOR = 0x5a5a5a;
const OUTLINE_COLOR_SELCTED = 0xffffff;
const OUTLINE_WIDTH = 5;
const OUTLINE_WIDTH_SELECTED = 8;

let perspectiveBackground = PIXI.Assets.load('public/perspective_background.png')

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

    #selectedCallbacks: Array<(expr: string) => void> = []
    #doubleClickCallbacks: Array<(widget: ExpressionWidget) => void> = []

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

        this.#perspective.addListener('link-added', (link) => {
            if(link.data.source == this.#base) {
                if(link.data.predicate.startsWith(COORDS_PRED_PREFIX)) {
                    const payload = link.data.predicate.substring(COORDS_PRED_PREFIX.length)
                    const point = JSON.parse(payload)
                    this.#childrenCoords.set(link.data.target, point)
                    let widget = this.#childrenWidgets.get(link.data.target)
                    let layer
                    if(!widget) {
                        const { childWidget, childLayer } = this.addChild(link.data.target, point)
                        widget = childWidget
                        layer = childLayer

                        widget.addChildrenLeafs()

                        this.#makeChildInteractive(widget, layer)
                    } else {
                        layer = widget.#container
                    }
                    layer.position.set(point.x, point.y)
                }
            }
            return null
        })

        this.#container.on('pointerup', (event) => {
            //console.log('pointerup', event.target)
            if(event.target == this.#graphic) {
                this.setSelected(true)
                this.#childrenWidgets.forEach(child => child.setSelected(false))
                this.#selectedCallbacks.forEach(callback => callback(this.#base))
            }
        })
    }

    get base() {
        return this.#base
    }

    get container() {
        return this.#container
    }

    onSelectionChanged(callback: (expr: string) => void) {
        this.#selectedCallbacks.push(callback)
    }

    onDoubleClick(callback: (widget: ExpressionWidget) => void) {
        this.#doubleClickCallbacks.push(callback)
    }

    addGraphAndText() {
        this.#graphic = this.#createExpressionGraphic()
        if(this.#base == "ad4m://self") {
            this.#createPerspectiveBackground().then((sprite) => {
                this.#container.addChild(sprite)
            })
        } else {
            this.#text = this.#createTextNode(this.#base)
            this.#container.addChild(this.#text)
        }

        this.#container.addChild(this.#graphic)
    }

    async updateChildrenCoords() {
        const result: LinkExpression[] = await this.#perspective.get(new LinkQuery({ source: this.#base }));        
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
            this.#makeChildInteractive(childWidget, childLayer)
    
            this.#container.addChild(childLayer);
        });
    }

    #makeChildInteractive(childWidget: ExpressionWidget, childLayer: PIXI.Container) {
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
                this.#doubleClickCallbacks.forEach(callback => callback(childWidget))
                //console.log('dblclick -> zooming in');
                //zoomIn(child, this.#container, childLayer, this.#base);
            } else {
                if(isDragging) {
                    this.#updateChildCoords(childWidget.#base, childLayer.position)
                    isDragging = false;
                } 

                childWidget.setSelected(true)
                this.#childrenWidgets.forEach((widget, key) => {
                    if(key !== childWidget.#base) {
                        widget.setSelected(false)
                    }
                })
                this.setSelected(false)
                this.#selectedCallbacks.forEach(callback => callback(childWidget.#base))
            }
            isPointerDown = false;
            isDragging = false;
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
    }



    setSelected(selected: boolean) {
        if(this.#selected === selected) return

        this.#selected = selected
        this.#graphic!.clear()
        this.#drawExpressionGraphic(this.#graphic!)
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

    

    #createExpressionGraphic(): PIXI.Graphics {
        const graphic = new PIXI.Graphics();
        this.#drawExpressionGraphic(graphic)
        graphic.interactive = true;
        graphic.buttonMode = true;
        return graphic;
    }

    #drawExpressionGraphic(graphic: PIXI.Graphics) {
        try {
            console.log('drawing', this.#base)
            const literal = Literal.fromUrl(this.#base).get()
            console.log("is literal", literal)
            this.#drawExpressionSticky(graphic)
        } catch(e) {
            this.#drawExpressionCircle(graphic)
        }
    }

    #drawExpressionSticky(graphic: PIXI.Graphics) {
        graphic.beginFill(0xffffcc, this.#selected ? 0.5 : 0.2);
        if(this.#selected)
            graphic.lineStyle(OUTLINE_WIDTH_SELECTED, OUTLINE_COLOR_SELCTED);
        else
            graphic.lineStyle(OUTLINE_WIDTH, OUTLINE_COLOR);
        graphic.drawRoundedRect(
            -this.#canvasSize.width/2.2,
            -this.#canvasSize.height/2.2, 
            this.#canvasSize.width*0.9,
            this.#canvasSize.height*0.9, 
            this.#canvasSize.width/10
        );
        graphic.endFill();
    }

    #drawExpressionCircle(graphic: PIXI.Graphics) {
        graphic.beginFill(0xff00ff, this.#selected && (this.#base != "ad4m://self") ? 0.5 : 0.2);
        if(this.#selected)
            graphic.lineStyle(OUTLINE_WIDTH_SELECTED, OUTLINE_COLOR_SELCTED);
        else
            graphic.lineStyle(OUTLINE_WIDTH, OUTLINE_COLOR);
        graphic.drawCircle(0, 0, this.#canvasSize.width / 1.7);
        graphic.endFill();
    }
    
    #createTextNode(str: string) {
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
            fontSize: 126,
            fill: 0x0000ff,
            //@ts-ignores
            align,
            wordWrap: true,
            wordWrapWidth: 180,
        });
        text.anchor.set(0.5, yAnchor);
        return text;
    }
    
    async #createPerspectiveBackground(): Promise<PIXI.Sprite> {
        const backgroundImage = new PIXI.Sprite(await perspectiveBackground);

        // Set the position and scale of the background image to fit inside the circle
        //backgroundImage.anchor.set(0.5);
        backgroundImage.position.set(-this.#graphic!.width/2, -this.#graphic!.height/2);
        backgroundImage.width = this.#graphic!.width;
        backgroundImage.height = this.#graphic!.height;
        backgroundImage.alpha = 0.8;
        backgroundImage.tint = 0x333333;

        return backgroundImage;
    }
}