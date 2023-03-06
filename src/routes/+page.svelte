<script>
  import Ad4mConnectUI from '@perspect3vism/ad4m-connect';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import Nav from './Nav.svelte';
  import MainView from './MainView.svelte';
  import PropertiesBrowser from './PropertiesBrowser.svelte';
  import { onMount, setContext } from 'svelte';

  let selectedPerspective = null;
  let selectedExpression = "ad4m://self";

  function setPerspective(event) {
    console.log('handleSelect', event.detail);
    selectedPerspective = event.detail;
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

    appIconPath: 'public/Perspect3veLogo.png',
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
</script>

{#if connected}
  <div class="container">
    <div class="nav">
      <Nav {selectedPerspective} on:select={setPerspective} />
    </div>
    <main>
      <MainView perspectiveID={selectedPerspective} on:selectionChanged={setExpression} />
    </main>

    <div class="properties-browser">
      <PropertiesBrowser perspectiveID={selectedPerspective} expression={selectedExpression} on:perspectiveDeleted={perspectiveDeleted}/>
    </div>
  </div>
{/if}

<style>
  .container {
    display: grid;
    grid-template-columns: 120px 1fr 300px;
    grid-template-rows: 1fr;
    height: 100vh;
    max-height: 100vh;
  }

  .nav {
    flex: 0 0 40px;
    overflow: scroll;
  }

  .properties-browser {
    flex: 0 0 60px;
  }

  main {
    height: 100%;
    width: 100%-460px;
    background-color: #ffffff;
  }
</style>
