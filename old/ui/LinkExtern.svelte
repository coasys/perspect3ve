<script lang="ts">
    import { getContext } from "svelte";
    const ad4m = getContext('ad4mClient')

    export let url: String;

    function click() {
        ad4m.runtime.openLink(url)
    }
</script>

<!-- svelte-ignore a11y-invalid-attribute -->
<a class="link" href="#" on:click={click}><slot></slot></a>

<style>
    .link {
        cursor: pointer;
    }
</style>