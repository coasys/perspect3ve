<script lang="ts">
  import Ad4mConnectUI from '@perspect3vism/ad4m-connect';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import Nav from './Nav.svelte';
  import MainView from './MainView.svelte';
  import { onMount, setContext } from 'svelte';
  import type { Ad4mClient, PerspectiveProxy } from '@perspect3vism/ad4m';

  let selectedPerspective = null;
  let selectedExpression = "ad4m://self";

  let ad4m: Promise<Ad4mClient> = getAd4mClient()

  async function setPerspective(event) {
    console.log('handleSelect', event.detail);
    selectedPerspective = event.detail;

    if(selectedPerspective) {
      const perspective: PerspectiveProxy = (await (await ad4m).perspective.byUUID(selectedPerspective))!
      console.log("perspective", perspective)
      if(perspective.name) {
        perspectiveAddress = perspective.name
      } else {
        perspectiveAddress = perspective.uuid
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

  onMount(() => {
    ui.connect();
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

  onMount(async () => {
    openaiKey = localStorage.getItem('openaiKey')
  });
</script>

<div class="header-bar">
  <img class="title-logo" src="/perspect3ve-logo-header.png" alt="Perspect3ve" />
  <div class="address-bar">
    <j-input type="text" value={perspectiveAddress} bind:this={addressInput} />
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
    width: 50%;
  } 
</style>
