<script>
  import { getAd4mClient } from '@perspect3vism/ad4m-connect';
  import { onMount, createEventDispatcher } from 'svelte';

  let refs;

  let ad4m;
  let perspectives = [];

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' }
  ];

  let selected = navItems[0].id;

  const dispatch = createEventDispatcher();

  function handleSelect(id) {
    selected = id;
    dispatch('select', id);
  }

  function addNewPerspective() {
    ad4m.perspective.add("New Perspective")
  }

  let navHeight = 0;

  onMount(async () => {
    // Set the height of the nav container to match the height of the nav items
    navHeight = refs.offsetHeight;
    ad4m = await getAd4mClient();
    async function update() {
      perspectives = await ad4m.perspective.all();
    }
    
    ad4m.perspective.addPerspectiveUpdatedListener(update)
    ad4m.perspective.addPerspectiveAddedListener(update)
    ad4m.perspective.addPerspectiveRemovedListener(update)

    update()
    console.log(perspectives);
  });
</script>

<div class="nav-container">
  <ul bind:this={refs} class="nav">
    {#each perspectives as p}
      {@const displayText = p.name.length > 0 ? p.name : p.uuid}
      <j-tooltip title={displayText}>
        <j-avatar hash={p.uuid}
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
    {/each}
  </ul>
  <div class="nav-controls">
    <j-button 
      variant="transparent" 
      style="padding-bottom: 3px"
			on:click={addNewPerspective} 
		>
      <j-icon name="plus" />
    </j-button>
  </div>
</div>

<style>
  .nav-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: scroll;
    width: 80px;
    height: 100%;
    padding: 10px;
    background-color: #2c2f33;
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

  .nav-circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #b9bbbe;
    margin-right: 10px;
  }

  .nav-label {
    font-size: 14px;
    color: #b9bbbe;
    text-align: center;
  }
</style>
