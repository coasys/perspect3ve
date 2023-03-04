<script>
  const item = {
    title: 'Sample Item',
    description: 'This is a sample item.',
    author: 'John Doe',
    timestamp: 'March 1, 2023'
  };

  const properties = [
    { name: 'Property 1', value: 'Value 1' },
    { name: 'Property 2', value: 'Value 2' },
    { name: 'Property 3', value: 'Value 3' }
  ];
</script>

<div class="properties-container">
  <div class="header">
    <div class="title">{item.title}</div>
    <div class="description">{item.description}</div>
    <div class="author">{item.author}</div>
    <div class="timestamp">{item.timestamp}</div>
  </div>
  <div class="properties">
    {#each properties as { name, value }}
      <div class="property">
        <div class="name">{name}</div>
        <div class="value">{value}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .properties-container {
    display: flex;
    flex-direction: column;
    width: 300px;
    background-color: #f5f5f5;
    padding: 20px;
  }

  .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
  }

  .title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .description {
    font-size: 14px;
    color: #888888;
    margin-bottom: 10px;
  }

  .author {
    font-size: 14px;
    color: #888888;
    margin-bottom: 5px;
  }

  .timestamp {
    font-size: 14px;
    color: #888888;
    margin-bottom: 10px;
  }

  .properties {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 10px;
  }

  .property {
    display: flex;
    flex-direction: column;
    border: 1px solid #cccccc;
    padding: 10px;
  }

  .name {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .value {
    font-size: 14px;
    color: #888888;
  }
</style>
