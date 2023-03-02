<script>
  import Nav from './Nav.svelte';
  import MainView from './MainView.svelte';
  import PropertiesBrowser from './PropertiesBrowser.svelte';

  let selected = 'home'; // default selected nav item

  function handleSelect(event) {
    selected = event.detail;
  }
</script>

<div class="container">
  <div class="nav">
    <Nav selected={selected} onSelect={handleSelect} />
  </div>
  <main>
    <MainView />
  </main>
    
  <div class="properties-browser">
    <PropertiesBrowser />
  </div>
</div>

<style>
  .container {
    display: grid;
    grid-template-columns: 120px 1fr 340px;
    grid-template-rows: 1fr;
    height: 100vh;

  }

  .nav {
    flex: 0 0 40px;
  }

  .properties-browser {
    flex: 0 0 100px;
  }

  main {
    height: 100%;
    width: 100%-460px;
    background-color: #ffffff;
  }

</style>