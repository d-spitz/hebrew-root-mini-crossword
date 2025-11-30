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
  }

  let { grid, onCellInput }: Props = $props();

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
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="grid" role="grid" aria-label="Puzzle grid" dir="rtl">
  {#each grid as row, rowIndex}
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
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(3rem, 1fr));
    gap: clamp(0.5rem, 2vw, 0.75rem);
    max-width: min(90vw, 400px);
    margin-inline: auto;
    padding: 1rem;
  }
</style>
