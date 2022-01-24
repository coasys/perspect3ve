<script lang="ts">
	import { getAllContexts, getContext, onMount } from "svelte";
	import TopAppBar, {Row, Section, Title} from '@smui/top-app-bar';
	import IconButton from '@smui/icon-button';
	import Drawer, {Content, Header, Title as DrawerTitle, Subtitle, Scrim} from '@smui/drawer';
	import { Item, Text, Graphic } from '@smui/list';
	import Dialog, { Title as DialogTitle, Content as DialogContent, Actions } from '@smui/dialog';
	import Button, { Label } from '@smui/button';
	import PerspectiveWrapper from './PerspectiveWrapper.svelte';
	import PerspectiveSnapshotView from './PerspectiveSnapshotView.svelte'
	import LanguagesSettings from './LanguagesSettings.svelte'
	import type { Ad4mClient } from '@perspect3vism/ad4m'
	import Zumly from 'zumly'
	import ZoomRoot from './ZoomRoot.svelte'
	//import { perspectivesStore } from "./PerspectivesStore";

	//const ad4m: Ad4mClient = getContext('ad4mClient')
	const allContexts = getAllContexts()

	let collapsed = false;
	let collapsing = false;
	let drawerOpen = false;
	let languageSettingsDialog

	onMount(async ()=> {
		// Zumly instance
		const zumly = new Zumly({
			mount: '#zoom-container',
			initialView: 'ZoomRoot',
			views: {
				ZoomRoot,
				PerspectiveWrapper,
				PerspectiveSnapshotView,
			},
			componentContext: allContexts,
			// Customize transitions. Object. Optional
			transitions: {
				// Effects for background views. Array. ['blur', 'sepia', 'saturate']
				effects: ['blur'],
				// How new injected view is adapted. String. Default 'width'
				cover: 'height',
				// Transition duration. String. Default '1s'
				duration: '400ms' ,
				// Transition ease. String. Default 'ease-in-out'
				//ease: 'cubic-bezier(0.25,0.1,0.25,1)'
				ease: 'ease-out'
			},
			// Activate debug notifications. Boolean. Default false
			debug: true
		})

		await zumly.init()
		zumly.componentContext.set('zumly', zumly)
	})
	

</script>

<Drawer variant="modal" bind:open={drawerOpen}>
	<Content>
		<Header>
			<DrawerTitle>Settings</DrawerTitle>
			<Subtitle>
				Manage installed Languages and other stuff
			</Subtitle>
		</Header>

		<Item 
			on:click={() => languageSettingsDialog.open()}
		>
			<Graphic class="material-icons" aria-hidden="true">insert_comment</Graphic>
			<Text>Manage Languages</Text>
		</Item>
	</Content>
</Drawer>
<Scrim></Scrim>

<TopAppBar dense='true' variant='static' 
	bind:collapsed
	on:mouseenter="{e => collapsing ? collapsed=false : undefined}"
	on:mouseleave="{e => collapsing ? collapsed=true : undefined}"
>
	<Row>
	<Section>
		<IconButton class="material-icons" on:click={() => {drawerOpen = !drawerOpen}}>menu</IconButton>
		<Title>
			Dashboard
		</Title>
	</Section>
	</Row>
</TopAppBar>

<div id="zoom-container"></div>


<Dialog bind:this={languageSettingsDialog}>
	<DialogTitle>Language Settings</DialogTitle>
	<DialogContent>
		<LanguagesSettings></LanguagesSettings>
	</DialogContent>
	<Actions>
		<Button on:click={languageSettingsDialog.close}>
			<Label>Close</Label>
		</Button>
	</Actions>
</Dialog>

<style>
	main {
		height: 100%;
		text-align: center;
		padding: 0;
		max-width: 240px;
		margin: 0 auto;
	}

	#zoom-container {
		position: absolute;
		left: 0;
		top: 48px;
		right: 0;
		bottom: 0;
		background-image: url(../images/dashboard-background.png);
		background-position: center;
		background-size: cover;
	}

	h1 {
		color: #00c3ff;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.centered {
		margin-top: 100px;
		margin-left: auto;
		margin-right: auto;
		width: 380px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>