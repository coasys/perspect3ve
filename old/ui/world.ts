import { PERSPECTIVES, PERSPECTIVE, ADD_PERSPECTIVE, PUBLISH_PERSPECTIVE, ADD_LINK, LINKS_DATED, LINKS_SOURCE_PREDICATE_QUERY, INSTALL_SHARED_PERSPECTIVE } from './graphql_queries'
import subMinutes from 'date-fns/subMinutes'
import type { ApolloClient } from '@apollo/client';
import { logError } from './logUtils'

const WORLD_PERSPECTIVE_FIXTURE_URL = 'perspective://__world'
const WORLD_PERSPECTIVE_NAME = '__WORLD'

export default class World {
    #perspectiveUUID: string
    #gqlClient: ApolloClient<any>
    #initialized: Promise<void>

    constructor(gqlClient: ApolloClient<any>) {
        this.#gqlClient = gqlClient
        this.#initialized = new Promise(resolve => {
            //this.ensureGlobalAppPerspective().then(() => resolve())
        })
    }

    async createGlobalAppPerspective() {
        console.log("'__WORLD' not found locally - creating..")
        const add_result = logError(await this.#gqlClient.mutate({
            mutation: ADD_PERSPECTIVE,
            variables: { name: WORLD_PERSPECTIVE_NAME }
        }))

        this.#perspectiveUUID = add_result.data.addPerspective
    
        console.log("'__WORLD' UUID is:", this.#perspectiveUUID)
    
        const perspectiveResult = logError(await this.#gqlClient.query({
            query: PERSPECTIVE,
            variables: { uuid: this.#perspectiveUUID }
        }))
        const perspective = perspectiveResult.data.perspective
    
        console.log("__WORLD:", perspective)
    
    
        if(!perspective.sharedPerspective) {
            console.log("'__WORLD' is not shared yet - publishing perspective...")
            logError(await this.#gqlClient.mutate({
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
            }))
    
            console.log("'__WORLD' was just published")
        } else {
            console.log("'__WORLD' was published before")
        }
    }

    async installGlobalAppPerspectiveFromFixtures() {
        console.log("Installing global app perspective from fixture:" + WORLD_PERSPECTIVE_FIXTURE_URL)
        const result = logError(await this.#gqlClient.mutate({
            mutation: INSTALL_SHARED_PERSPECTIVE,
            variables: {
                url: WORLD_PERSPECTIVE_FIXTURE_URL,
            }
        }))

        if(!result?.data?.installSharedPerspective?.uuid) {
            throw `COULD NOT INSTALL WORLD PERSPECTIVE FIXTURE!\nGot result: ${JSON.stringify(result)}`
        }

        console.log("Global app perspective successfully installed from fixture.")
        this.#perspectiveUUID = result.data.installSharedPerspective.uuid
    }

    async ensureGlobalAppPerspective() {
        console.log("Ensure global shared app perspective '__WORLD'")
        const result = await this.#gqlClient.query({query: PERSPECTIVES})
        if(!result.data) {
            console.error(result)
        }
        const perspectives = result.data.perspectives
    
        let found = perspectives.find( e => e.name === WORLD_PERSPECTIVE_NAME)
        if(!found) await this.installGlobalAppPerspectiveFromFixtures()
        else this.#perspectiveUUID = found.uuid
    }

    async getOnlinePeers() {
        await this.#initialized

        const untilDate = Date.now()
        const fromDate = subMinutes(untilDate, 2)
        const variables = {
            perspectiveUUID: this.#perspectiveUUID,
            fromDate,
            untilDate,
        }
    
        console.log("PeersView getting online peers with LINKS_DATED query with variables:", variables)
        const result = logError(await this.#gqlClient.query({ 
            query: LINKS_DATED,
            variables
        }))
    
        const authorsOfLinks = result.data.links.map(l => l.author.did)
        const uniqueAuthors = [... new Set(authorsOfLinks)]
        return uniqueAuthors
    }
    
    async publishOnlineStatus() {
        await this.#initialized
        
        console.log("PeersView publishing online status...")
        const newLink = {
            source: 'status',
            target: 'online',
        }
        logError(await this.#gqlClient.mutate({
            mutation: ADD_LINK,
            variables: {
                perspectiveUUID: this.#perspectiveUUID,
                link: JSON.stringify(newLink)
            }
        }))
    }

    async getAgentPublicPerspective(did: string): Promise<string> {
        await this.#initialized

        const variables = {
            perspectiveUUID: this.#perspectiveUUID,
            source: did,
            predicate: 'public_perspective'
        }
    
        const result = logError(await this.#gqlClient.query({ 
            query: LINKS_SOURCE_PREDICATE_QUERY,
            variables
        }))

        if(result.data.links.length < 1) {
            throw `No public perspective found for ${did}`
        }

        return result.data.links[0].data.target
    }

    async setAgentPublicPerspective(did: string, url: string) {
        await this.#initialized

        const variables = {
            perspectiveUUID: this.#perspectiveUUID,
            link: JSON.stringify({
                source: did,
                predicate: 'public_perspective',
                target: url
            })
        }
    
        logError(await this.#gqlClient.mutate({ 
            mutation: ADD_LINK,
            variables
        }))
    }
    
}

