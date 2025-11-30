<script lang="ts">
  interface Props {
    onReveal: () => void;
    disabled?: boolean;
  }

  let { onReveal, disabled = false }: Props = $props();
</script>

<button
  type="button"
  class="hint-button"
  onclick={onReveal}
  disabled={disabled}
  aria-label="Reveal a letter hint"
>
  <span class="hint-icon" aria-hidden="true">💡</span>
  <span>Reveal Letter</span>
</button>

<style>
  .hint-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: clamp(0.875rem, 2.5vw, 1rem);
    font-weight: 600;
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-button-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .hint-button:hover:not(:disabled) {
    background: var(--color-button-hover);
    border-color: var(--color-primary);
  }

  .hint-button:active:not(:disabled) {
    transform: scale(0.98);
  }

  .hint-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hint-icon {
    font-size: 1.25em;
  }

  @media (prefers-reduced-motion: reduce) {
    .hint-button {
      transition: none;
    }

    .hint-button:active {
      transform: none;
    }
  }
</style>
