<script lang="ts">
    import { Agent, Link, LinkExpression, parseExprUrl, Perspective, PerspectiveProxy, SmartLiteral, type Ad4mClient } from '@perspect3vism/ad4m';
    import { Literal, LinkQuery } from '@perspect3vism/ad4m';
    import { onMount, createEventDispatcher, afterUpdate, getContext } from 'svelte';
    import AgentCache, { type AgentLoaded } from '../AgentCache';

    export let ad4m: Ad4mClient
    export let perspective: PerspectiveProxy
    export let expression: string

    let container
    let agentCache

    let chatMessages = []
    let chatInput
    let showNumChatMessages = 10

    async function ensureAgentCache() {
        if(!agentCache) agentCache = new AgentCache(ad4m)
    }

    async function getChatMessages() {
        const links = await perspective.get(new LinkQuery({source: expression, predicate: "flux://has_message"}))
        links.sort((a, b) => a.timestamp - b.timestamp)
        links.reverse()
        links.splice(showNumChatMessages)
        links.reverse()
        await ensureAgentCache()
        chatMessages = await Promise.all(links.map(async link => {
            const chatExpression = Literal.fromUrl(link.data.target).get()
            let agent: AgentLoaded = await agentCache.getAgent(chatExpression.author)

            return {
                content: chatExpression.data,
                timestamp: chatExpression.timestamp,
                author: agent.username,
                profile_base64: agent.profile_base64,
                mime_type: agent.profile_mime_type
            }
        }))
    }

    afterUpdate(async () => {
        if(container)
            container.scrollTop = container.scrollHeight
    })

    async function handleSendMessage() {
        const message = chatInput.value
        const messageExpression = await perspective.createExpression(message, 'literal')
        console.log("messageExpression", messageExpression)
        await perspective.add(new Link({source: expression, predicate: "flux://has_message", target: messageExpression}))
        chatInput.value = ""
        await getChatMessages()
    }

    async function loadMoreChatMessages() {
        showNumChatMessages += 10
        await getChatMessages()
    }

    async function update() {
        showNumChatMessages = 10
        await getChatMessages()
    }

    onMount(async () => {
        update()
        perspective.addListener("link-added", (link: LinkExpression) => {
            if(link.data.source == expression && link.data.predicate == "flux://has_message") {
                getChatMessages()
            }
        })
    })

    $: if (perspective && expression) {
        update()
    }
</script>

<div class="chat" bind:this={container}>
    <div class="chat-load-more">
        <j-button variant="link" class="chat-load-more" on:click={loadMoreChatMessages}>Load more...</j-button>
    </div>
    {#each chatMessages as message}
        <div class="chat-message">
            {#if message.profile_base64}
                <j-avatar src={`data:${message.mime_type};base64,${message.profile_base64}`} />
            {:else}
                <j-avatar />
            {/if}
            <div class="chat-message-content">{@html message.content}</div>
            <div class="chat-message-author">{message.author}</div>
        </div>
    {/each}
    <j-input 
        bind:this={chatInput}
        type="text"
        full="true"
        on:keydown={(event) => {
            if(event.key === 'Enter') {
                const content = event.srcElement.value
                if(content.length > 0) {
                    handleSendMessage(content)
                    event.srcElement.value = ''
                }
            }
            event.stopPropagation()
        }}
    />
</div>

<style>
  .chat-message {
	margin: 10px;
  }

  .chat-message-content {
	border: #888888 1px solid;
	border-radius: 5px;
	padding: 10px;
  }

  .chat-avatar {
	width: 40px;
	height: 40px;
	float: left;
	margin: 5px;
  }

  .chat-message-author {
	font-size: 12px;
  }

  .chat-load-more {
	text-align: center;
  }
</style>