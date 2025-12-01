<script lang="ts">
interface SemanticHint {
  key: string;
  type: 'row' | 'col';
  index: number;
  root: string;
  meaning: string;
}

interface Props {
  hints: SemanticHint[];
}

let { hints }: Props = $props();
</script>

  <details class="hints-details" open>
    <summary>
      Semantic Hints ({hints.length})
    </summary>
    <div class="semantic-hints" aria-label="Revealed meaning hints">
      {#each hints as hint (hint.key)}
        <div class="hint-item">
          <div class="hint-label">
            {hint.type === 'row' ? 'Row' : 'Column'} {hint.index + 1}
          </div>
          <div class="hint-meaning">{hint.meaning}</div>
        </div>
      {/each}
    </div>
  </details>

<style>
  .semantic-hints {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-hint-bg);
    border: 1px solid var(--color-hint-border);
    border-radius: var(--border-radius);
  }

  .hint-item {
    display: grid;
    gap: 0.25rem;
  }

  .hint-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-hint-text);
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .hint-meaning {
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .hints-details {
    border: 1px solid var(--color-hint-border);
    border-radius: var(--border-radius);
    background: var(--color-hint-bg);
  }

  .hints-details summary {
    padding: 1rem;
    font-weight: 600;
    color: var(--color-hint-text);
    cursor: pointer;
    user-select: none;
    list-style: none;
  }

  .hints-details summary::-webkit-details-marker {
    display: none;
  }

  .hints-details summary::before {
    content: '▶';
    display: inline-block;
    margin-inline-end: 0.5rem;
    transition: transform 0.2s;
  }

  .hints-details[open] summary::before {
    transform: rotate(90deg);
  }

  .hints-details .semantic-hints {
    border: none;
    border-block-start: 1px solid var(--color-hint-border);
    border-radius: 0;
    background: transparent;
  }

  @media (prefers-reduced-motion: reduce) {
    .hints-details summary::before {
      transition: none;
    }
  }
</style>
