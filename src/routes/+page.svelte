<script>
  import Ad4mConnectUI from "@perspect3vism/ad4m-connect";
  import { getAd4mClient } from "@perspect3vism/ad4m-connect";
  import Nav from './Nav.svelte';
  import MainView from './MainView.svelte';
  import PropertiesBrowser from './PropertiesBrowser.svelte';
	import { onMount, setContext } from "svelte";

  let selected = 'home'; // default selected nav item

  function handleSelect(event) {
    selected = event.detail;
  }

  let connected = false

  const ui = Ad4mConnectUI({
    appName: "Perspect3ve",
    appDesc: "Browser for AD4M Perspectives",
    appDomain: "dev.ad4m.perspect3ve",
    appUrl: "https://perspect3ve.app",

    appIconPath: "./pub/Perspect3veLogo.png",
    capabilities: [ 
      {
        with: { domain: "*", pointers: ["*"] },
        can: ["*"],
      },
    ],
  });

  onMount(() => {
    ui.connect()
  });

  ui.addEventListener("authstatechange", async (e) => {
    console.log("authstatechange", e);
    if (e.detail === "authenticated") {
      connected = true
    }
  });
</script>

{#if connected}
  <div class="container">
    <div class="nav">
      <Nav selected={selected} onSelect={handleSelect} />
    </div>
    <main>
      <MainView />
    </main>
      
    <div class="properties-browser">
      <PropertiesBrowser />
    </div>
  </div>
{/if}

<style>
  .container {
    display: grid;
    grid-template-columns: 120px 1fr 340px;
    grid-template-rows: 1fr;
    height: 100vh;

  }

  .nav {
    flex: 0 0 40px;
  }

  .properties-browser {
    flex: 0 0 100px;
  }

  main {
    height: 100%;
    width: 100%-460px;
    background-color: #ffffff;
  }

</style>