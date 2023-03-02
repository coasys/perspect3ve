<script lang="ts">
    import Menu from '@smui/menu';
    import List, {Item, Text, Graphic} from '@smui/list';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let languages
    export let languageIcons

    let menu
    let anchor
    let anchorX
    let anchorY

    export function open(x, y) {
        anchorX = x
        anchorY = y
        menu.setOpen(true)
    }

</script>

<div class="anchor" bind:this={anchor} style={`position: absolute; left: ${anchorX}px; top: ${anchorY}px;`}>
    <Menu bind:this={menu} bind:anchorElement={anchor}>
        <List>
            {#each languages as lang}
                <Item on:SMUI:action={() => dispatch('language-clicked', lang)}>
                    <Graphic class="material-icons">{languageIcons[lang.name]}</Graphic>
                    <Text>Create <b>{lang.name}</b> expression</Text>
                    
                </Item>
            {/each}
        </List>
    </Menu>
</div>
