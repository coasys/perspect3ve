<script>
    export let items;
    export let left=126;
    export let top=90;

    let moving = false

    function start() {
        moving = true
    }

    function stop() {
        moving = false
    }

    function move(e) {
        if (moving) {
            console.log(e.movementX, e.movementY)
            left += e.movementX
            top += e.movementY
        }
    }
  </script>
  
  <svelte:window on:mouseup={stop} on:mousemove={move}/>

  <div class="toolbar" style="left: {left}px; top: {top}px;" on:mousedown={start}>
    <span class="title">Tools</span>
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
  </div>
  
  <style>
    .toolbar {
        position: absolute;
        cursor: move;
        user-select: none;  
        align-items: center;
        background-color: #a0a0a0aa;
        padding: 0;
    }
  
    .title {
        display: block;
      margin: 0;
      font-size: 24px;
      color: white;
      background-color: black;
      padding: 8px 5px;
    }
  
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
  