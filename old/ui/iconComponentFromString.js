export default function iconComponentFromString(src, filename) {
    const Module = module.constructor;
    const m = new Module();
    m._compile(src, filename);
    return m.exports;
}