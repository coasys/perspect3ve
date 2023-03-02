<script lang="ts">
    import Menu from '@smui/menu';
    import List, {Item, Text, Graphic} from '@smui/list';
    import { createEventDispatcher } from 'svelte';
    import Clipboard from "svelte-clipboard";

    const dispatch = createEventDispatcher();

    let menu
    let anchor
    let anchorX
    let anchorY

    let link

    export function open(x, y, l) {
        link = l
        anchorX = x
        anchorY = y
        menu.setOpen(true)
    }

</script>

<div class="anchor" bind:this={anchor} style={`position: absolute; left: ${anchorX}px; top: ${anchorY}px;`}>
    <Clipboard text={JSON.stringify(link)} let:copy>
    <Menu bind:this={menu} bind:anchorElement={anchor}>
        <List>
            <Item on:SMUI:action={copy}>
                <Graphic class="material-icons">content_copy</Graphic>
                <Text>Copy JSON</Text>
            </Item>
            <Item on:SMUI:action={() => dispatch('delete', link)}>
                <Graphic class="material-icons">delete_forever</Graphic>
                <Text>Remove link</Text>
            </Item>
        </List>
    </Menu>
</Clipboard>
</div>