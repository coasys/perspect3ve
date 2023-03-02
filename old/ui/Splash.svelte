<script lang="ts">
	import { onMount, setContext } from "svelte"
	import { ApolloClient, InMemoryCache } from "@apollo/client";
	import { WebSocketLink } from '@apollo/client/link/ws';
	import InitDialog from "./InitDialog.svelte"
	import CapabilityDialog from "./CapabilityDialog.svelte";
	import { Ad4mClient } from "@perspect3vism/ad4m"

	const { ipcRenderer } = require('electron')
	const { executorUrl, capToken } = ipcRenderer.sendSync('connection-request', '')
	const executorSpawned = ipcRenderer.sendSync('executor-spawned', '')
	const wsLink = new WebSocketLink({
		uri: executorUrl,
		options: {
			reconnect: true,
			connectionParams: async () => {
				return {
					headers: {
						authorization: capToken
					}
				}
			}
		},
	});

	const client = new ApolloClient({
		//uri: 'http://localhost:4000',
		link: wsLink,
		cache: new InMemoryCache({ resultCaching: false, addTypename: false }),
		defaultOptions: {
			watchQuery: {
				fetchPolicy: "no-cache",
			},
			query: {
				fetchPolicy: "no-cache"
			}
		},
  	});
	setContext('ad4mClient', new Ad4mClient(client))

	function resolve(executorUrl, capToken, ad4mClient) {
        ipcRenderer.sendSync('valid-jwt', capToken)
    }

	let capDialog

	onMount(()=> {
		capDialog.resolve = resolve
		capDialog.run()
	})
</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto+Mono">
</svelte:head>

<main>
	{#if executorSpawned}
		<InitDialog></InitDialog>
	{:else}
		<CapabilityDialog 
			bind:this={capDialog}
			appName="Perspect3ve"
			appIconPath="Perspect3veLogo.png"
			executorUrl={executorUrl} 
			capToken={capToken}
			showQrScanner=true
			qrScanRequest={()=>"wurst"}
		></CapabilityDialog>
	{/if}
</main>

