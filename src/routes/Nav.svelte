<script>
    import { onMount } from 'svelte';
    let refs

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
  
    onMount(() => {
      // Set the height of the nav container to match the height of the nav items
      navHeight = refs.offsetHeight;
    });
  </script>
  
  <div class="nav-container" style="height: {navHeight}px;">
    <ul bind:this={refs} class="nav">
      {#each navItems as { id, label }}
        <li
          class="nav-item {id === selected ? 'selected' : ''}"
          on:click={() => handleSelect(id)}
        >
          <div class="nav-circle"></div>
          <div class="nav-label">{label}</div>
        </li>
      {/each}
    </ul>
  </div>
  
  <style>
    .nav-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
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
  