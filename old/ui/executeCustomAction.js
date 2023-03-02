import { Link } from "@perspect3vism/ad4m";
export async function executeCustomAction(action, baseExpression, perspective) {
    const replaceThis = (input) => {
        if (input)
            return input.replace('this', baseExpression);
        else
            return undefined;
    };
    for (let command of action) {
        switch (command.action) {
            case 'addLink':
                await perspective.add(new Link({
                    source: replaceThis(command.source),
                    predicate: replaceThis(command.predicate),
                    target: replaceThis(command.target)
                }));
                break;
            case 'removeLink':
                await perspective.remove(command.linkExpression);
                break;
        }
    }
}
//# sourceMappingURL=executeCustomAction.js.map