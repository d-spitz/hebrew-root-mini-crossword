<script lang="ts">
  import { normalizeLetter } from '../utils/hebrew';

  interface Props {
    value: string;
    isPrefilled: boolean;
    isRevealed: boolean;
    isFocused: boolean;
    isInvalid?: boolean;
    row: number;
    col: number;
    onInput: (value: string) => void;
    onFocus: () => void;
  }

  let {
    value = '',
    isPrefilled = false,
    isRevealed = false,
    isFocused = false,
    isInvalid = false,
    row,
    col,
    onInput,
    onFocus
  }: Props = $props();

  let inputElement = $state<HTMLInputElement | null>(null);

  // Focus the input when this cell is focused
  $effect(() => {
    if (isFocused && inputElement && !isPrefilled) {
      inputElement.focus();
    }
  });

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const inputValue = target.value;

    // If empty, clear the cell
    if (!inputValue) {
      onInput('');
      return;
    }

    // Get the last character typed (in case of paste or multi-char input)
    const newValue = inputValue.slice(-1);

    // Only allow Hebrew characters
    if (!/[\u0590-\u05FF]/.test(newValue)) {
      target.value = value; // Restore previous value
      return;
    }

    // Normalize final forms to regular forms and update
    const normalized = normalizeLetter(newValue);
    target.value = normalized; // Set to single normalized character
    onInput(normalized);
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Allow backspace/delete to clear
    if (event.key === 'Backspace' || event.key === 'Delete') {
      onInput('');
      event.preventDefault();
    }
  }
</script>

<input
  bind:this={inputElement}
  type="text"
  maxlength="1"
  {value}
  readonly={isPrefilled}
  disabled={isPrefilled}
  lang="he"
  dir="rtl"
  class="cell"
  class:prefilled={isPrefilled}
  class:revealed={isRevealed}
  class:focused={isFocused}
  class:invalid={isInvalid}
  oninput={handleInput}
  onkeydown={handleKeyDown}
  onfocus={onFocus}
  aria-label={`Row ${row + 1}, Column ${col + 1}`}
  aria-readonly={isPrefilled}
/>

<style>
  .cell {
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    font-size: clamp(1.5rem, 5vw, 2rem);
    font-weight: 600;
    text-align: center;
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-cell-bg);
    color: var(--color-text);
    caret-color: transparent;
    transition: all 0.15s ease;
  }

  .cell:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-faint);
  }

  .cell.prefilled {
    background: var(--color-prefilled-bg);
    color: var(--color-prefilled-text);
    cursor: not-allowed;
  }

  .cell.revealed {
    background: var(--color-revealed-bg);
    color: var(--color-revealed-text);
  }

  .cell.invalid {
    border-color: var(--color-error);
    animation: shake 0.3s ease;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .cell {
      transition: none;
    }

    .cell.invalid {
      animation: none;
    }
  }
</style>
