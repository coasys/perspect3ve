<script lang="ts">
    import { onMount } from "svelte";
    import Dialog, {Title, Content, Actions} from '@smui/dialog';
	import Button, {Label} from '@smui/button';
	import Textfield, {Input} from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text/index';
	import FloatingLabel from '@smui/floating-label';
    import LineRipple from '@smui/line-ripple';
    import { Ad4mClient } from "@perspect3vism/ad4m";
    import { ApolloClient, InMemoryCache } from "@apollo/client";
    import { WebSocketLink } from "@apollo/client/link/ws";
    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
    
    export let executorUrl: string
    export let capToken: string
    export let appName: string
    export let appIconPath: string
    export let showQrScanner: string|void
    export let resolve: (executorUrl: string, capToken: string, client: Ad4mClient)=>void
    export let qrScanRequest: ()=>string

    let dialog
    let requestId
    let code
    let validCode = true
    let corruptedJwt = false

    function generateCient(uri:string, authorization: string|void) {
        const wsLink = new WebSocketLink({
            uri,
            options: {
                reconnect: true,
                connectionParams: async () => {
                    return { headers: { authorization }}
                }
            },
            webSocketImpl: WebSocket,
        });
        let apolloClient = new ApolloClient({
            link: wsLink,
            cache: new InMemoryCache({ resultCaching: false, addTypename: false }),
            defaultOptions: {
                watchQuery: {
                    fetchPolicy: "no-cache",
                },
                query: {
                    fetchPolicy: "no-cache",
                }
            },
        })
        return new Ad4mClient(apolloClient)
    }

    export async function run() {
        if(executorUrl && capToken) {
            try {
                const ad4m = generateCient(executorUrl, capToken)
                await ad4m.agent.status()
                resolve(executorUrl, capToken, ad4m)
            }
            catch(e) {
                // jwt invalid, inform user
                corruptedJwt = true
                dialog.open()
            }
        }
        else {
            dialog.open()
        }
    }


    async function requestCapability() {
        try {
            let capabilities = [{"with":{"domain":"*","pointers":["*"]},"can":["*"]}]
            let ad4mClientWithoutJwt = generateCient(executorUrl, '')
            requestId = await ad4mClientWithoutJwt.agent.requestCapability("perspect3ve", "general purpose ad4m browser", "https://github.com/perspect3vism/perspect3ve", JSON.stringify(capabilities));
            console.log("auth request id: ", requestId);
        } catch (err) {
            console.log(err);
        }
    }
    async function generateJwt() {
        try {
            let ad4mClientWithoutJwt = generateCient(executorUrl, '')
            let jwt = await ad4mClientWithoutJwt.agent.generateJwt(requestId, code);
            console.log("auth jwt: ", jwt);
            await checkJwt(jwt)
        } catch (err) {
            console.log(err);
            validCode = false
        }
    }

    async function checkJwt(jwt) {
        let ad4mClientJwt = generateCient(executorUrl, jwt)
        try {
            let status = await ad4mClientJwt.agent.status()
            console.log('agent status:', status)
            dispatch('valid-jwt')
            setTimeout(() => {}, 100)
            resolve(executorUrl, jwt, ad4mClientJwt)
        }
        catch (e) {
            console.log(e)
        }
    } 
</script>

<Dialog
    bind:this={dialog}
    aria-labelledby="dialog-title"
    aria-describedby="dialog-content"
    scrimClickAction=""
    escapeKeyAction=""
>
    <Title id="dialog-title">
        <img class="title-logo" src="Ad4mLogo.png" alt="Logo"> AD4M Connection Wizard
    </Title>
    <Content id="dialog-content">
        {#if !requestId}
            <span class="app-name">{appName}</span> needs to connect to your AD4M node/executor and request a unique capability token.
            {#if appIconPath}
                <div class="icons-connection">
                    <img src="{appIconPath}" alt="App Logo" style="width: 150px">
                    <span class="material-icons link-icon">link</span>
                    <img src="Ad4mLogo.png" alt="Logo" style="width: 150px">
                </div>
            {/if}

            Please enter or correct the AD4M executor URL:
            
            <Textfield fullwidth invalid={!validCode} lineRipple={false} label="AD4M executor URL:">
                <Input bind:value={executorUrl} id="executor-url" />
                <LineRipple />
            </Textfield>

            {#if showQrScanner}
                <br>
                Or click here to scan your executor's QR code:
                <Button on:click={()=>{executorUrl = qrScanRequest()}}>
                    <span class="material-icons">qr_code</span>
                </Button>
            {/if}

            <p></p>

            <Button variant="raised" on:click={requestCapability}>
                <Label>Send Capability Request</Label>
            </Button>
        {/if}

        {#if requestId}
            Capability request was successfully sent.
            Please check your AD4M admin UI (AD4Min), 
            confirm the request there and 
            <span class="app-name">
                enter the 6-digit security code below, that AD4Min displays to you.
            </span>
            <Textfield fullwidth invalid={!validCode} lineRipple={false} label="Security Code">
                <Input bind:value={code} id="jwt-generation-code" />
                <FloatingLabel for="jwt-generation-code">{validCode ? "Security Code" : "Invalid Code"}</FloatingLabel>
                <LineRipple />
            </Textfield>
            <HelperText id="unlock-helper-text">Please enter the code from ad4min</HelperText>
            <p>
                <Button variant="raised" on:click={()=>requestId=undefined}>
                    <Label>Back</Label>
                </Button>
                <Button variant="raised" on:click={generateJwt}>
                    <Label>Submit</Label>
                </Button>
            </p>
        {/if}
    </Content>
</Dialog>


<style>

  h2 {
    text-align: center;
    font-size: 24px;
  }

  .dialog-title {
    text-align: center;
    line-height: 42px;
  }

  .title-logo {
    height: 42px;
    margin-bottom: -12px;
  } 

  .app-name {
    font-weight: bold;
  } 

  .icons-connection {
    text-align: center;
  } 

  .link-icon {
    position: relative;
    top: -50px;
  } 
  .capability-request {
    background-color: white;
  }
</style>