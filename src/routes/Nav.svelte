<script>
	import { getAd4mClient } from '@perspect3vism/ad4m-connect';
    import { onMount } from 'svelte';
    let refs

    let ad4m;
    let perspectives = []

    const navItems = [
      { id: 'home', label: 'Home' },
      { id: 'about', label: 'About' },
      { id: 'contact', label: 'Contact' }
    ];
    
    let selected = navItems[0].id;
    
    function handleSelect(id) {
      selected = id;
      dispatch('select', id);
    }
  
    function dispatch(eventName, detail) {
      const event = new CustomEvent(eventName, { detail });
      dispatchEvent(event);
    }
    
    let navHeight = 0;
  
    onMount(async () => {
      // Set the height of the nav container to match the height of the nav items
      navHeight = refs.offsetHeight;
      ad4m = await getAd4mClient();
      perspectives = await ad4m.perspective.all()
      console.log(perspectives)
    });
  </script>
  
  <div class="nav-container" >
    <ul bind:this={refs} class="nav">
      {#each perspectives as p}
        <li
          class="nav-item {p.uuid === selected ? 'selected' : ''}"
          on:click={() => handleSelect(p.uuid)}
        >
          <div class="nav-circle"></div>
          <div class="nav-label">{p.name}</div>
        </li>
      {/each}
    </ul>
  </div>
  
  <style>
    .nav-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: scroll;
      width: 80px;
      padding: 20px;
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
      flex-direction: row;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-bottom: 10px;
      cursor: pointer;
    }
    
    .nav-item.selected {
      background-color: #7289da;
      border-radius: 50px;
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
  