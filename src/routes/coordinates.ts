export const COORDS_PRED_PREFIX = "p3://child_coords_2d"

function encodeRFC3986URIComponent(str: string): string {
    return encodeURIComponent(str)
        .replace(
            /[!'()*]/g,
            (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
        );
}


export function encodeCoords(x: number, y: number): string {
    const json = JSON.stringify({x, y})
    const uriEncodedJson = encodeRFC3986URIComponent(json)
    return `${COORDS_PRED_PREFIX}${uriEncodedJson}`
}

export function decodeCoords(pred: string): {x: number, y: number} {
    const json = decodeURIComponent(pred.slice(COORDS_PRED_PREFIX.length))
    return JSON.parse(json)
}
