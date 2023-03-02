'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __asyncValues = (undefined && undefined.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var _SharedPerspectivePutAdapter_agent, _SharedPerspectivePutAdapter_IPFS, _Adapter_IPFS;
//import { DNA_NICK } from "./dna";
const _appendBuffer = (buffer1, buffer2) => {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};
const uint8ArrayConcat = (chunks) => {
    return chunks.reduce(_appendBuffer);
};
class SharedPerspectivePutAdapter {
    constructor(context) {
        _SharedPerspectivePutAdapter_agent.set(this, void 0);
        //#hcDna: HolochainLanguageDelegate;
        _SharedPerspectivePutAdapter_IPFS.set(this, void 0);
        __classPrivateFieldSet(this, _SharedPerspectivePutAdapter_agent, context.agent, "f");
        //this.#hcDna = context.Holochain as HolochainLanguageDelegate;
        __classPrivateFieldSet(this, _SharedPerspectivePutAdapter_IPFS, context.IPFS, "f");
    }
    async createPublic(neighbourhood) {
        // const expression = this.#agent.createSignedExpression(neighbourhood);
        // let resp = await this.#hcDna.call(
        //   DNA_NICK,
        //   "neighbourhood_store",
        //   "index_neighbourhood",
        //   expression
        // );
        // return resp.toString("hex");
        const agent = __classPrivateFieldGet(this, _SharedPerspectivePutAdapter_agent, "f");
        const expression = agent.createSignedExpression(neighbourhood);
        const content = JSON.stringify(expression);
        const result = await __classPrivateFieldGet(this, _SharedPerspectivePutAdapter_IPFS, "f").add({ content });
        // @ts-ignore
        return result.cid.toString();
    }
}
_SharedPerspectivePutAdapter_agent = new WeakMap(), _SharedPerspectivePutAdapter_IPFS = new WeakMap();
class Adapter {
    constructor(context) {
        //#hcDna: HolochainLanguageDelegate;
        _Adapter_IPFS.set(this, void 0);
        //this.#hcDna = context.Holochain as HolochainLanguageDelegate;
        __classPrivateFieldSet(this, _Adapter_IPFS, context.IPFS, "f");
        this.putAdapter = new SharedPerspectivePutAdapter(context);
    }
    async get(address) {
        var e_1, _a;
        const cid = address.toString();
        const chunks = [];
        try {
            // @ts-ignore
            for (var _b = __asyncValues(__classPrivateFieldGet(this, _Adapter_IPFS, "f").cat(cid)), _c; _c = await _b.next(), !_c.done;) {
                const chunk = _c.value;
                chunks.push(chunk);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const fileString = uint8ArrayConcat(chunks).toString();
        const fileJson = JSON.parse(fileString);
        return fileJson;
        // const hash = Buffer.from(address, "hex");
        // const res = await this.#hcDna.call(
        //   DNA_NICK,
        //   "neighbourhood_store",
        //   "get_neighbourhood",
        //   hash
        // );
        // return res;
    }
}
_Adapter_IPFS = new WeakMap();

//import { DNA, DNA_NICK } from "./dna";
function interactions(expression) {
    return [];
}
class UI {
    icon() {
        return "";
    }
    constructorIcon() {
        return "";
    }
}
const name = "neighbourhood-store";
async function create(context) {
    //const Holochain = context.Holochain as HolochainLanguageDelegate;
    //await Holochain.registerDNAs([{ file: DNA, nick: DNA_NICK }]);
    const expressionAdapter = new Adapter(context);
    //const expressionUI = new UI();
    return {
        name,
        expressionAdapter,
        //expressionUI,
        interactions,
    };
}

exports.UI = UI;
exports.default = create;
exports.name = name;
//# sourceMappingURL=bundle.js.map
