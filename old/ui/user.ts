import type { ApolloClient } from '@apollo/client';
import { AGENT, PERSPECTIVES, PERSPECTIVE, ADD_PERSPECTIVE, PUBLISH_PERSPECTIVE, ADD_LINK, LINKS_DATED } from './graphql_queries'
import type { PerspectiveHandle }  from '@perspect3vism/ad4m'
import { logError } from './logUtils'
import type World from './world';

const PRIVATE_PERSPECTIVE_NAME = '__MY_PRIVATE'
const PUBLIC_PERSPECTIVE_NAME = '__MY_PUBLIC'

async function getPerspective(uuid: string, gqlClient: ApolloClient<any>): Promise<PerspectiveHandle> {
    const perspectiveResult = logError(await gqlClient.query({
        query: PERSPECTIVE,
        variables: { uuid }
    }))
    const perspective = perspectiveResult.data.perspective
    return perspective
}

export default class User {
    #did: string
    #privatePUUID: string
    #publicPUUID: string
    #publicURL: string
    #gqlClient: ApolloClient<any>
    #initialized: Promise<void>
    #world: World

    constructor(world: World, gqlClient: ApolloClient<any>) {
        this.#world = world
        this.#gqlClient = gqlClient
        this.#initialized = new Promise(async resolve => {
            await this.getAgentDid()
            await this.ensurePerspectives()
            await this.ensurePublicPerspectiveShared()
            await this.ensurePublicPerspectiveIndexedInWorld()
            resolve()
        })
    }

    get privatePerspectiveUUID(): string {
        return this.#privatePUUID
    }

    get publicPerspectiveUUID(): string {
        return this.#publicPUUID
    }

    get publicPerspectiveURL(): string {
        return this.#publicURL
    }

    async getAgentDid() {
        const result = logError(await this.#gqlClient.query({query: AGENT}))
        const agent = result.data.agent.agent
        this.#did = agent.did
    }
    
    async ensurePerspectives() {
        const result = logError(await this.#gqlClient.query({query: PERSPECTIVES}))
        const perspectives = result.data.perspectives

        this.#privatePUUID = (await this.ensurePerspective(PRIVATE_PERSPECTIVE_NAME, perspectives)).uuid
        this.#publicPUUID = (await this.ensurePerspective(PUBLIC_PERSPECTIVE_NAME, perspectives)).uuid
    }

    async ensurePerspective(name: string, allPerspectives: PerspectiveHandle[]) {
        let found = allPerspectives.find( e => e.name === name)
    
        if(!found) {
            console.log(name, "not found locally - creating..")
            const add_result = logError(await this.#gqlClient.mutate({
                mutation: ADD_PERSPECTIVE,
                variables: { name }
            }))
    
            found = add_result.data.addPerspective
        }

        return found
    }

    async ensurePublicPerspectiveShared() {
        let perspective = await getPerspective(this.#publicPUUID, this.#gqlClient)
        
        // @ts-ignore
        if(!perspective.sharedPerspective) {
            console.log(PUBLIC_PERSPECTIVE_NAME, "is not shared yet - publishing perspective...")
            logError(await this.#gqlClient.mutate({
                mutation: PUBLISH_PERSPECTIVE,
                variables: {
                    uuid: perspective.uuid,
                    name: this.#did,
                    description: `Public Perspective of ${this.#did}`,
                    type: 'holochain',
                    uid: this.#did,
                    requiredExpressionLanguages: [],
                    allowedExpressionLanguages: []
                }
            }))
    
            console.log(PUBLIC_PERSPECTIVE_NAME, "was just published")

            perspective = await getPerspective(this.#publicPUUID, this.#gqlClient)
        } else {
            console.log(PUBLIC_PERSPECTIVE_NAME, "was published before")
        }

        // @ts-ignore
        this.#publicURL = perspective.sharedURL
    }

    async ensurePublicPerspectiveIndexedInWorld() {
        console.log("Checking if my public perspective is indexed...")
        let found = false
        try {
            const url = await this.#world.getAgentPublicPerspective(this.#did)
            if(url == this.#publicURL) {
                found = true
                console.log("Found my public perspective already indexed in world. Good.")
            }

        } catch(e) {

        }

        if(!found) {
            console.log("My public perspective is missing in world. Setting link now..")
            await this.#world.setAgentPublicPerspective(this.#did, this.#publicURL)
            console.log("My public perspective was just indexed.")
        }
    }

}