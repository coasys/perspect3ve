import * as PIXI from 'pixi.js';
import '@pixi/math-extras';
import '@pixi/interaction';
import { LinkQuery, type LinkExpression, type PerspectiveProxy, Literal, SmartLiteral } from '@perspect3vism/ad4m';

export const COORDS_PRED_PREFIX = "p3://child_coords_2d"
export const LEVEL_SCALE = 0.16;

const OUTLINE_COLOR = 0x5a5a5a;
const OUTLINE_COLOR_SELCTED = 0xffffff;
const OUTLINE_WIDTH = 5;
const OUTLINE_WIDTH_SELECTED = 8;

let perspectiveBackground = PIXI.Assets.load('public/perspective_background.png')
let blobBackground = PIXI.Assets.load('public/FluxBlob.png')

export class ExpressionWidget {
    #base: string
    #perspective: PerspectiveProxy
    #container: PIXI.Container
    #selected: boolean = false
    #graphic: PIXI.Graphics | null = null
    #graphicMask: PIXI.Graphics | null = null
    #text: PIXI.Text | null = null
    #childrenCoords: Map<string, {x: number, y: number}> = new Map()
    #childrenWidgets: Map<string, ExpressionWidget> = new Map()
    #canvasSize: {width: number, height: number} = {width: 0, height: 0}
    #relativePosition: {x: number, y: number} = {x: 0, y: 0}

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
                        widget = this.addChild(link.data.target, point)
                        widget.addChildrenLeafs()
                        this.#makeChildInteractive(widget)
                    }
                    layer = widget.#container
                    layer.position.set(point.x, point.y)
                }
            }
            return null
        })

        this.#container.on('pointerup', (event) => {
            // filter out events that are not over graphic of this
            if(event.target == this.#graphic) {
                if(!this.#draggingWidget) {
                    this.setSelected(true)
                    this.#childrenWidgets.forEach(child => child.setSelected(false))
                    this.#selectedCallbacks.forEach(callback => callback(this.#base))
                } else {
                    this.#pointerUpHandlers.get(this.#draggingWidget!.base)!(event)
                }   
            }
        })

        this.#container.on('pointermove', (event) => {
            // filter out events that are not over graphic of this
            if(event.target == this.#graphic) {
                if(this.#draggingWidget) {
                    this.#pointerMoveHandlers.get(this.#draggingWidget!.base)!(event)
                }
            }
        })
    }

    get base() {
        return this.#base
    }

    get container() {
        return this.#container
    }

    get relativePosition() {
        return this.#relativePosition
    }

    onSelectionChanged(callback: (expr: string) => void) {
        this.#selectedCallbacks.push(callback)
    }

    onDoubleClick(callback: (widget: ExpressionWidget) => void) {
        this.#doubleClickCallbacks.push(callback)
    }

    clearEventCallbacks() {
        this.#selectedCallbacks = []
        this.#doubleClickCallbacks = []
    }

    addGraphAndText() {
        this.#graphic = this.#createExpressionGraphic()
        this.#container.addChild(this.#graphic)

        this.#graphicMask = this.#graphic.clone()
        this.#graphicMask.scale.set(0.99)
        this.#container.addChild(this.#graphicMask)

        const totalMask = this.#graphic.clone()
        totalMask.scale.set(1.1)
        this.#container.addChild(totalMask)
        this.#container.mask = totalMask

        if(this.#base == "ad4m://self") {
            this.#createPerspectiveBackground().then((sprite) => {
                this.#container.addChild(sprite)
            })
        } else {
            if(this.#base.startsWith("flux://")) {
                this.#createBlobBackground(0x44bb33).then((sprite) => {
                    this.#container.addChild(sprite)
                })
            }

            if(this.#base.startsWith("flux_entry://")) {
                this.#createBlobBackground(0xffffff).then((sprite) => {
                    this.#container.addChild(sprite)
                })
            }
            this.#text = this.#createTextNode(this.#base)
            this.#container.addChild(this.#text)
        }        
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
            const childWidget = this.#childrenWidgets.get(child)!
            if(childWidget)
                childWidget.#relativePosition = this.#childrenCoords.get(child)!
        }
    }

    addChild(child: string, point: {x: number, y: number}): ExpressionWidget {
        const existing = this.#childrenWidgets.get(child)
        if(existing) {
            return existing
        }

        let childLayer = new PIXI.Container();
        childLayer.scale.set(LEVEL_SCALE);
        childLayer.position.set(point.x, point.y);

        const childWidget = new ExpressionWidget(child, this.#perspective, childLayer, this.#canvasSize)
        this.#childrenWidgets.set(child, childWidget)
        childWidget.#relativePosition = point

        this.#container.addChild(childLayer)
        return childWidget
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
            const childWidget = this.addChild(child, point)
            childWidget.addChildrenLeafs()
            this.#makeChildInteractive(childWidget)
        });
    }

    makeAllChildrenInteractive() {
        this.#childrenWidgets.forEach(child => {
            this.#makeChildInteractive(child)
        })
    }

    clearInteractionHandlers() {
        this.#childrenWidgets.forEach(child => {
            child.#container.off('pointerdown', this.#pointerDownHandlers.get(child.#base))
            child.#container.off('pointerup', this.#pointerUpHandlers.get(child.#base))
            child.#container.off('pointermove', this.#pointerMoveHandlers.get(child.#base))
        })

        this.#pointerDownHandlers.clear()
        this.#pointerUpHandlers.clear()
        this.#pointerMoveHandlers.clear()
    }


    #makeChildInteractive(childWidget: ExpressionWidget) {
        const childLayer = childWidget.#container;
        childLayer.interactive = true;
        childLayer.on('pointerdown', this.#childPointerdown(childWidget));
        childLayer.on('pointerup', this.#childPointerup(childWidget));
        childLayer.on('pointermove', this.#childPointermove(childWidget));
    }

    #isDragging = false;
    #isPointerDown = false;
    #draggingWidget: ExpressionWidget | null = null;
    #dragStart = new PIXI.Point();
    #oneClick = false;
    #twoClicks = false;


    #pointerDownHandlers: Map<string, ((event: PIXI.FederatedPointerEvent) => void)> = new Map();
    #pointerUpHandlers: Map<string, ((event: PIXI.FederatedPointerEvent) => void)> = new Map();
    #pointerMoveHandlers: Map<string, ((event: PIXI.FederatedPointerEvent) => void)> = new Map();

    #childPointerdown(childWidget: ExpressionWidget): (event: PIXI.FederatedPointerEvent) => void {
        const that = this;
        const newHandler = (event: PIXI.FederatedPointerEvent) => {
            if (that.#oneClick) {
                that.#twoClicks = true;
                setTimeout(() => {
                    that.#twoClicks = false;
                }, 200);
            }

            that.#isPointerDown = true;
            that.#draggingWidget = childWidget;
            that.#isDragging = false;
            console.log(event.data.global);
            that.#dragStart.copyFrom(event.data.global);

            that.#oneClick = true;
            setTimeout(() => {
                that.#oneClick = false;
            }, 200);
        }
        this.#pointerDownHandlers.set(childWidget.base, newHandler);
        return newHandler;
    }

    #childPointerup(childWidget: ExpressionWidget): (event: PIXI.FederatedPointerEvent) => void {
        const that = this;
        const newHandler = (event: PIXI.FederatedPointerEvent) => {
            if (that.#twoClicks) {
                that.#doubleClickCallbacks.forEach(callback => callback(childWidget))
                //console.log('dblclick -> zooming in');
                //zoomIn(child, this.#container, childLayer, this.#base);
            } else {
                if(that.#isDragging) {
                    this.#updateChildCoords(childWidget.#base, childWidget.container.position)
                    that.#isDragging = false;
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
            that.#isPointerDown = false;
            that.#isDragging = false;
            that.#draggingWidget = null
        }
        this.#pointerUpHandlers.set(childWidget.base, newHandler);
        return newHandler
    }

    #childPointermove(childWidget: ExpressionWidget): (event: PIXI.FederatedPointerEvent) => void {
        const that = this;
        const newHandler = (event: PIXI.FederatedPointerEvent) => {
            if (that.#isPointerDown) {
                that.#isDragging = true;
                const currentPoint = event.data.global;
                childWidget.container.position.x += currentPoint.x - that.#dragStart.x;
                childWidget.container.position.y += currentPoint.y - that.#dragStart.y;
                that.#dragStart.copyFrom(event.data.global);
            }
        }
        this.#pointerMoveHandlers.set(childWidget.base, newHandler);
        return newHandler;
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
            //console.log('drawing', this.#base)
            const literal = Literal.fromUrl(this.#base).get()
            //console.log("is literal", literal)

            //if(await SmartLiteral.isSmartLiteralBase(this.#perspective, literal))
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
    
    #createTextNode(expr: string) {
        let align = 'center';
        let yAnchor = 0.5;

        let textString = expr
        try {
            const parsedLiteralValue = Literal.fromUrl(expr).get()
            if (typeof parsedLiteralValue == 'object'){
                if(parsedLiteralValue.data != undefined) {
                    textString = parsedLiteralValue.data
                } else {
                    textString = JSON.stringify(parsedLiteralValue, null, 2)
                    align = 'left'
                    yAnchor = 1
                }
            } else {
                textString = parsedLiteralValue
            }
        } catch(e) {}

        if(textString.length > 300) {
            textString = textString.substring(0, 300) + '...'
        }
        textString = textString.split("://").join("\n://\n")
        const text = new PIXI.Text(textString, {
            fontSize: 126,
            fill: 0x0000ff,
            //@ts-ignores
            align,
            wordWrap: true,
            wordWrapWidth: 180,
            maxWidth: 80,
            zIndex: 100,
        });
        text.anchor.set(0.5, yAnchor);
        text.maxWidth = 80;
        text.style.wordWrap = true;
        text.style.wordWrapWidth = 200;
        text.style.maxHeight = 100;
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
 
    async #createBlobBackground(tint: number): Promise<PIXI.Sprite> {
        const backgroundImage = new PIXI.Sprite(await blobBackground);

        // Set the position and scale of the background image to fit inside the circle
        //backgroundImage.anchor.set(0.5);
        backgroundImage.position.set(-this.#graphic!.width/2, -this.#graphic!.height/2);
        backgroundImage.width = this.#graphic!.width;
        backgroundImage.height = this.#graphic!.height;
        backgroundImage.alpha = 0.6;
        backgroundImage.tint = tint;
        backgroundImage.zIndex = 7;
        backgroundImage.mask = this.#graphicMask

        return backgroundImage;
    }
}