<script lang="ts">
    import { Literal, PerspectiveProxy } from '@perspect3vism/ad4m'
    import DataTable, {Body, Row, Cell} from '@smui/data-table';
    import Textfield from '@smui/textfield'
    import Button, {Label} from '@smui/button';
    import Card, {Content, PrimaryAction, Media, MediaContent, Actions, ActionButtons, ActionIcons} from '@smui/card';
    import emailValidator from 'email-validator'
    import md5 from 'md5'

    let firstName = "loading..."
    let lastName = "loading..."
    let email = "loading..."

    export let agentPerspective: PerspectiveProxy
    export let did: string

    async function populateUiFromPerspective() {
      try {
        firstName = Literal.fromUrl(await agentPerspective.getSingleTarget({source: did, predicate: 'foaf://givenName'})).get()
      }catch(e) {
        firstName = "<not set>"
      }

      try {
        lastName = Literal.fromUrl(await agentPerspective.getSingleTarget({source: did, predicate: 'foaf://familyName'})).get()
      }catch(e) {
        lastName = "<not set>"
      }

      try {
        email = Literal.fromUrl(await agentPerspective.getSingleTarget({source: did, predicate: 'foaf://mbox'})).get()
      }catch(e) {
        email = "<not set>"
      }
    }

    async function save() {
      await agentPerspective.setSingleTarget({source: did, predicate: 'foaf://givenName', target: Literal.from(firstName).toUrl()})
      await agentPerspective.setSingleTarget({source: did, predicate: 'foaf://familyName', target: Literal.from(lastName).toUrl()})
      await agentPerspective.setSingleTarget({source: did, predicate: 'foaf://mbox', target: Literal.from(email).toUrl()})
    }

    $: if(agentPerspective)
      populateUiFromPerspective()
</script>

<Card style="width: 360px;">
    <PrimaryAction>
      <Media aspectRatio="square" >
        <MediaContent>
          {#if !emailValidator.validate(email) }
            <div>Enter email for gravatar image</div>
          {:else}
            <img src="http://www.gravatar.com/avatar/{md5(email)}?s=360" alt="gravatar">
          {/if}
        </MediaContent>
      </Media>
      <Content class="mdc-typography--body2">
        <DataTable>
            <Body>
                <Row>
                    <Cell>First name:</Cell>
                    <Cell><Textfield bind:value={firstName} label="First name" /></Cell>
                </Row>
                <Row>
                  <Cell>Last name:</Cell>
                  <Cell><Textfield bind:value={lastName} label="Last name" /></Cell>
              </Row>
                <Row>
                    <Cell>Email:</Cell>
                    <Cell><Textfield bind:value={email} label="Email" /></Cell>
                </Row>
            </Body>
        </DataTable>
      </Content>
    </PrimaryAction>
    <Actions>
      <ActionButtons>
        <Button on:click={save}>
            <Label>Save</Label>
        </Button>
      </ActionButtons>
    </Actions>
  </Card>


  