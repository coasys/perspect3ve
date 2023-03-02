<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Textfield, {Input} from '@smui/textfield';
	import FloatingLabel from '@smui/floating-label';
    import LineRipple from '@smui/line-ripple';
    import Button, {Label, Icon} from '@smui/button';
    import ExpressionIcon from './ExpressionIcon.svelte'
    import Switch from '@smui/switch';
    import FormField from '@smui/form-field';
    const dispatch = createEventDispatcher();

    let urlTemp
    let url
    let expression
    let plain = false

    function load() {
        url = urlTemp
    }

    function close() {
        dispatch('close')
    }

    function link() {
        dispatch('link-expresson', url)
        dispatch('close')
    }
</script>

<div>
    <span class="right">
        <Button class="right" on:click={close}>
            <Label>Close</Label>
            <Icon class="material-icons">close</Icon>
        </Button>
    </span>

    
    <Textfield fullwidth lineRipple={false} label="URL">
        <Input bind:value={urlTemp} id="input-url"/>
        <FloatingLabel for="input-name">Expression URL</FloatingLabel>
        <LineRipple />
    </Textfield>

    <div class="get-button">
        <Button variant="raised" on:click={load}>
            <Label>Get</Label>
        </Button>
    </div>
    

</div>

{#if url && url.length > 0}
    <FormField>
        <Switch bind:checked={plain} />
        <span slot="label">Show plain source</span>
    </FormField>
    <div class="expression-container">
        <ExpressionIcon expressionURL={url} plain={plain}></ExpressionIcon>
    </div>

    <div class="link-button">
        <Button variant="raised" on:click={link}>
            <Icon class="material-icons">add_to_drive</Icon>
            <Label>Link into Perspective</Label>
        </Button>
    </div>
{/if}

<style>
    .right {
        float: right;
    }

    .get-button {
        position: relative;
        right: 0;
        top: 10px;
    }

    .link-button {
        bottom: 20px;
        right: 30px;
        position: absolute;
    }

    .expression-container {
        margin-top: 20px;
        margin-left: auto;
        margin-right: auto;
        width: 1px
    }
</style>