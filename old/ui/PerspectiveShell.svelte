<script lang="ts">
    import type { PerspectiveProxy } from "@perspect3vism/ad4m";
    export let perspective: PerspectiveProxy

    let prompt = `|${perspective.name}>`
    let lines = []
    let input = ''
    let historyCounter = -1
    let unfinishedLine = ''
    let shellContent


    async function keypress(event) {
        console.log(event.key)
        switch(event.key) {
            case "Enter":
                event.preventDefault()
                await evalProlog()
                input = ''
                historyCounter = -1
                shellContent.scrollTo(0, shellContent.scrollHeight)
                break;
            case "ArrowUp":
                event.preventDefault()
                console.log("up")
                if(historyCounter < lines.length-1) {
                    if(historyCounter === 0) {
                        unfinishedLine = input
                    }
                    historyCounter++
                    let historyLine = lines[lines.length -1 -historyCounter]                    
                    input = historyLine.input
                }
                break;
            case "ArrowDown":
                event.preventDefault()
                console.log("down")
                if(historyCounter > 0) {
                    let historyLine = lines[lines.length -1 -historyCounter]
                    historyCounter--
                    input = historyLine.input
                } else {
                    input = unfinishedLine
                    historyCounter = -1
                }
                break;
        }
    }

    async function evalProlog() {
        let results
        let errors
        try {
            //@ts-ignore
            results = await perspective.infer(input)
        } catch(e) {
            errors = e
        }
        if(typeof results == 'object') results = results.map(r=>Object.entries(r))
        lines = [...lines, {
            input: JSON.parse(JSON.stringify(input)),
            results,
            errors
        }]

    }
</script>

<div class="perspective-shell-content" 
    bind:this={shellContent}
    on:keypress|stopPropagation
    on:keydown|stopPropagation
>
    {#each lines as line}
        <div class="line">
            <div class="prompt-line">
                <span class="prompt">{prompt}</span>
                <span class="prompt-input">{line.input}</span>    
            </div>
            {#if line.errors}
                {#each line.errors as error}
                    <span class="error">{error.message}</span>
                {/each}
            {:else}
                {#if line.results === false}
                    <span class="false">false</span>
                {:else if line.results.length}
                    <ul>
                    {#each line.results as result}
                        <li>
                        {#each result as [key, value]}
                            <span class="variable">{key}</span>: <span class="match">{value}</span><br>
                        {/each}
                        </li>
                    {/each}
                    </ul>
                {:else}
                    <span class="true">true</span>
                {/if}
            {/if}
        </div>
    {/each}
    <div class="new-line">
        <span class="prompt">{prompt}</span>
        <input class="prompt-input" bind:value={input} 
            on:keypress|stopPropagation={keypress} 
            on:keydown|stopPropagation={keypress}
            on:keyup|stopPropagation
        >
    </div>
</div>

<style>
    .perspective-shell-content {
        color: white;
        background-color: black;
    }

    .prompt-line {
        display: flex;
        width: 100%;
    }

    .new-line {
        display: flex;
        width: 100%;
    }

    .prompt {
        float: left;
    }

    .prompt-input {
        flex-grow: 1;
        padding: 0 5px;
        color: white;
        background-color: black;
        border: none;
        outline: none;
    }

    .error {
        color: red;
    }

    .variable {
        color: rgb(113, 211, 241);
    }

    .match {
        font-size: 12px;
        font-style: italic;
    }

    .false {
        color: red;
    }

    .true {
        color: green;
    }
</style>