<script>
  import Ad4mConnectUI from '@perspect3vism/ad4m-connect';
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import Nav from './Nav.svelte';
  import MainView from './MainView.svelte';
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
</script>

<div class="header-bar">
  <img class="title-logo" src="/perspect3ve-logo-header.png" alt="Perspect3ve" />
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
</style>
