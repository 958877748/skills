Editor.Panel.extend({
  style: `
    .container {
      padding: 10px;
    }
    .status {
      color: #090;
    }
  `,
  template: `
    <div class="container">
      <h2>CLI Helper</h2>
      <p class="status">Status: Running</p>
      <p>Port: 7455</p>
    </div>
  `,
  ready() {
    console.log('[CLI Helper] Panel ready');
  }
});
