<script lang="ts">
    export let title = "Title"
    export let left = 150;
    export let top = 90;
    export let background
    export let width = 250
    export let minified = false
    export let dockposition = "left"

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
        }
    }
</script>

<svelte:window on:mouseup={stop} on:mousemove={move}/>
<div 
  class="mini-window {minified?'minified':''} {dockposition?'dock-'+dockposition:''}"  
  style="width: {width}px; {!minified?'left: '+left+'px; top: '+top+'px; ':''} {background?`background-color: ${background}`:''}" 
  on:mousedown={start}>
    <span class="title">
        <j-text variant="heading">{title}</j-text>
		<div class="window-controls">
            {#if minified}
                <j-button variant="link"
                    on:click={()=>minified = false}>
                    <j-icon style="color: var(--j-color-black)" name="window"/>
                </j-button>
            {:else}
                <j-button variant="link"
                    on:click={()=>minified = true}>
                    <j-icon style="color: var(--j-color-black)" name="dash-square"/>
                </j-button>
            {/if}
			{#if collapsed}
				<j-button variant="link"
					on:click={()=>collapsed = false}>
					<j-icon style="color: var(--j-color-black)" name="arrows-angle-expand"/>
				</j-button>
			{:else}
				<j-button variant="link"
					on:click={()=>collapsed = true}>
					<j-icon style="color: var(--j-color-black)" name="arrows-angle-contract"/>
				</j-button>
			{/if}
		</div>
  </span>
  {#if !collapsed && !minified}
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
        background-color: var(--j-color-ui-100);
    }

    .minified {
        top: undefined;
        bottom: 0;
        left: 0;
    }
    
    .dock-center {
        left: 50%;
        transform: translateX(-50%);
    } 

    .dock-left {
        left: 0;
    }

    .dock-right {
        left: calc(100% - 330px);
        right: 0;
    }

    .title {
      display: block;
      margin: 0;
	  user-select: none;
      font-size: 24px;
      color: var(--j-color-black);
      background-color: var(--j-color-white);
      padding: 8px 5px;
	  line-height: 38px;
    }

    .window-controls {
        position: absolute;
        right: 5px;
        top: 14px;
        color: var(--j-color-black);
    } 
</style>