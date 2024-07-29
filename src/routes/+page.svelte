<script lang="ts">
  import '@junto-foundation/junto-elements';
  import '@junto-foundation/junto-elements/dist/main.css';
  import '../themes/cyberpunk.css';
  import '../themes/dark.css';
  import '../themes/retro.css';
  import '../themes/black.css';
  import Ad4mConnectUI, { getAd4mClient } from '@coasys/ad4m-connect';
  import Nav from './Nav.svelte';
  import MainView from './MainView.svelte';
  import { onMount, setContext } from 'svelte';
  import { Literal, parseExprUrl, type Ad4mClient, type PerspectiveProxy } from '@coasys/ad4m';
  import NeighbourhoodSharing from './NeighbourhoodSharing.svelte';
  import { PROFILE_NAME } from './config';
  import stringify from 'json-stable-stringify';

  import '../main.css';

  let selectedPerspective = null;
  let selectedExpression = "ad4m://self";
  let perspective: PerspectiveProxy|null = null

  let settingsDialog
  let openaiKey
  let openaiKeyInput

  let addressInput
  let perspectiveAddress

  let sharingDialog
  let neighbourhoodJoinDialog
  let joinNeighbourhoodExpression
  let joinNeighbourhoodAddress

  let agentProfileStatus

  let ad4m: Ad4mClient

  let theme: string|null = null

  async function checkAgentProfileStatus() {
    ad4m = await getAd4mClient()
    const me = await ad4m.agent.me()
    const published = await ad4m.expression.get(me.did)
    const publishedString = stringify((JSON.parse(published.data)).perspective)
    const snapshot = await perspective?.snapshot()
    for(let link of snapshot.links) {
      delete link.proof.valid
      delete link.proof.invalid
    }
    const localString = stringify(snapshot)

    if(publishedString === localString) {
      agentProfileStatus = "same"
    } else {
      agentProfileStatus = "different"
    }
  }

  async function publishAgentProfile() {
    agentProfileStatus = "updating"
    const snapshot = await perspective?.snapshot()
    await ad4m.agent.updatePublicPerspective(snapshot)
    await checkAgentProfileStatus()
  }

  async function setPerspective(event) {
    selectedPerspective = event.detail;
    agentProfileStatus = null

    if(selectedPerspective) {
      perspective = await ad4m.perspective.byUUID(selectedPerspective)
      if(!perspective) {
        console.error("Perspective not found: ", selectedPerspective)
        return
      }
      if(perspective.name == PROFILE_NAME) {
        perspectiveAddress = "Me"  
        await checkAgentProfileStatus()
        perspective.addListener("link-added", checkAgentProfileStatus)
        perspective.addListener("link-removed", checkAgentProfileStatus)
        perspective.addListener("link-updated", checkAgentProfileStatus)
      } else if(perspective.sharedUrl) {
        perspectiveAddress = perspective.sharedUrl
      } else if(perspective.name) {
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

  onMount(async () => {
    ui.connect();
    ad4m = await getAd4mClient()
    openaiKey = localStorage.getItem('openaiKey')
    theme = localStorage.getItem('theme')
    console.log("theme found in localstorage", theme)
    document.documentElement.setAttribute('class', theme)
  });

  ui.addEventListener('authstatechange', async (e) => {
    console.log('authstatechange', e);
    if (e.detail === 'authenticated') {
      connected = true;
    }
  });

  async function lookupAddress() {
    const address = addressInput.value
    let perspective: PerspectiveProxy|undefined

    async function lookupAgentPerspective(did: string): Promise<PerspectiveProxy> {
      console.log("1")
      const allPerspectives = await ad4m.perspective.all()
      let oldAgentPerspective = allPerspectives.find(p=>p.name==did)
      if(oldAgentPerspective) {
        ad4m.perspective.remove(oldAgentPerspective.uuid)
      }

      console.log("2")
      const newAgentPerspective = await ad4m.perspective.add(did)
      console.log("3")
      const otherAgent = await ad4m.agent.byDID(did)
      console.log("4")
      console.log("got agent", otherAgent)
      if(otherAgent.perspective) {
        console.log("loading snapshot", otherAgent.perspective)
        await newAgentPerspective.loadSnapshot(otherAgent.perspective)
      }

      console.log("5")

      return newAgentPerspective
    }

    try {
      const exprRef = parseExprUrl(address)
      console.log("exprRef language", exprRef.language)
      if(exprRef.language.address === "did") {
        console.log("got did")
        perspective = await lookupAgentPerspective(address)
      }
    }catch(e){
      console.debug("Error parsing address as DID:", e)
    }
    
    if(!perspective) {
      const perspectiveAddress = address
      const allPerspectives = await ad4m.perspective.all()
      perspective = allPerspectives.find(p => {
        return p.name === perspectiveAddress ||
          p.sharedUrl === perspectiveAddress ||
          p.uuid === perspectiveAddress
      })
    }
    

    function tryParsingLiteral(input: string): string {
      try {
        let value = Literal.fromUrl(input).get()
        if(typeof value == 'object') {
          if(value.data)
            value = value.data
          else
            value = JSON.stringify(value)
        }
        return value
      } catch(e) {}
      return input
    }

    if(!perspective && address.startsWith("neighbourhood://")) {
      console.log("Try NH", address)
      ad4m = await ui.getAd4mClient()
      const nh = await ad4m.expression.get(address)
      console.log(nh)
      if(nh) {
        joinNeighbourhoodExpression = nh
        joinNeighbourhoodExpression.data = JSON.parse(joinNeighbourhoodExpression.data)
        if(joinNeighbourhoodExpression?.data?.meta?.links?.length > 0) {
          for(const link of joinNeighbourhoodExpression.data.meta.links) {
            link.data.source = tryParsingLiteral(link.data.source)
            link.data.predicate = tryParsingLiteral(link.data.predicate)
            link.data.target = tryParsingLiteral(link.data.target)
          }
        }
        joinNeighbourhoodAddress = address
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

  let joiningInProgress = false
  let joiningError = null

  async function joinNeighbourhood() {
    console.log("Join neighbourhood", joinNeighbourhoodAddress)
    joiningInProgress = true
    let neighbourhood
    try {
      neighbourhood = await ad4m.neighbourhood.joinFromUrl(joinNeighbourhoodAddress)
    } catch(e) {
      console.error(e)
      joiningError = e.message
      joiningInProgress = false
      return
    }
    
    joiningInProgress = false
    console.log("Joined neighbourhood", neighbourhood)
    neighbourhoodJoinDialog.open = false
    selectedPerspective = neighbourhood.uuid
    setPerspective({detail: neighbourhood.uuid})
  }
</script>

<div class="header-bar">
  <div class="header-logo">
    <img class="title-logo" src="/logo.png" alt="Perspect3ve" />
    <j-text color="--j-color-black" variant="heading-sm" nomargin tag="h1" weight="regular">Perspect3ve</j-text>
  </div>
  <div class="address-bar">
    <j-flex>
      {#if false}
      <j-button class="header-button" variant="link" disabled>
        <j-icon name="chevron-left"/>
      </j-button>
      <j-button class="header-button" variant="link" disabled>
        <j-icon name="chevron-right"/>
      </j-button>
      
      <j-button class="header-button" variant="link" disabled>
        <j-icon name="arrow-up-circle"/>
      </j-button>
      {/if}
      
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
      
      {#if agentProfileStatus}
        <j-button 
          class="header-button" 
          variant="link" 
          disabled={agentProfileStatus != "different"}
          on:click={publishAgentProfile}>
          {#if agentProfileStatus == "different"}
            <j-icon name="cloud-arrow-up"/>
          {:else if agentProfileStatus == "same"}
            <j-icon name="cloud-check"/>
          {:else if agentProfileStatus == "updating"}
            <j-icon name="arrow-repeat"/>
          {:else}
            <j-icon name="patch-question"/>
          {/if}
        </j-button>
      {:else}
        <j-button class="header-button" variant="link" on:click={()=>{sharingDialog.open=true}}>
          {#if perspective && perspective.sharedUrl}
            <j-icon name="share-fill"/>
          {:else}
            <j-icon name="share"/>
          {/if}
        </j-button>
      {/if}
      
    </j-flex>
    
  </div>
  <div class="button-group">
    <j-button variant="link" on:click="{() => settingsDialog.open = true}" class="system-button">
      <j-icon class="system-button" name="gear"/>
    </j-button>
  </div>
</div>

{#if connected}
  <div class="nav">
    <Nav {selectedPerspective} on:select={setPerspective} />
  </div>
  <main>
    <MainView perspectiveID={selectedPerspective} on:selectionChanged={setExpression} on:perspectiveDeleted={perspectiveDeleted} />
  </main>
{/if}


<j-modal bind:this={settingsDialog} class="modal">
	<header class="header" slot="header">
	  <j-text variant="heading">Settings</j-text>
    <j-text variant="label">Theme</j-text>
    <j-select value={theme} on:change={(event) => {
      theme = event.target.value
      if(!theme) return
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('class', theme)
    }}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="black">Black</option>
      <option value="cyberpunk">Cyberpunk</option>
      <option value="retro">Retro</option>
    </j-select>
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
    <j-text variant="subheading">URL:</j-text>
    <j-text >{joinNeighbourhoodAddress}</j-text>
    <j-text variant="subheading">Author:</j-text>
    <j-text>{joinNeighbourhoodExpression?.author}</j-text>
    <j-text variant="subheading">Timestamp:</j-text>
    <j-text>{joinNeighbourhoodExpression?.timestamp}</j-text>
    {#if joinNeighbourhoodExpression?.data?.meta?.links?.length > 0}
      <j-text variant="subheading">Meta info:</j-text>
      
      {#each joinNeighbourhoodExpression?.data.meta.links as metaLink}
        <j-text variant="label">{metaLink.data.source}[{metaLink.data.predicate}]:</j-text>
        <j-text>{metaLink.data.target}</j-text>
      {/each}
    {/if}
    
    <j-button variant="primary" on:click={joinNeighbourhood} disabled={joiningInProgress}>Join</j-button>
    {#if joiningInProgress}
        <j-spinner />
        {#if joiningError}
          <j-text variant="label">{joiningError}</j-text>
        {/if}
    {/if}
  </header>
</j-modal>
<style>

  .header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    height: 80px;
    position: relative;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1;
  }

  .header-logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .title-logo {
    width: 60px;
  }

  .nav {
    position: fixed;
    display: block;
    left: 0;
    top: 160px;
    bottom: 0;
    z-index: 1;
  }

  .properties-browser {
    flex: 0 0 60px;
  }

  main {
    width: 100%;
  }

  .header-button {
    display: flex;
    align-items: center;
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
