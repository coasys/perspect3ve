<script lang="ts">
  import '@junto-foundation/junto-elements';
  import '@junto-foundation/junto-elements/dist/main.css';
  import './cyberpunk.css';
  import Ad4mConnectUI from '@perspect3vism/ad4m-connect';
  import Nav from './Nav.svelte';
  import MainView from './MainView.svelte';
  import { onMount, setContext } from 'svelte';
  import type { Ad4mClient, PerspectiveProxy } from '@perspect3vism/ad4m';
  import NeighbourhoodSharing from './NeighbourhoodSharing.svelte';

  let selectedPerspective = null;
  let selectedExpression = "ad4m://self";

  let ad4m: Ad4mClient

  async function setPerspective(event) {
    console.log('handleSelect', event.detail);
    selectedPerspective = event.detail;

    console.log("selectedPerspective", selectedPerspective)
    if(selectedPerspective) {
      perspective = await ad4m.perspective.byUUID(selectedPerspective)
      console.log("perspective", perspective)
      if(!perspective) {
        console.error("Perspective not found: ", selectedPerspective)
        return
      }
      if(perspective.sharedUrl) {
        perspectiveAddress = perspective.sharedUrl
      } else {
        if(perspective.name) {
          perspectiveAddress = perspective.name
        } else {
          perspectiveAddress = perspective.uuid
        }
      }
      
    }

  }

  function setExpression(event) {
    console.log('handleSelect', event.detail);
    selectedExpression = event.detail;
  }

  function perspectiveDeleted(event) {
    console.log('perspectiveDeleted', event.detail);
    if(event.detail === selectedPerspective) {
      selectedPerspective = null;
    }
  }

  let connected = false;

  const ui = Ad4mConnectUI({
    appName: 'Perspect3ve',
    appDesc: 'Browser for AD4M Perspectives',
    appDomain: 'dev.ad4m.perspect3ve',
    appUrl: 'https://perspect3ve.app',

    appIconPath: 'https://perspect3ve.app/Perspect3veLogo.png',
    capabilities: [
      {
        with: { domain: '*', pointers: ['*'] },
        can: ['*']
      }
    ]
  });

  onMount(async () => {
    ui.connect();
    ad4m = await ui.getAd4mClient()
  });

  ui.addEventListener('authstatechange', async (e) => {
    console.log('authstatechange', e);
    if (e.detail === 'authenticated') {
      connected = true;
    }
  });

  let settingsDialog
  let openaiKey
  let openaiKeyInput

  let addressInput
  let perspectiveAddress
  let perspective: PerspectiveProxy|null

  let sharingDialog
  let neighbourhoodJoinDialog
  let joinNeighbourhoodExpression
  let joinNeighbourhoodAddress

  onMount(async () => {
    openaiKey = localStorage.getItem('openaiKey')
  });

  async function lookupAddress() {
    const perspectiveAddress = addressInput.value
    const allPerspectives = await ad4m.perspective.all()
    const perspective = allPerspectives.find(p => {
      return p.name === perspectiveAddress ||
        p.sharedUrl === perspectiveAddress ||
        p.uuid === perspectiveAddress
    })

    if(!perspective && perspectiveAddress.startsWith("neighbourhood://")) {
      console.log("Try NH", perspectiveAddress)
      ad4m = await ui.getAd4mClient()
      const nh = await ad4m.expression.get(perspectiveAddress)
      console.log(nh)
      if(nh) {
        joinNeighbourhoodExpression = nh
        joinNeighbourhoodExpression.data = JSON.parse(joinNeighbourhoodExpression.data)
        joinNeighbourhoodAddress = perspectiveAddress
        neighbourhoodJoinDialog.open = true
      }
    } else {
      if(perspective) {
        selectedPerspective = perspective.uuid
        setPerspective({detail: perspective.uuid})
      } else {
        alert("Perspective not found")
      }
    }

    
  }

  async function joinNeighbourhood() {

  }


</script>

<div class="header-bar">
  <img class="title-logo" src="/perspect3ve-logo-header.png" alt="Perspect3ve" />
  <div class="address-bar">
    <j-flex>
      <j-button variant="link" disabled>
        <j-icon name="chevron-left"/>
      </j-button>
      <j-button variant="link" disabled>
        <j-icon name="chevron-right"/>
      </j-button>
      
      <j-button variant="link" disabled>
        <j-icon name="arrow-up-circle"/>
      </j-button>
      
      <j-input 
        class="address-input" 
        type="text" 
        value={perspectiveAddress} 
        bind:this={addressInput} 
        on:keydown={(event) => {
          console.log(event)
          if(event.key === 'Enter') {
            lookupAddress()
          }
          event.stopPropagation()
        }}
      />
      
      <j-button variant="link" on:click={()=>{sharingDialog.open=true}}>

        {#if perspective && perspective.sharedUrl}
          <j-icon name="share-fill"/>
        {:else}
          <j-icon name="share"/>
        {/if}
        
      </j-button>
      
    </j-flex>
    
  </div>
  <div class="button-group">
    <j-button variant="link" on:click="{() => settingsDialog.open = true}" class="system-button">
      <j-icon class="system-button" name="gear"/>
    </j-button>
    
    <j-icon class="system-button" name="person-circle"/>
  </div>
</div>

{#if connected}
  <div class="container">
    <div class="nav">
      <Nav {selectedPerspective} on:select={setPerspective} />
    </div>
    <main>
      <MainView perspectiveID={selectedPerspective} on:selectionChanged={setExpression} on:perspectiveDeleted={perspectiveDeleted} />
    </main>
  </div>
{/if}


<j-modal bind:this={settingsDialog} class="modal">
	<header class="header" slot="header">
	  <j-text variant="heading">Settings</j-text>
    <j-text variant="label">OpenAI API KEY:</j-text>
    <j-input type="text"  bind:this={openaiKeyInput} value={openaiKey}/>
    <j-button variant="primary" on:click={()=>{
      localStorage.setItem('openaiKey', openaiKeyInput.value)
      settingsDialog.open = false
    }}>Save</j-button>
	</header>
</j-modal>

<j-modal bind:this={sharingDialog} class="modal">
	<header class="header" slot="header">
	  <j-text variant="heading">Share Perspective</j-text>
    {#if sharingDialog && sharingDialog.open}
      <NeighbourhoodSharing perspective={perspective} />
    {/if}
	</header>
</j-modal>

<j-modal bind:this={neighbourhoodJoinDialog} class="modal">
  <header class="header" slot="header">
    <j-text variant="heading">Join Neighbourhood</j-text>
    <j-text variant="label">URL:</j-text>
    <j-text>{joinNeighbourhoodAddress}</j-text>
    <j-text variant="label">Author:</j-text>
    <j-text>{joinNeighbourhoodExpression?.author}</j-text>
    <j-text variant="label">Timestamp:</j-text>
    <j-text>{joinNeighbourhoodExpression?.timestamp}</j-text>
    {#if joinNeighbourhoodExpression?.data?.meta?.links?.length > 0}
      <j-text variant="label">Meta info:</j-text>
      
      {#each joinNeighbourhoodExpression?.data.meta.links as metaLink}
        <j-text variant="label">{metaLink.data.source}[{metaLink.data.predicate}]:</j-text>
        <j-text>{metaLink.data.target}</j-text>
      {/each}
    {/if}
    
    <j-button variant="primary" on:click={joinNeighbourhood}>Join</j-button>
  </header>
</j-modal>
<style>

  .header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f0f0f0;
    padding: 0 16px;
    height: 64px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
    top: 0;
    left: 0;
    right: 0;
  }

  .title-logo {
    height: 100%;
    padding-left: 1px;
  }
  .container {
    display: grid;
    grid-template-columns: 100px 1fr;
    grid-template-rows: 1fr;
    height: calc(100vh - 58px);
    overflow: hidden;
  }

  .nav {
    overflow: scroll;
    height: calc(100vh - 58px);
  }

  .properties-browser {
    flex: 0 0 60px;
  }

  main {
    height: calc(100vh - 58px);
    width: 100%-460px;
    background-color: #ffffff;
    margin-left: -6px;
  }

  .system-button {
    margin-left: 10px;
    cursor: pointer;
  }

  .address-bar {
    margin-left: 10px;
    width: 60%;
  } 

  .address-input {
    width: 100%;
  }
</style>
