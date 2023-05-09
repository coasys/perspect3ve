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
  style="width: {width}px; {!minified?'left: '+left+'px; top: '+top+'px; ':''}" 
  on:mousedown={start}>
    <span class="title">
        <j-text variant="heading" size="sm">{title}</j-text>
		<div class="window-controls">
            {#if minified}
                <j-button variant="link" square size="sm"
                    on:click={()=>minified = false}>
                    <j-icon style="color: var(--j-color-black)" name="window" size="sm"/>
                </j-button>
            {:else}
                <j-button variant="link" square size="sm"
                    on:click={()=>minified = true}>
                    <j-icon style="color: var(--j-color-black)" name="dash-square" size="sm"/>
                </j-button>
            {/if}
			{#if collapsed}
				<j-button variant="link" square size="sm"
					on:click={()=>collapsed = false}>
					<j-icon style="color: var(--j-color-black)" name="arrows-angle-expand" size="sm"/>
				</j-button>
			{:else}
				<j-button variant="link" square size="sm"
					on:click={()=>collapsed = true}>
					<j-icon style="color: var(--j-color-black)" name="arrows-angle-contract" size="sm"/>
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
        z-index: 2;
    }
    .mini-window:hover .content {
        background: var(--j-color-ui-100);
    }

    .content {
        border: 1px solid #ffffff33;
        background: #ffffff0a;
        transition: background 0.2s ease;
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
        border-bottom: 1px solid #ffffff80;
        margin-bottom: 20px;
        user-select: none;
    }

    .window-controls {
        position: absolute;
        right: 0;
        top: -10px;
    } 
</style>