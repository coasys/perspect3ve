<script lang="ts">
    import { getContext, createEventDispatcher } from 'svelte';
    import Tab, { Icon, Label } from '@smui/tab';
    import TabBar from '@smui/tab-bar';
    import Textfield, { Textarea } from '@smui/textfield';
    import Button, { Label as ButtonLabel  } from '@smui/button';
    import { Literal } from '@perspect3vism/ad4m';
    import Radio from '@smui/radio';
    import FormField from '@smui/form-field';
    import type { Ad4mClient } from '@perspect3vism/ad4m'
    import Autocomplete from '@smui-extra/autocomplete';
    import iconComponentFromString from './iconComponentFromString';

    const dispatch = createEventDispatcher()
    const ad4m: Ad4mClient = getContext('ad4mClient')
    let languages

    async function getLanguages() {
        languages = await ad4m.languages.byFilter('expressionUI')
    }
    getLanguages()

    /*
    let languageIcons = {
        'note-ipfs': 'note',
        'url-iframe': 'link',
        'agent-expression-store': 'account_circle'
    }*/

    let tabs = [
        { k: 1, label: 'Literal', icon: 'text_snippet' },
        { k: 2, label: 'Dynamic', icon: 'waves' }
    ]

    let active = tabs[0]
    let literalType = 'string'
    let literalInput = ''
    let literalValue = ''
    let literalError

    export function reset() {
        literalType = 'string'
        literalInput = ''
        literalValue = ''
        literalError = undefined
    }

    $: if(literalInput){
        literalValue = updateLiteralValue(literalInput)
    }
    
    $: if(literalType) {
        literalValue = updateLiteralValue(literalInput)
    }

    function updateLiteralValue(input) {
        let value
        literalError = undefined
        try{
            switch(literalType) {
                case 'string': 
                    value = input
                    break
                case 'number': 
                    value = parseFloat(input)
                    if(isNaN(value)) {
                        literalError = "Not a number"
                    }
                    break
                case 'object':
                    value = JSON.parse(input)
                    break
            }
        }catch(e) {
            literalError = e
            return literalValue
        }
        return value
    }

    function createLiteral() {
        let literal = Literal.from(literalValue)
        console.log(literal.toUrl())
        dispatch('expression-created', literal.toUrl())
    }


    let selectedLanguageName = ''
    let constructorIconComponents = {}
    let constructorContainer

    $: if(selectedLanguageName) {
        let language = languages.find(l=>l.name === selectedLanguageName)
        if(language) 
            createExpressionConstructorIcon(language)
    }

    async function createExpressionConstructorIcon(lang) {
        console.log("Create expression:", lang, JSON.stringify(lang))
        if(!constructorIconComponents[lang.name]) {
            const language = await ad4m.languages.byAddress(lang.address)
            const code = language.constructorIcon.code
            const ConstructorIcon = iconComponentFromString(code, lang.name)
            constructorIconComponents[lang.name] = ConstructorIcon
            customElements.define(lang.name+"-constructor", ConstructorIcon);
        }

        const container = constructorContainer
        container.innerHTML = ''
        const constructorIcon = new constructorIconComponents[lang.name]()
        constructorIcon.commitExpression = async (content) => {
            commitExpression(lang, content, container)
        }
        constructorIcon.discard = () => {
            container.innerHTML = ''
        }
        
        container.appendChild(constructorIcon)
    }

    async function commitExpression(lang, content, container) {
        const exprURL = await ad4m.expression.create(JSON.stringify(content), lang.address)
        console.log("Created new expression:", exprURL)
        dispatch('expression-created', exprURL)
        container.innerHTML = ''
    }
</script>

<div class="header">
    <TabBar {tabs} let:tab key={(tab) => tab.k} bind:active>
        <Tab
            {tab}
            stacked={true}
            indicatorSpanOnlyContent={true}
            tabIndicator$transition="fade"
            >
            <Icon class="material-icons">{tab.icon}</Icon>
            <Label>{tab.label}</Label>
        </Tab>
    </TabBar>
</div>

<div class="content1">
    {#if active.label == 'Literal' }
        <div class="header">
            <FormField>
                <Radio bind:group={literalType} value='string'/>
                <Icon class="material-icons">text_format</Icon>
                <span slot="label">String</span>
            </FormField>
            <FormField>
                <Radio bind:group={literalType} value='number'/>
                <Icon class="material-icons">pin</Icon>
                <span slot="label">Number</span>
            </FormField>
            <FormField>
                <Radio bind:group={literalType} value='object'/>
                <Icon class="material-icons">data_object</Icon>
                <span slot="label">Object</span>
            </FormField>
        </div>
        <div class="content2">
            {#if literalType != 'object'}
                <Textfield
                    class="shaped-outlined"
                    bind:value={literalInput}
                    variant="outlined"
                    label="Literal Value"
                ></Textfield>
            {:else}
                <Textarea
                    class="shaped-outlined"
                    bind:value={literalInput}
                    variant="outlined"
                    label="Literal Value"
                ></Textarea>
            {/if}
            {#if literalError}
                <div class="error">{literalError}</div>
            {/if}
            <p></p>
            <Button variant="raised" on:click={createLiteral} disabled={literalError}>
                <ButtonLabel>Ok</ButtonLabel>
            </Button>
        </div>
    {:else}
        <div class="dynamic-content">
            <span>Select Language:</span>
            {#if languages}
                <Autocomplete
                    bind:value={selectedLanguageName}
                    options={languages.map(l=>l.name)}
                    label="Language name"
                    textfield$variant="outlined"
                ></Autocomplete>
            {/if}
            <div bind:this={constructorContainer} class="constructor-container"></div>
        </div>
    {/if}
</div>

<style>
    .dynamic-content {
        width: 500px;
        height: 600px;
    }
</style>