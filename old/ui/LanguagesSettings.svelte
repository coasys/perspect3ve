<script lang="ts">
    import { getContext } from "svelte";
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import Button from '@smui/button'
    import type { LanguageRef } from "@perspect3vism/ad4m";
    import iconComponentFromString from "./iconComponentFromString";

    const ad4m = getContext('ad4mClient')

    let languages: LanguageRef[] = []
    let settingsIconConstructors = new Map()
    let settingsIcons = {}

    async function init() {
        languages = await ad4m.languages.all()
        await checkLanguagesForSettingsIcon()
        createCustomSettingsIcons()
    }

    init()

    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }
    
    async function checkLanguagesForSettingsIcon() {
      await asyncForEach(languages, async lang => {
        const settingsComponentName = lang.name + '-settings'
        console.debug("CHecking for", settingsComponentName)
        const code = lang.settingsIcon?.code
        if(!code) {
          return
        }
        if(!settingsIconConstructors.get(lang)) {
          console.debug("not there yet...")
          let SettingsIcon = customElements.get(settingsComponentName)
          if(!SettingsIcon) {
              console.debug("not in registry yet...")
              SettingsIcon = iconComponentFromString(code, settingsComponentName)
              customElements.define(settingsComponentName, SettingsIcon);
          } 
          settingsIconConstructors.set(lang, SettingsIcon)
        }  
      })
    }

    async function createCustomSettingsIcons() {
      for(const item of settingsIconConstructors) {
        const lang = item[0]
        const iconConstructor = item[1]
        const icon = new iconConstructor()
        console.log("lang", lang)
        console.log("icon", icon)
        document.getElementById(langToSettingsContainer(lang)).appendChild(icon)
        settingsIcons[lang.address] = icon
        icon.settings = JSON.parse(lang.settings)
      }
    }

    function langToSettingsContainer(lang) {
      const address = lang.address ? lang.address : lang
      return `${address}-settings-icon`
    }

    function updateSettings(lang) {
      ad4m.languages.writeSettings(lang.address, JSON.stringify(settingsIcons[lang.address].settings))
    }
</script>

<DataTable>
    <Head>
      <Row>
        <Cell>Name</Cell>
        <Cell>Hash</Cell>
        <Cell>Settings</Cell>
      </Row>
    </Head>
    <Body>
      {#each languages as lang}
        <Row>
          <Cell>{lang.name}</Cell>
          <Cell>{lang.address}</Cell>
          <Cell>
              <div id={langToSettingsContainer(lang)}></div>
              {#if settingsIcons[lang.address]}
                <Button on:click={()=>updateSettings(lang)}>Update</Button>
              {/if}
          </Cell>
        </Row>
      {/each}
    </Body>
  </DataTable>