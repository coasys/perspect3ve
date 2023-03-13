<script>
    export let title;
    export let items;
  </script>
  
  <div class="toolbar">
    <h1 class="title">Create Expressions:</h1>
    <div class="items">
      {#each items as item}
        
        <j-button on:click={item.onClick}>
            {#if item.icon}
                <j-icon name="{item.icon}" size="xs" />
            {/if}
            {item.label}
        </j-button>
        
      {/each}
    </div>
  </div>
  
  <style>
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f0f0f0;
      padding: 0 16px;
      height: 64px;
      
      top: 0;
      left: 0;
      right: 0;
    }
  
    .title {
      margin: 0;
      font-size: 24px;
    }
  
    .items {
      display: flex;
      gap: 16px;
    }
  
    button {
      font-size: 16px;
      padding: 8px 16px;
      border: none;
      background-color: transparent;
      cursor: pointer;
    }
  
    button:hover {
      background-color: #e0e0e0;
    }
  
    button:focus {
      outline: none;
      box-shadow: inset 0px 0px 0px 2px #4d90fe;
    }
  </style>
  