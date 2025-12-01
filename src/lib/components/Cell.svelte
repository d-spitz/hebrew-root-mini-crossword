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

  $effect(() => {
    if (isFocused && inputElement && !isPrefilled) {
      inputElement.focus();
    }
  });

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const inputValue = target.value;

    if (!inputValue) {
      onInput('');
      return;
    }

    const newChar = inputValue.slice(-1);
    
    if (!/[\u0590-\u05FF]/.test(newChar)) {
      target.value = value;
      return;
    }

    const normalized = normalizeLetter(newChar);
    
    // Replace input value completely
    target.value = normalized;
    onInput(normalized);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      onInput('');
      event.preventDefault();
    }
  }

  function handleBeforeInput(event: InputEvent) {
    // When cell has a value, prevent adding more characters
    if (value && event.data && event.inputType === 'insertText') {
      event.preventDefault();
      
      // Replace with new character if it's Hebrew
      if (/[\u0590-\u05FF]/.test(event.data)) {
        const normalized = normalizeLetter(event.data);
        if (inputElement) {
          inputElement.value = normalized;
        }
        onInput(normalized);
      }
    }
  }
</script>

<input
  bind:this={inputElement}
  type="text"
  maxlength="1"
  pattern="[\u0590-\u05FF]"
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
  onbeforeinput={handleBeforeInput}
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