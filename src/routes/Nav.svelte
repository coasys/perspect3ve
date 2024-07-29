<script lang="ts">
  import { LinkQuery, type Ad4mClient, type PerspectiveProxy } from '@coasys/ad4m';
  import { getAd4mClient } from '@coasys/ad4m-connect';
  import { onMount, createEventDispatcher } from 'svelte';
  import { BACKGROUND_PREDICATES, PROFILE_NAME } from './config';

  export let selectedPerspective:string

  let ad4m: Ad4mClient|undefined;
  let perspectives: PerspectiveProxy[] = [];
  let perspectivesToRender: PerspectiveProxy[] = [];
  let profile: PerspectiveProxy|undefined;

  let profileSrc
  let perspectiveThumbnails = {}

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' }
  ];

  let selected = navItems[0].id;

  $:if(selectedPerspective) selected = selectedPerspective

  const dispatch = createEventDispatcher();

  function handleSelect(id) {
    selected = id;
    dispatch('select', id);
  }

  function addNewPerspective() {
    ad4m!.perspective.add("New Perspective")
  }

  async function ensureProfilePerspective() {
    profile = perspectives.find(p => p.name === PROFILE_NAME)
    
    if (!profile) {
      profile = await ad4m!.perspective.add(PROFILE_NAME)
      const me = await ad4m!.agent.me()
      await profile.loadSnapshot(me.perspective!)
      perspectives.push(profile)
    }

    const thumbnail = await profile.get(new LinkQuery({predicate: "sioc://has_profile_thumbnail_image"}))
    if(thumbnail && thumbnail.length > 0) {
      const imageURI = thumbnail[0].data.target
      const imageExpr = await ad4m!.expression.get(imageURI)
      const imageData = JSON.parse(imageExpr.data)
      profileSrc = `data:${imageData.file_type};base64,${imageData.data_base64}`
    }
  }

  async function update() {
      perspectives = await ad4m!.perspective.all();

      perspectivesToRender = perspectives.filter(p=>
        p.name !== PROFILE_NAME &&
        !p.name.startsWith("did:") 
      )

      for(const p of perspectivesToRender) {
        for(const predicate of BACKGROUND_PREDICATES) {
          const links = await p.get(new LinkQuery({source: "ad4m://self", predicate}))
          if(links && links.length>0) {
            const imageURI = links[0].data.target
            const imageExpr = await ad4m!.expression.get(imageURI)
            const imageData = JSON.parse(imageExpr.data)
            perspectiveThumbnails[p.uuid] = `data:${imageData.file_type};base64,${imageData.data_base64}`
          }
        }
      }
    }

  onMount(async () => {
    ad4m = await getAd4mClient();
    ad4m.perspective.addPerspectiveUpdatedListener(update)
    ad4m.perspective.addPerspectiveAddedListener(update)
    ad4m.perspective.addPerspectiveRemovedListener(update)

    await update()
    await ensureProfilePerspective()
  });
</script>

<div class="nav-container">
  <ul class="nav">
    <j-avatar class="nav-item {selected === profile?.uuid ? 'selected' : ''}" on:click={() => handleSelect(profile.uuid)} src={profileSrc}></j-avatar>
    {#each perspectivesToRender as p}
      {#if p.name !== PROFILE_NAME}
        {@const displayText = p.name.length > 0 ? p.name : p.uuid}
        <j-tooltip title={displayText}>
          <j-avatar 
            size="l"
            hash={p.uuid}
            src={perspectiveThumbnails[p.uuid]}
            class="nav-item {selected === p.uuid ? 'selected' : ''}"
            on:click={() => handleSelect(p.uuid)}
          >
            <span class="nav-item-text">
              {#if displayText.length > 10}
                {displayText.slice(0, 5)}...
              {:else}
                {displayText}
              {/if}
            </span>
          </j-avatar>
        </j-tooltip>
      {/if}
    {/each}
  </ul>
  <div class="nav-controls">
    <j-button 
      square
      circle
      variant="transparent" 
      size="xl"
      style="padding-bottom: 3px"
			on:click={addNewPerspective} 
		>
      <j-icon name="plus" size="l" />
    </j-button>
  </div>
</div>

<style>
  .nav-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 60px;
    height: 100%;
    padding: 0 40px;
    overflow: scroll;
  }

  .nav {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .nav-item {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
    width: 60px;
    margin: 10px;
    border-radius: 50%;
    cursor: pointer;
    background-color: #ffffff;
    color: #282c34;
    font-weight: bold;
    text-align: center;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .nav-item.selected {
    background-color: #61dafb;
    color: #282c34;
  }

  .nav-item-text {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .nav-controls {
    margin-top: 10px;
  }

</style>
