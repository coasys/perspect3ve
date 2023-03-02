<script lang="ts">
    import { getContext } from "svelte"
    import { query, mutation, getClient } from "svelte-apollo";
    import { EXPRESSION, PERSPECTIVES, PERSPECTIVE, ADD_PERSPECTIVE, PUBLISH_PERSPECTIVE, ADD_LINK, LINKS_DATED } from './graphql_queries'
    import subMinutes from 'date-fns/subMinutes'
    import type { Agent } from '@perspect3vism/ad4m';
    import emailValidator from 'email-validator'
    import md5 from 'md5'
    import { logError } from './logUtils'
    import Button, {Group, Label} from '@smui/button';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    const world = getContext('world')
    const gqlClient = getClient()

    let onlinePeers = []
    let peerProperties = {}

    async function getAgentProfile(did: string): Promise<Agent> {
        const result = logError(await gqlClient.query({
            query: EXPRESSION,
            variables: { url: did }
        }))
        console.log("getAgentProfile:", result)
        const expression = result.data.expression
        const agent = JSON.parse(expression.data)
        return agent as Agent
    }

    async function updatePeersList() {
        onlinePeers = await world.getOnlinePeers()
    }

    async function publishStatus() {
        await world.publishOnlineStatus()
    }

    async function init() {
        await publishStatus()
        await updatePeersList()
        setInterval(updatePeersList, 5000)
        setInterval(publishStatus, 60000)
    }

    $: if(onlinePeers) {
        onlinePeers.forEach(async peer => {
            if(!peerProperties[peer]) {
                peerProperties[peer] = {
                    profile: await getAgentProfile(peer),
                    publicPerspective: await world.getAgentPublicPerspective(peer)
                }
            }
        })
    }

    function requestOpenPerspective(perspectiveURL: string) {
        dispatch('request-open-perspective', {perspectiveURL})
    }

    init()
</script>


<h1>Online peers:</h1>
<ul>
    {#each onlinePeers as peer}
        <li>
            {#if peerProperties[peer]}
                {#if emailValidator.validate(peerProperties[peer].profile?.email) }
                    <img class="avatar" src="http://www.gravatar.com/avatar/{md5(peerProperties[peer].profile?.email)}?s=75" alt="gravatar">
                {/if}
                {peerProperties[peer].profile.name}
                <Button 
                    variant="unelevated" 
                    color="primary" 
                    on:click={()=>{
                        requestOpenPerspective(peerProperties[peer].publicPerspective)
                    }}
                >
                    Visit
                </Button>
            {:else} 
                {peer}
            {/if}
        </li>
    {/each}
</ul>
