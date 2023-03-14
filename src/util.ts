export const flattenPrologList = (list: any): any[] =>{
    let result = []
    while(list && list["head"]) {
        result.push(list["head"])
        list = list["tail"]
    }
    return result
}
