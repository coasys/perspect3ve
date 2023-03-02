<script lang="ts">
    import Textfield from '@smui/textfield';
    import Card, { Content, Actions, ActionButtons } from '@smui/card';
    import Button, { Label, Icon as ButtonIcon } from '@smui/button';

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let label
    export let value
</script>

<Card variant="outlined">
    <Content>
        <Textfield
            class="shaped-outlined"
            variant="outlined"
            bind:value={value}
            label={label}
            style="width: 100%;"
        ></Textfield>
    </Content>
    <Actions>
        <ActionButtons>
            <Button variant="outlined" on:click={()=>dispatch('pick', label.toLowerCase())}>
                <ButtonIcon class="material-icons">adjust</ButtonIcon>
                <Label>Pick</Label>
            </Button>
            <Button variant="outlined" on:click={()=>dispatch('create', label.toLowerCase())}>
                <ButtonIcon class="material-icons">add</ButtonIcon>
                <Label>Create</Label>
            </Button>
        </ActionButtons>
    </Actions>
</Card>

