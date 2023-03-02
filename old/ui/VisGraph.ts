import { Ad4mClient, LinkExpression, LinkQuery, Literal, PerspectiveProxy } from '@perspect3vism/ad4m'
import { v4 as uuidv4 } from 'uuid'
import type { Edge, Node } from 'vis-network/esnext'

interface Decoration {
  shape: string,
  color: string,
}
export default class VisGraph {
    #perspective: PerspectiveProxy
    nodes: Node[]
    edges: Edge[]
    connectLinkElements: boolean
    hidden: string[]
    decorations: Map<string, Decoration>

    constructor(perspective: PerspectiveProxy) {
        this.#perspective = perspective
        this.connectLinkElements = true
        this.nodes = []
        this.edges = []
        this.hidden = []
        this.decorations = new Map<string, Decoration>()
    }

    toggleLinkElementConnect() {
        this.connectLinkElements = !this.connectLinkElements;
        this.nodes = [];
        this.edges = [];
        this.load();
    }

    async load() {
        this.nodes = []
        this.edges = []
        this.hidden = []
        let hidden = await this.#perspective.infer('hiddenExpression(X)')
        if(hidden)
          this.hidden = hidden.map(h=>{
            try{
              return Literal.fromUrl(h.X).get()
            } catch(e) {
              return h.X
            }
          })

        interface ExpressionDecoration{X: string, Color: string, Shape}
        let classDecorations: ExpressionDecoration[] 
        let instanceDecorations: ExpressionDecoration[]

        try {
          classDecorations = await this.#perspective.infer("class_check(c, X), class_color(c, Color), class_decoration_shape(c, Shape)")
        }catch(e){
          console.debug("While infering classDecorations:", e)
        }

        try {
          instanceDecorations = await this.#perspective.infer("class_check(c,X), instance_color(c, X, Color), instance_decoration_shape(c, X, Shape)")
        }catch(e) {
          console.debug("While infering instanceDecorations:", e)
        }
        
        try{
          for(let d of classDecorations) {
            this.decorations.set(d.X, {
              shape: d.Shape,
              color: d.Color
            })
          }
        } catch(e) {}

        try{
          for(let d of instanceDecorations) {
            this.decorations.set(d.X, {
              shape: d.Shape,
              color: d.Color
            })
          }
        } catch(e) {}
        
        await this.getPerspectiveNodesAndMetaEdges();
    }

    loadPerspectiveNode(perspective) {
        const perspectiveNode = {
          id: perspective.uuid,
          label: perspective.name + "-Perspective",
          widthConstraint: 150,
          shape: 'database'
        };
        this.nodes.push(perspectiveNode);
    }

    loadNeighbourhoodNode(perspective) {
        const neighbourhoodLanguage = perspective.neighbourhood.linkLanguage;
        //Create perspective node
        const perspectiveNode = {
          id: perspective.sharedUrl,
          label: perspective.name + "-Neighbourhood",
          widthConstraint: 150,
          shape: 'database',
          color: "#FF0013"
        };
        //Create language node
        const neighbourhoodLanugageNode = {
          id: neighbourhoodLanguage,
          label: neighbourhoodLanguage,
          widthConstraint: 150
        }
        if (this.nodes.filter(node => node.id === perspective.sharedUrl).length == 0) this.nodes.push(perspectiveNode);
        this.nodes.push(neighbourhoodLanugageNode);
    }

    loadMetaNode(perspective) {
        const metaLinksId = uuidv4();
        const metaLinksNode = {
          id: metaLinksId,
          label: "metaLinks",
          shape: 'database',
          group: "metaLinks",
          widthConstraint: 100
        }
        this.nodes.push(metaLinksNode);
        this.edges.push({
          from: perspective.sharedUrl,
          to: metaLinksNode.id,
          label: "metaLinks"
        })
        return metaLinksNode
    }

    loadLinkLanguageNode(perspective, isNeighbourhood) {
        if (isNeighbourhood) {
          const linkLanguageLinksNode = {
            id: uuidv4(),
            label: "linkLanguageLinks",
            shape: 'database',
            group: "linkLanguageLink",
            widthConstraint: 100
          }
          this.nodes.push(linkLanguageLinksNode);
          this.edges.push({
            from: perspective.sharedUrl,
            to: linkLanguageLinksNode.id,
            label: "linkLanguageLinks"
          })
          this.edges.push({
            from: linkLanguageLinksNode.id,
            to: perspective.neighbourhood.linkLanguage,
            label: "usesLanguage"
          })
          return linkLanguageLinksNode
        } else {
          return undefined
        }
    }

    loadMetaLinks(perspective) {
        const neighbourhoodMetaLinks = perspective.neighbourhood.meta.links;
        const metaLinkNode = this.loadMetaNode(perspective);
        //Add the meta links to the network
        for (const metaLink of neighbourhoodMetaLinks) {
          const link = metaLink.data;
          const sourceId = uuidv4();
          this.nodes.push({
            id: sourceId,
            label: link.source,
            widthConstraint: 150,
            group: "metaLinks"
          })
          this.edges.push({
            from: metaLinkNode.id,
            to: sourceId,
            label: "containsLink"
          })
          //Add a node for target data
          //We always add a node here since we dont want perspectives to share link targets
          const targetId = uuidv4();
          this.nodes.push({
            id: targetId,
            label: link.target,
            widthConstraint: 150,
            group: "metaLinks"
          })
          this.edges.push({
            from: sourceId,
            to: targetId,
            label: link.predicate,
            //@ts-ignore
            link
          })
        }
    }

    loadConnectedMetaLinks(perspective) {
        const neighbourhoodMetaLinks = perspective.neighbourhood.meta.links;
        const metaLinkNode = this.loadMetaNode(perspective);
        //Add the meta links to the network
        for (const metaLink of neighbourhoodMetaLinks) {
          const link = metaLink.data;
          const inferredConnections = neighbourhoodMetaLinks.filter(linkF => linkF.data.target == link.source);
          const sourceNode = {
            id: link.source+perspective.sharedUrl,
            label: link.source,
            widthConstraint: 150,
            group: "metaLinks"
          };
          const targetNode = {
            id: link.target+perspective.sharedUrl,
            label: link.target,
            widthConstraint: 150,
            shape: link.target.startsWith("literal://") ? 'text' : 'ellipse',
            group: "metaLinks"
          };
  
          if (this.nodes.filter(node => node.id == sourceNode.id).length == 0) this.nodes.push(sourceNode)
          if (this.nodes.filter(node => node.id == targetNode.id).length == 0) this.nodes.push(targetNode)
          if (inferredConnections.length == 0) {
            this.edges.push({
              from: metaLinkNode.id,
              to: sourceNode.id,
              label: "containsLink"
            })
          }
          this.edges.push({
            from: sourceNode.id,
            to: targetNode.id,
            label: link.predicate,
            //@ts-ignore
            link
          })
        }
    }

    urlToNode(url: string, allLinks: LinkExpression[]): Node {
      let label
      let shape
      let font

      try{
        label = Literal.fromUrl(url).get()
        if(typeof label == 'object') label = JSON.stringify(label)
        shape = 'text'
        font = '20px arial blue'
      }catch(e){
        label = url
      }

      const customDecoration = this.decorations.get(url)
      let color
      let group
      if(customDecoration) {
        console.debug("custom decoration for", url, customDecoration)
        shape = customDecoration.shape
        color = {background: customDecoration.color}
      } else {
        group = "linkLanguageLink"
      }

      let node = {
        id: url,
        label,
        widthConstraint: 150,
        group,
        shape,
        color,
        font
      } as Node

      try {
        const posLinks = allLinks.filter(l => l.data.source == url && l.data.predicate == 'perspect3ve://2d_position');
        const pos = Literal.fromUrl(posLinks[0].data.target).get()
        //@ts-ignore
        node.x = pos.x
        //@ts-ignore
        node.y = pos.y
      }catch(e) {}
      
      return node
    }

    async loadConnectedLinks(perspective, isNeighbourhood) {
        const linkLanguageLinksNode = this.loadLinkLanguageNode(perspective, isNeighbourhood);
        let links = await perspective.get(new LinkQuery({}))        
        
        let from;
        if (isNeighbourhood) {
          from = linkLanguageLinksNode.id
        } else {
          from = perspective.uuid;
        }
  
        for (const link of links) {
          const linkData = link.data;
          if(linkData.predicate == 'perspect3ve://2d_position') continue
          const inferredConnections = links.filter(linkF => linkF.data.target == linkData.source);
          let sourceNode = this.urlToNode(linkData.source, links)
          //sourceNode.isSource = true
          
          let targetNode;
          if (linkData.target.includes("neighbourhood://")) {
            targetNode = {
              id: linkData.target,
              label: linkData.target,
              widthConstraint: 150,
              group: "linkLanguageLink",
              shape: 'database',
              color: '#FF0013'
            }
          } else {
            targetNode = this.urlToNode(linkData.target, links)
          }

          const sourceNotInYet = this.nodes.filter(node => node.id == sourceNode.id).length == 0
          const targetNotInYet = this.nodes.filter(node => node.id == targetNode.id).length == 0
          const sourceHidden = this.hidden.find(node => node == sourceNode.label)
          const targetHidden = this.hidden.find(node => node == targetNode.label)
          if (sourceNotInYet && !sourceHidden ) this.nodes.push(sourceNode)
          if (targetNotInYet && !targetHidden ) this.nodes.push(targetNode)
          if (inferredConnections.length == 0) {
            this.edges.push({
              from: from,
              to: sourceNode.id,
              label: "containsLink"
            })
          }
          if(!sourceHidden && !targetHidden) {
            this.edges.push({
              from: sourceNode.id,
              to: targetNode.id,
              label: linkData.predicate,
              //@ts-ignore
              link
            })
          }
        }
    }

    async loadLinks(perspective, isNeighbourhood) {
        const linkLanguageLinksNode = this.loadLinkLanguageNode(perspective, isNeighbourhood);
        const links = await perspective.get(new LinkQuery({}));
        
        let from;
        if (isNeighbourhood) {
          from = linkLanguageLinksNode.id
        } else {
          from = perspective.uuid;
        }
  
        for (const link of links) {
          const linkData = link.data;
          const sourceNode = {
            id: uuidv4(),
            label: linkData.source,
            widthConstraint: 150,
            group: "linkLanguageLink",
            isSource: true
          }
          let targetNode;
          if (linkData.target.includes("neighbourhood://")) {
            targetNode = {
              id: linkData.target,
              label: linkData.target,
              widthConstraint: 150,
              group: "linkLanguageLink",
              shape: 'database',
              color: '#FF0013'
            }
          } else {
            targetNode = {
              id: uuidv4(),
              label: linkData.target,
              widthConstraint: 150,
              group: "linkLanguageLink"
            }
          }
          const sourceNotInYet = this.nodes.filter(node => node.id == sourceNode.id).length == 0
          const targetNotInYet = this.nodes.filter(node => node.id == targetNode.id).length == 0
          const sourceHidden = this.hidden.find(node => node == sourceNode.label)
          const targetHidden = this.hidden.find(node => node == targetNode.label)
          if (sourceNotInYet && !sourceHidden ) this.nodes.push(sourceNode)
          if (targetNotInYet && !targetHidden ) this.nodes.push(targetNode)
          this.edges.push({
            from: from,
            to: sourceNode.id,
            label: "containsLink"
          })
          if(!sourceHidden && !targetHidden) {
            this.edges.push({
              from: sourceNode.id,
              to: targetNode.id,
              label: linkData.predicate,
              //@ts-ignore
              link
            })
          }
        }
    }

    async getPerspectiveNodesAndMetaEdges() {
        
        if (this.#perspective.neighbourhood) {
            //Load the neighbourhood data
            //this.loadNeighbourhoodNode(this.#perspective);

            if (this.connectLinkElements) {
                //Load the meta data
                this.loadConnectedMetaLinks(this.#perspective);
                await this.loadConnectedLinks(this.#perspective, true);
            } else {
                //Load the meta data
                this.loadMetaLinks(this.#perspective);
                await this.loadLinks(this.#perspective, true)
            }
        } else {
            //this.loadPerspectiveNode(this.#perspective);
            if (this.connectLinkElements) {
                await this.loadConnectedLinks(this.#perspective, false);
            } else {
                await this.loadLinks(this.#perspective, false)
            }
        }
        this.edges = this.edges.sort(() => Math.random() - 0.5);
        this.nodes = this.nodes.sort(() => Math.random() - 0.5);
  
        //@ts-ignore
        Number.prototype.pad = function(size) {
            var s = String(this);
            while (s.length < (size || 2)) {s = "0" + s;}
            return s;
        }
  
        var padsize = this.nodes.length.toString().length;
  
        this.nodes.forEach ( node => {
  
          //@ts-ignore
          node.key = this.nodes.indexOf(node).pad(padsize);
  
          var edge = this.edges.find(e => e.to == node.id);
          while (edge) {
  
            var parent = this.nodes.find(n => n.id == edge.from);
            if (parent) {
                //@ts-ignore
                node.key = "" + this.nodes.indexOf(parent).pad(padsize) + node.key;
                edge = this.edges.find(e => e.to == parent.id);
            } else {
                edge = undefined
            }
          }
        });  
  
        this.nodes = this.nodes.sort( (a,b) => {
        //@ts-ignore
          if (a.key > b.key) return 1;
          //@ts-ignore
          if (a.key < b.key) return -1;
          return 0;
        });
    }
}

