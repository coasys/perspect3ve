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

    let expression
    let parentLink

    export function open(x, y, e, p) {
        expression = e
        parentLink = p
        anchorX = x
        anchorY = y
        menu.setOpen(true)
    }

</script>

<div class="anchor" bind:this={anchor} style={`position: absolute; left: ${anchorX}px; top: ${anchorY}px;`}>
    <Clipboard text={expression} let:copy>
    <Menu bind:this={menu} bind:anchorElement={anchor}>
        <List>
            <Item on:SMUI:action={copy}>
                <Graphic class="material-icons">content_copy</Graphic>
                <Text>Copy URL</Text>
            </Item>
            <Item on:SMUI:action={() => dispatch('switch-header-content', expression)}>
                <Graphic class="material-icons">qr_code</Graphic>
                <Text>Switch header/content</Text>
            </Item>
            <Item on:SMUI:action={() => dispatch('add-child', expression)}>
                <Graphic class="material-icons">add_circle_outline</Graphic>
                <Text>Create new expression as child</Text>
            </Item>
            <Item on:SMUI:action={() => dispatch('link', expression)}>
                <Graphic class="material-icons">link</Graphic>
                <Text>Create link to other expression</Text>
            </Item>
            <Item on:SMUI:action={() => dispatch('delete', expression)}>
                <Graphic class="material-icons">delete_forever</Graphic>
                <Text>Unlink expression</Text>
            </Item>
        </List>
    </Menu>
</Clipboard>
</div>