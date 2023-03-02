export function linkTo2D(link) {
    const origin = {x: 0, y: 0}
    if(!link.data.predicate)
        return origin
    const pred = link.data.predicate
    if(!pred.startsWith("coord2d://"))
        return origin
    
    const [x,y] = pred.substr(10).split('_').map(s => parseInt(s))
    return {x,y}
}

export function coordToPredicate(coords) {
    return `coord2d://${coords.x}_${coords.y}`
}

export function debounce(fn, delay) {
    let timeout;
    return () => {
        if(timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            fn();
        }, delay);
    }
}