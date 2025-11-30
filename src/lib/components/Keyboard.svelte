<script lang="ts">
  import { getHebrewKeyboardRegular } from '../utils/hebrew';

  interface Props {
    onLetterClick: (letter: string) => void;
  }

  let { onLetterClick }: Props = $props();

  // Hebrew keyboard with only regular forms (no final forms)
  const hebrewKeyboard = getHebrewKeyboardRegular();

  function handleClick(letter: string) {
    onLetterClick(letter);
  }
</script>

<div class="keyboard" role="group" aria-label="Hebrew keyboard">
  {#each hebrewKeyboard as row}
    <div class="keyboard-row">
      {#each row as letter}
        <button
          type="button"
          class="key"
          onclick={() => handleClick(letter)}
          aria-label={`Letter ${letter}`}
        >
          {letter}
        </button>
      {/each}
    </div>
  {/each}
</div>

<style>
  .keyboard {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    max-width: min(100%, 600px);
    margin-inline: auto;
  }

  .keyboard-row {
    display: flex;
    gap: clamp(0.25rem, 1vw, 0.5rem);
    justify-content: center;
  }

  .key {
    min-width: clamp(1.75rem, 4vw, 2.5rem);
    height: clamp(2.5rem, 6vw, 3.5rem);
    padding-inline: clamp(0.25rem, 1vw, 0.5rem);
    font-size: clamp(1rem, 3vw, 1.25rem);
    font-weight: 600;
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-key-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }

  .key:hover {
    background: var(--color-key-hover);
    border-color: var(--color-primary);
  }

  .key:active {
    transform: scale(0.95);
    background: var(--color-primary);
    color: white;
  }

  @media (prefers-reduced-motion: reduce) {
    .key {
      transition: none;
    }

    .key:active {
      transform: none;
    }
  }
</style>
