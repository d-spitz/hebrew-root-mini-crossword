<script lang="ts">
  import Cell from './Cell.svelte';

  interface CellData {
    value: string;
    isPrefilled: boolean;
    isRevealed: boolean;
  }

  interface Props {
    grid: CellData[][];
    onCellInput: (row: number, col: number, value: string) => void;
    onRevealRowHint?: (rowIndex: number) => void;
    onRevealColHint?: (colIndex: number) => void;
    revealedHints?: Set<string>;
    semanticHintMode?: boolean;
  }

  let { grid, onCellInput, onRevealRowHint, onRevealColHint, revealedHints = new Set(), semanticHintMode = false }: Props = $props();

  let focusedCell = $state<{ row: number; col: number }>({ row: 0, col: 0 });

  // Find first non-prefilled cell on mount
  $effect(() => {
    if (grid.length > 0) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (!grid[row][col].isPrefilled) {
            focusedCell = { row, col };
            return;
          }
        }
      }
    }
  });

  function handleCellInput(row: number, col: number, value: string) {
    onCellInput(row, col, value);

    // Auto-advance to next empty cell
    if (value !== '') {
      moveToNextCell(row, col);
    }
  }

  function moveToNextCell(currentRow: number, currentCol: number) {
    // Try to find next non-prefilled cell
    let row = currentRow;
    let col = currentCol + 1;

    while (row < 3) {
      while (col < 3) {
        if (!grid[row][col].isPrefilled && grid[row][col].value === '') {
          focusedCell = { row, col };
          return;
        }
        col++;
      }
      row++;
      col = 0;
    }

    // If no empty cells found, try wrapping around
    for (row = 0; row < 3; row++) {
      for (col = 0; col < 3; col++) {
        if (!grid[row][col].isPrefilled && grid[row][col].value === '') {
          focusedCell = { row, col };
          return;
        }
      }
    }
  }

  function handleCellFocus(row: number, col: number) {
    focusedCell = { row, col };
  }

  function handleKeyDown(event: KeyboardEvent) {
    const { row, col } = focusedCell;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (row > 0) focusedCell = { row: row - 1, col };
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (row < 2) focusedCell = { row: row + 1, col };
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (col > 0) focusedCell = { row, col: col - 1 };
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (col < 2) focusedCell = { row, col: col + 1 };
        break;
    }
  }

  function handleRowHintClick(rowIndex: number) {
    if (onRevealRowHint) {
      onRevealRowHint(rowIndex);
    }
  }

  function handleColHintClick(colIndex: number) {
    if (onRevealColHint) {
      onRevealColHint(colIndex);
    }
  }

  function isRowRevealed(rowIndex: number): boolean {
    return revealedHints.has(`row-${rowIndex}`);
  }

  function isColRevealed(colIndex: number): boolean {
    return revealedHints.has(`col-${colIndex}`);
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="grid-container" dir="rtl">
  <!-- Column labels -->
  <div class="column-labels" class:visible={semanticHintMode}>
    <div class="corner-spacer"></div>
    {#each [0, 1, 2] as colIndex}
      <button
        type="button"
        class="col-label"
        class:revealed={isColRevealed(colIndex)}
        onclick={() => handleColHintClick(colIndex)}
        disabled={!semanticHintMode}
        aria-label={isColRevealed(colIndex)
          ? `Column ${colIndex + 1} meaning already revealed`
          : `Reveal meaning for column ${colIndex + 1}`}
      >
        {colIndex + 1}
      </button>
    {/each}
    <div class="corner-spacer"></div>
  </div>

  <!-- Grid rows with row labels -->
  {#each grid as row, rowIndex}
    <div class="grid-row">
      <button
        type="button"
        class="row-label"
        class:visible={semanticHintMode}
        class:revealed={isRowRevealed(rowIndex)}
        onclick={() => handleRowHintClick(rowIndex)}
        disabled={!semanticHintMode}
        aria-label={isRowRevealed(rowIndex)
          ? `Row ${rowIndex + 1} meaning already revealed`
          : `Reveal meaning for row ${rowIndex + 1}`}
      >
        {rowIndex + 1}
      </button>
      <div class="cells" dir="rtl">
        {#each row as cell, colIndex}
          <Cell
            value={cell.value}
            isPrefilled={cell.isPrefilled}
            isRevealed={cell.isRevealed}
            isFocused={focusedCell.row === rowIndex && focusedCell.col === colIndex}
            row={rowIndex}
            col={colIndex}
            onInput={(value) => handleCellInput(rowIndex, colIndex, value)}
            onFocus={() => handleCellFocus(rowIndex, colIndex)}
          />
        {/each}
      </div>
      <div class="row-spacer"></div>
    </div>
  {/each}

  <!-- Bottom spacer row -->
  <div class="bottom-spacer"></div>
</div>

<style>
  .grid-container {
    max-width: min(90vw, 450px);
    margin-inline: auto;
    padding: 1rem;
  }

  .column-labels {
    display: grid;
    grid-template-columns: 2rem repeat(3, minmax(3rem, 1fr)) 2rem;
    gap: clamp(0.5rem, 2vw, 0.75rem);
    margin-block-end: 0.5rem;
    visibility: hidden;
  }

  .column-labels.visible {
    visibility: visible;
  }

  .col-label {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    background: var(--color-button-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s;
  }

  .col-label:hover:not(.revealed):not(:disabled) {
    background-color: var(--color-primary-faint);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .col-label.revealed {
    opacity: 0.5;
    cursor: default;
  }

  .col-label:disabled {
    cursor: default;
  }

  .col-label:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .grid-row {
    display: grid;
    grid-template-columns: 2rem 1fr 2rem;
    gap: clamp(0.5rem, 2vw, 0.75rem);
    margin-block-end: clamp(0.5rem, 2vw, 0.75rem);
  }

  .grid-row:last-child {
    margin-block-end: 0;
  }

  .bottom-spacer {
    /* Matches the approximate height of column labels row */
    min-height: 2rem;
    margin-block-start: 0.5rem;
  }

  .row-label {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    background: var(--color-button-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s;
    visibility: hidden;
  }

  .row-label.visible {
    visibility: visible;
  }

  .row-label:hover:not(.revealed):not(:disabled) {
    background-color: var(--color-primary-faint);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .row-label.revealed {
    opacity: 0.5;
    cursor: default;
  }

  .row-label:disabled {
    cursor: default;
  }

  .row-label:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .cells {
    display: grid;
    grid-template-columns: repeat(3, minmax(3rem, 1fr));
    gap: clamp(0.5rem, 2vw, 0.75rem);
  }
</style>
