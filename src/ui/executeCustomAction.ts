import { Link, LinkExpression, PerspectiveProxy } from "@perspect3vism/ad4m";

export interface LinkActionStep {
    action: string,
    source?: string,
    predicate?: string,
    target?: string,
    linkExpression?: LinkExpression
}

export type Action = LinkActionStep[]

export async function executeCustomAction(action: Action, baseExpression: string, perspective: PerspectiveProxy) {
    const replaceThis = (input: string|undefined) => {
        if(input)
            return input.replace('this', baseExpression)
        else
            return undefined
    }

    for(let command of action) {
        switch(command.action) {
            case 'addLink':
                await perspective.add(new Link({
                    source: replaceThis(command.source),
                    predicate: replaceThis(command.predicate),
                    target: replaceThis(command.target)
                }))
                break;
            case 'removeLink':
                await perspective.remove(command.linkExpression)
                break;
        }
    }
}
