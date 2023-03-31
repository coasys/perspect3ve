import type { PerspectiveProxy } from "@perspect3vism/ad4m";

export async function tryForEachMatch(perspective: PerspectiveProxy, query: string, callback: (result: any) => void) {
    try {
        const results = await perspective.infer(query);
        if(results.length) {
            results.forEach(callback)
        } else {
            callback(results)
        }

    } catch (e) {}
}