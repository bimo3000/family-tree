<script lang="ts">
  import { findPerson } from '../core/model/queries';
  import type { PersonId } from '../core/model/types';
  import { loadExample } from './example';
  import DetailPanel from './panel/DetailPanel.svelte';
  import TreeView from './tree/TreeView.svelte';

  // Until the start screen and project files exist (slice S5), the app opens the embedded example.
  const project = loadExample();
  let selectedId = $state<PersonId | null>(null);
  const selected = $derived(selectedId ? findPerson(project, selectedId) : undefined);
  let tree = $state<TreeView>();

  function goto(id: PersonId) {
    selectedId = id;
    tree?.centre(id);
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape') selectedId = null;
  }}
/>

<header class="topbar">
  <h1 class="proj">{project.name}</h1>
</header>
<main>
  <TreeView bind:this={tree} {project} {selectedId} onselect={(id) => (selectedId = id)} />
  {#if selected}
    <DetailPanel {project} person={selected} ongoto={goto} onclose={() => (selectedId = null)} />
  {/if}
</main>

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    min-height: 60px;
    background: var(--bar-bg);
    border-bottom: 1px solid var(--bar-border);
    flex: none;
    position: relative;
    z-index: 20;
  }
  .proj {
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
    padding: 6px 10px;
  }
  main {
    flex: 1;
    display: flex;
    min-height: 0;
  }
</style>
