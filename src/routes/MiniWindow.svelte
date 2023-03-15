<script lang="ts">
    export let title = "Title"
    export let left = 150;
    export let top = 90;
    export let background
    export let width = 250

    let moving = false
    let collapsed = false

    function start() {
        moving = true
    }

    function stop() {
        moving = false
    }

    console.log(left)
    $: if(typeof left == "string") left = parseInt(left)
    $: if(typeof top == "string") top = parseInt(top)

    function move(e) {
        if (moving) {
            left += e.movementX
            top += e.movementY
            console.log(left, top)
        }
    }
</script>

<svelte:window on:mouseup={stop} on:mousemove={move}/>
<div class="mini-window" style="width: {width}px; left: {left}px; top: {top}px; {background?`background-color: ${background}`:''}" on:mousedown={start}>
    <span class="title">
		{title}
		<div class="window-controls">
			{#if collapsed}
				<j-button variant="link"
					on:click={()=>collapsed = false}>
					<j-icon style="color: white" name="arrows-angle-expand"/>
				</j-button>
			{:else}
				<j-button variant="link"
					on:click={()=>collapsed = true}>
					<j-icon style="color: white" name="arrows-angle-contract"/>
				</j-button>
			{/if}
		</div>
  </span>
  {#if !collapsed}
    <div class="content">
        <slot></slot>
    </div>
  {/if}
</div>


<style>
    .mini-window {
        position: absolute;
        cursor: move;
        display: flex;
        flex-direction: column;
        background-color: #f5f5f5c5;
    }

    .title {
      display: block;
      margin: 0;
	  user-select: none;
      font-size: 24px;
      color: white;
      background-color: black;
      padding: 8px 5px;
	  line-height: 38px;
    }

    .window-controls {
        float: right;
    } 
</style>