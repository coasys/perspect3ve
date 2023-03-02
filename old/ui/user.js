var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _User_did, _User_privatePUUID, _User_publicPUUID, _User_publicURL, _User_gqlClient, _User_initialized, _User_world;
import { AGENT, PERSPECTIVES, PERSPECTIVE, ADD_PERSPECTIVE, PUBLISH_PERSPECTIVE } from './graphql_queries';
import { logError } from './logUtils';
const PRIVATE_PERSPECTIVE_NAME = '__MY_PRIVATE';
const PUBLIC_PERSPECTIVE_NAME = '__MY_PUBLIC';
async function getPerspective(uuid, gqlClient) {
    const perspectiveResult = logError(await gqlClient.query({
        query: PERSPECTIVE,
        variables: { uuid }
    }));
    const perspective = perspectiveResult.data.perspective;
    return perspective;
}
export default class User {
    constructor(world, gqlClient) {
        _User_did.set(this, void 0);
        _User_privatePUUID.set(this, void 0);
        _User_publicPUUID.set(this, void 0);
        _User_publicURL.set(this, void 0);
        _User_gqlClient.set(this, void 0);
        _User_initialized.set(this, void 0);
        _User_world.set(this, void 0);
        __classPrivateFieldSet(this, _User_world, world, "f");
        __classPrivateFieldSet(this, _User_gqlClient, gqlClient, "f");
        __classPrivateFieldSet(this, _User_initialized, new Promise(async (resolve) => {
            await this.getAgentDid();
            await this.ensurePerspectives();
            await this.ensurePublicPerspectiveShared();
            await this.ensurePublicPerspectiveIndexedInWorld();
            resolve();
        }), "f");
    }
    get privatePerspectiveUUID() {
        return __classPrivateFieldGet(this, _User_privatePUUID, "f");
    }
    get publicPerspectiveUUID() {
        return __classPrivateFieldGet(this, _User_publicPUUID, "f");
    }
    get publicPerspectiveURL() {
        return __classPrivateFieldGet(this, _User_publicURL, "f");
    }
    async getAgentDid() {
        const result = logError(await __classPrivateFieldGet(this, _User_gqlClient, "f").query({ query: AGENT }));
        const agent = result.data.agent.agent;
        __classPrivateFieldSet(this, _User_did, agent.did, "f");
    }
    async ensurePerspectives() {
        const result = logError(await __classPrivateFieldGet(this, _User_gqlClient, "f").query({ query: PERSPECTIVES }));
        const perspectives = result.data.perspectives;
        __classPrivateFieldSet(this, _User_privatePUUID, (await this.ensurePerspective(PRIVATE_PERSPECTIVE_NAME, perspectives)).uuid, "f");
        __classPrivateFieldSet(this, _User_publicPUUID, (await this.ensurePerspective(PUBLIC_PERSPECTIVE_NAME, perspectives)).uuid, "f");
    }
    async ensurePerspective(name, allPerspectives) {
        let found = allPerspectives.find(e => e.name === name);
        if (!found) {
            console.log(name, "not found locally - creating..");
            const add_result = logError(await __classPrivateFieldGet(this, _User_gqlClient, "f").mutate({
                mutation: ADD_PERSPECTIVE,
                variables: { name }
            }));
            found = add_result.data.addPerspective;
        }
        return found;
    }
    async ensurePublicPerspectiveShared() {
        let perspective = await getPerspective(__classPrivateFieldGet(this, _User_publicPUUID, "f"), __classPrivateFieldGet(this, _User_gqlClient, "f"));
        // @ts-ignore
        if (!perspective.sharedPerspective) {
            console.log(PUBLIC_PERSPECTIVE_NAME, "is not shared yet - publishing perspective...");
            logError(await __classPrivateFieldGet(this, _User_gqlClient, "f").mutate({
                mutation: PUBLISH_PERSPECTIVE,
                variables: {
                    uuid: perspective.uuid,
                    name: __classPrivateFieldGet(this, _User_did, "f"),
                    description: `Public Perspective of ${__classPrivateFieldGet(this, _User_did, "f")}`,
                    type: 'holochain',
                    uid: __classPrivateFieldGet(this, _User_did, "f"),
                    requiredExpressionLanguages: [],
                    allowedExpressionLanguages: []
                }
            }));
            console.log(PUBLIC_PERSPECTIVE_NAME, "was just published");
            perspective = await getPerspective(__classPrivateFieldGet(this, _User_publicPUUID, "f"), __classPrivateFieldGet(this, _User_gqlClient, "f"));
        }
        else {
            console.log(PUBLIC_PERSPECTIVE_NAME, "was published before");
        }
        // @ts-ignore
        __classPrivateFieldSet(this, _User_publicURL, perspective.sharedURL, "f");
    }
    async ensurePublicPerspectiveIndexedInWorld() {
        console.log("Checking if my public perspective is indexed...");
        let found = false;
        try {
            const url = await __classPrivateFieldGet(this, _User_world, "f").getAgentPublicPerspective(__classPrivateFieldGet(this, _User_did, "f"));
            if (url == __classPrivateFieldGet(this, _User_publicURL, "f")) {
                found = true;
                console.log("Found my public perspective already indexed in world. Good.");
            }
        }
        catch (e) {
        }
        if (!found) {
            console.log("My public perspective is missing in world. Setting link now..");
            await __classPrivateFieldGet(this, _User_world, "f").setAgentPublicPerspective(__classPrivateFieldGet(this, _User_did, "f"), __classPrivateFieldGet(this, _User_publicURL, "f"));
            console.log("My public perspective was just indexed.");
        }
    }
}
_User_did = new WeakMap(), _User_privatePUUID = new WeakMap(), _User_publicPUUID = new WeakMap(), _User_publicURL = new WeakMap(), _User_gqlClient = new WeakMap(), _User_initialized = new WeakMap(), _User_world = new WeakMap();
//# sourceMappingURL=user.js.map