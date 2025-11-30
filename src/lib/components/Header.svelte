<script lang="ts">
  interface Props {
    streak?: number;
    hintsUsed?: number;
  }

  let { streak = 0, hintsUsed = 0 }: Props = $props();
</script>

<header class="header">
  <h1>Hebrew Root Mini Crossword</h1>

  <div class="stats">
    {#if streak > 0}
      <div class="stat" aria-label={`${streak} day streak`}>
        <span class="stat-icon" aria-hidden="true">🔥</span>
        <span class="stat-value">{streak}</span>
      </div>
    {/if}

    {#if hintsUsed > 0}
      <div class="stat" aria-label={`${hintsUsed} hints used`}>
        <span class="stat-icon" aria-hidden="true">💡</span>
        <span class="stat-value">{hintsUsed}</span>
      </div>
    {/if}
  </div>
</header>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 2px solid var(--color-border);
  }

  h1 {
    font-size: clamp(1.25rem, 4vw, 1.75rem);
    font-weight: 700;
    margin: 0;
    color: var(--color-text);
  }

  .stats {
    display: flex;
    gap: 1rem;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: clamp(0.875rem, 2.5vw, 1rem);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .stat-icon {
    font-size: 1.25em;
  }

  .stat-value {
    font-variant-numeric: tabular-nums;
  }
</style>
