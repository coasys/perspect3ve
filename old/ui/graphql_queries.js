import { gql } from '@apollo/client'

export const EXPRESSION = gql`
    query expression($url: String!) {
        expression(url: $url) {
            author
            timestamp
            data
            language {
                address
            }
            proof {
                valid
                invalid
            }
        }
    }
`

export const EXPRESSION_RAW = gql`
    query expressionRaw($url: String!) {
        expressionRaw(url: $url)
    }
`

export const OPEN_LINK = gql `
    mutation runtimeOpenLink($url: String!) {
        runtimeOpenLink(url: $url)
    }
`

export const QUIT = gql `
    mutation runtimeQuit {
        quit
    }
`

export const AGENT_STATUS = gql `
    query agentStatus {
        agentStatus {
            isInitialized
            isUnlocked
            did
            didDocument
        }
    }
`

export const AGENT = gql `
    query agent {
        agent {
            agent {
                did
                directMessageLanguage
                perspective
            }
        }
    }
`

export const INITIALIZE_AGENT = gql `
    mutation agentInitialize($did: String, $didDocument: String, $keystore: String, $passphrase: String) {
        agentInitialize(did: $did, didDocument: $didDocument, keystore: $keystore, passphrase: $passphrase) {
            isInitialized
            isUnlocked
            did
            didDocument
        }
    }
`

export const LOCK_AGENT = gql `
    mutation agentLock($passphrase: String!) {
        agentLock(passphrase: $passphrase) {
            isInitialized
            isUnlocked
            did
        }
    }
`

export const UNLOCK_AGENT = gql `
    mutation agentUnlock($passphrase: String!) {
        agentUnlock(passphrase: $passphrase) {
            isInitialized
            isUnlocked
            did
            error
        }
    }
`

export const UPDATE_AGENT_PERSPECTIVE = gql `
    mutation agentUpdatePublicPerspective($perspective: String!) {
        agentUpdatePublicPerspective(perspective: $perspective) {
            did
            directMessageLanguage
            perspective
        }
    }
`

export const LANGUAGES = gql `
    query languages($filter: String = ""){
        languages(filter: $filter) {
            name
            address
        }
    }
`

export const LANGUAGES_WITH_SETTINGS = gql `
    query languagesWithSettings($filter: String = ""){
        languages(filter: $filter) {
            name
            address
            settings
            settingsIcon {
                code
            }
        }
    }
`

export const SET_LANGUAGE_SETTINGS = gql`
    mutation languageWriteSettings($languageAddress: String!, $settings: String!) {
        languageWriteSettings(languageAddress: $languageAddress, settings: $settings)
    }
`

export const PERSPECTIVES = gql`
    query perspectives {
        perspectives {
            uuid
            name
            sharedUrl
        }
    }
`

export const PERSPECTIVE = gql`
    query perspective($uuid: String!) {
        perspective(uuid: $uuid) {
            uuid
            name
            sharedUrl
        }
    }
`

export const ADD_PERSPECTIVE = gql`
    mutation perspectiveAdd($name: String!) {
        perspectiveAdd(name: $name) {
            uuid
            name
            sharedUrl
        }
    }
`

export const UPDATE_PERSPECTIVE = gql`
    mutation perspectiveUpdate($uuid: String!, $name: String!, $linksSharingLanguage: String!) {
        perspectiveUpdate(uuid: $uuid, name: $name, linksSharingLanguage: $linksSharingLanguage) {
            uuid
            name
            sharedUrl
        }
    }
`

export const PUBLISH_PERSPECTIVE = gql`
    mutation neighbourhoodPublishFromPerspective(
        $linkLanguage: String!,
        $meta: String!,
        $perspectiveUUID: String!
    ) {
        neighbourhoodPublishFromPerspective(
            linkLanguage: $linkLanguage,
            meta: $meta,
            perspectiveUUID: $perspectiveUUID
        ) {
            expression
            language {
                name
                address
            }
        }
    }
`

export const INSTALL_SHARED_PERSPECTIVE = gql`
    mutation neighbourhoodJoinFromUrl($url: String!) {
        neighbourhoodJoinFromUrl(url: $url) {
            uuid
            name
            sharedUrl
        }
    }
`

export const REMOVE_PERSPECTIVE = gql`
    mutation perspectiveRemove($uuid: String!) {
        perspectiveRemove(uuid: $uuid)
    }
`

export const PERSPECTIVE_ADDED = gql`
    subscription {
		perspectiveAdded {
			uuid
            name
            sharedUrl
		}
	}  
`

export const PERSPECTIVE_UPDATED = gql`
    subscription {
		perspectiveUpdated {
			uuid
            name
            sharedUrl
		}
	}  
`

export const PERSPECTIVE_REMOVED = gql`
    subscription {
		perspectiveRemoved
	}  
`

export const ALL_LINKS_QUERY = gql`
    query perspectiveQueryLinks($perspectiveUUID: String!) {
        perspectiveQueryLinks(query: { }, uuid: $perspectiveUUID) {
            author
            timestamp
            data {
                source
                predicate
                target
            }
        }
    }
`

export const LINKS_SOURCE_PREDICATE_QUERY = gql`
    query perspectiveQueryLinks($perspectiveUUID: String!, $source: String!, $predicate: String!) {
        perspectiveQueryLinks(query: { source: $source, predicate: $predicate }, uuid: $perspectiveUUID) {
            author
            timestamp
            data {
                source
                predicate
                target
            }
        }
    }
`

export const CHILD_LINKS_QUERY = gql`
    query links($perspectiveUUID: String!, $source: String!) {
        perspectiveQueryLinks(query: { source: $source }, uuid: $perspectiveUUI) {
            author
            timestamp
            data {
                source
                predicate
                target
            }
        }
    }
`

export const LINKS_DATED = gql`
    query links($perspectiveUUID: String!, $fromDate: Date!, $untilDate: Date!) {
        perspectiveQueryLinks(query: { fromDate: $fromDate, untilDate: $untilDate }, uuid: $perspectiveUUID) {
            author
            timestamp
            data {
                source
                predicate
                target
            }
        }
    }
`

export const ADD_LINK = gql`
    mutation perspectiveAddLink($perspectiveUUID: String!, $link: String!){
        perspectiveAddLink(link: $link, uuid: $perspectiveUUID) {
            author
            timestamp
            data {
                source
                predicate
                target
            }
        }
    }
`
