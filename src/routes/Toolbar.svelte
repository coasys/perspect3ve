<script>
    export let items;
</script>
  

<ul class="items">
    {#each items as item}
    <li class="item">
        <j-button on:click={item.onClick}>
            {#if item.icon}
                <j-icon name="{item.icon}" size="xs" />
            {/if}
            {item.label}
        </j-button>
    </li>
    {/each}
</ul>

  
  <style>
  
    .items {
        padding: 0 16px;
    }
  
    .item {
        display: block;
        margin-bottom: 10px
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
  