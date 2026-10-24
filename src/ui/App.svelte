<script lang="ts">
  import { appTitle } from '../core/app-info';
</script>

<main>
  <h1>Stammbaum</h1>
  <p data-testid="status">Diese Anwendung befindet sich noch in Entwicklung.</p>
  <p class="version">{appTitle()}</p>
</main>

<style>
  :global(html, body) {
    margin: 0;
    font-family: system-ui, 'Segoe UI', Roboto, Ubuntu, 'Helvetica Neue', Arial, sans-serif;
    background: #faf8f3;
    color: #2b2b2b;
  }
  main {
    max-width: 40rem;
    margin: 4rem auto;
    padding: 0 1.5rem;
    text-align: center;
  }
  .version {
    color: #888;
    font-size: 0.85rem;
  }
</style>
