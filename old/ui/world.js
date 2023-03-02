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
var _World_perspectiveUUID, _World_gqlClient, _World_initialized;
import { PERSPECTIVES, PERSPECTIVE, ADD_PERSPECTIVE, PUBLISH_PERSPECTIVE, ADD_LINK, LINKS_DATED, LINKS_SOURCE_PREDICATE_QUERY, INSTALL_SHARED_PERSPECTIVE } from './graphql_queries';
import subMinutes from 'date-fns/subMinutes';
import { logError } from './logUtils';
const WORLD_PERSPECTIVE_FIXTURE_URL = 'perspective://__world';
const WORLD_PERSPECTIVE_NAME = '__WORLD';
export default class World {
    constructor(gqlClient) {
        _World_perspectiveUUID.set(this, void 0);
        _World_gqlClient.set(this, void 0);
        _World_initialized.set(this, void 0);
        __classPrivateFieldSet(this, _World_gqlClient, gqlClient, "f");
        __classPrivateFieldSet(this, _World_initialized, new Promise(resolve => {
            //this.ensureGlobalAppPerspective().then(() => resolve())
        }), "f");
    }
    async createGlobalAppPerspective() {
        console.log("'__WORLD' not found locally - creating..");
        const add_result = logError(await __classPrivateFieldGet(this, _World_gqlClient, "f").mutate({
            mutation: ADD_PERSPECTIVE,
            variables: { name: WORLD_PERSPECTIVE_NAME }
        }));
        __classPrivateFieldSet(this, _World_perspectiveUUID, add_result.data.addPerspective, "f");
        console.log("'__WORLD' UUID is:", __classPrivateFieldGet(this, _World_perspectiveUUID, "f"));
        const perspectiveResult = logError(await __classPrivateFieldGet(this, _World_gqlClient, "f").query({
            query: PERSPECTIVE,
            variables: { uuid: __classPrivateFieldGet(this, _World_perspectiveUUID, "f") }
        }));
        const perspective = perspectiveResult.data.perspective;
        console.log("__WORLD:", perspective);
        if (!perspective.sharedPerspective) {
            console.log("'__WORLD' is not shared yet - publishing perspective...");
            logError(await __classPrivateFieldGet(this, _World_gqlClient, "f").mutate({
                mutation: PUBLISH_PERSPECTIVE,
                variables: {
                    uuid: perspective.uuid,
                    name: perspective.name,
                    description: "All Peers",
                    type: 'holochain',
                    uid: 'Perspect3ve__WORLD',
                    requiredExpressionLanguages: [],
                    allowedExpressionLanguages: []
                }
            }));
            console.log("'__WORLD' was just published");
        }
        else {
            console.log("'__WORLD' was published before");
        }
    }
    async installGlobalAppPerspectiveFromFixtures() {
        var _a, _b;
        console.log("Installing global app perspective from fixture:" + WORLD_PERSPECTIVE_FIXTURE_URL);
        const result = logError(await __classPrivateFieldGet(this, _World_gqlClient, "f").mutate({
            mutation: INSTALL_SHARED_PERSPECTIVE,
            variables: {
                url: WORLD_PERSPECTIVE_FIXTURE_URL,
            }
        }));
        if (!((_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.installSharedPerspective) === null || _b === void 0 ? void 0 : _b.uuid)) {
            throw `COULD NOT INSTALL WORLD PERSPECTIVE FIXTURE!\nGot result: ${JSON.stringify(result)}`;
        }
        console.log("Global app perspective successfully installed from fixture.");
        __classPrivateFieldSet(this, _World_perspectiveUUID, result.data.installSharedPerspective.uuid, "f");
    }
    async ensureGlobalAppPerspective() {
        console.log("Ensure global shared app perspective '__WORLD'");
        const result = await __classPrivateFieldGet(this, _World_gqlClient, "f").query({ query: PERSPECTIVES });
        if (!result.data) {
            console.error(result);
        }
        const perspectives = result.data.perspectives;
        let found = perspectives.find(e => e.name === WORLD_PERSPECTIVE_NAME);
        if (!found)
            await this.installGlobalAppPerspectiveFromFixtures();
        else
            __classPrivateFieldSet(this, _World_perspectiveUUID, found.uuid, "f");
    }
    async getOnlinePeers() {
        await __classPrivateFieldGet(this, _World_initialized, "f");
        const untilDate = Date.now();
        const fromDate = subMinutes(untilDate, 2);
        const variables = {
            perspectiveUUID: __classPrivateFieldGet(this, _World_perspectiveUUID, "f"),
            fromDate,
            untilDate,
        };
        console.log("PeersView getting online peers with LINKS_DATED query with variables:", variables);
        const result = logError(await __classPrivateFieldGet(this, _World_gqlClient, "f").query({
            query: LINKS_DATED,
            variables
        }));
        const authorsOfLinks = result.data.links.map(l => l.author.did);
        const uniqueAuthors = [...new Set(authorsOfLinks)];
        return uniqueAuthors;
    }
    async publishOnlineStatus() {
        await __classPrivateFieldGet(this, _World_initialized, "f");
        console.log("PeersView publishing online status...");
        const newLink = {
            source: 'status',
            target: 'online',
        };
        logError(await __classPrivateFieldGet(this, _World_gqlClient, "f").mutate({
            mutation: ADD_LINK,
            variables: {
                perspectiveUUID: __classPrivateFieldGet(this, _World_perspectiveUUID, "f"),
                link: JSON.stringify(newLink)
            }
        }));
    }
    async getAgentPublicPerspective(did) {
        await __classPrivateFieldGet(this, _World_initialized, "f");
        const variables = {
            perspectiveUUID: __classPrivateFieldGet(this, _World_perspectiveUUID, "f"),
            source: did,
            predicate: 'public_perspective'
        };
        const result = logError(await __classPrivateFieldGet(this, _World_gqlClient, "f").query({
            query: LINKS_SOURCE_PREDICATE_QUERY,
            variables
        }));
        if (result.data.links.length < 1) {
            throw `No public perspective found for ${did}`;
        }
        return result.data.links[0].data.target;
    }
    async setAgentPublicPerspective(did, url) {
        await __classPrivateFieldGet(this, _World_initialized, "f");
        const variables = {
            perspectiveUUID: __classPrivateFieldGet(this, _World_perspectiveUUID, "f"),
            link: JSON.stringify({
                source: did,
                predicate: 'public_perspective',
                target: url
            })
        };
        logError(await __classPrivateFieldGet(this, _World_gqlClient, "f").mutate({
            mutation: ADD_LINK,
            variables
        }));
    }
}
_World_perspectiveUUID = new WeakMap(), _World_gqlClient = new WeakMap(), _World_initialized = new WeakMap();
//# sourceMappingURL=world.js.map