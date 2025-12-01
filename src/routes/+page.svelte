<script lang="ts">
  import { onMount } from "svelte";
  import { gameStore } from "$lib/stores/game.svelte";
  import { getTodaysPuzzle } from "$lib/utils/puzzle-selector";
  import Header from "$lib/components/Header.svelte";
  import Grid from "$lib/components/Grid.svelte";
  import Keyboard from "$lib/components/Keyboard.svelte";
  import Timer from "$lib/components/Timer.svelte";
  import HintButton from "$lib/components/HintButton.svelte";
  import ShareModal from "$lib/components/ShareModal.svelte";
  import SemanticHints from "$lib/components/SemanticHints.svelte";

  let currentFocusedCell = $state<{ row: number; col: number } | null>(null);
  let showShareModal = $state(false);
  let semanticHintMode = $state(false);

  onMount(() => {
    // Initialize game with today's puzzle
    const { puzzle, prefilled } = getTodaysPuzzle();
    gameStore.initializeGame(puzzle, prefilled);
  });

  // Watch for game completion
  $effect(() => {
    if (gameStore.isComplete()) {
      gameStore.completeGame();
      showShareModal = true;
    }
  });

  // Auto-save game state
  $effect(() => {
    // This effect runs whenever grid, timer, or hintsUsed change
    gameStore.grid; // Track grid changes
    gameStore.timer; // Track timer changes
    gameStore.hintsUsed; // Track hints changes
    gameStore.semanticHintsUsed; // Track semantic hints changes

    gameStore.saveGame();
  });

  function handleCellInput(row: number, col: number, value: string) {
    gameStore.setCellValue(row, col, value);
  }

  function handleCellFocus(row: number, col: number) {
    currentFocusedCell = { row, col };
  }

  function handleKeyboardLetterClick(letter: string) {
    // Find the currently focused cell or first empty cell
    if (currentFocusedCell) {
      const { row, col } = currentFocusedCell;
      if (!gameStore.grid[row][col].isPrefilled) {
        gameStore.setCellValue(row, col, letter);
      }
    } else {
      // Find first empty non-prefilled cell
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const cell = gameStore.grid[row][col];
          if (!cell.isPrefilled && cell.value === "") {
            gameStore.setCellValue(row, col, letter);
            return;
          }
        }
      }
    }
  }

  function handleBackspace() {
    if (currentFocusedCell) {
      const { row, col } = currentFocusedCell;
      if (!gameStore.grid[row][col].isPrefilled) {
        gameStore.setCellValue(row, col, '');
      }
    }
  }

  function handleRevealHint() {
    gameStore.revealRandomEmptyCell();
  }

  function handleRevealRowHint(rowIndex: number) {
    gameStore.revealSemanticHint('row', rowIndex);
    semanticHintMode = false; // Turn off mode after revealing
  }

  function handleRevealColHint(colIndex: number) {
    gameStore.revealSemanticHint('col', colIndex);
    semanticHintMode = false; // Turn off mode after revealing
  }

  function toggleSemanticHintMode() {
    semanticHintMode = !semanticHintMode;
  }

  function handleCloseModal() {
    showShareModal = false;
  }

  const hasEmptyCells = $derived(() => {
    if (!gameStore.grid || gameStore.grid.length === 0) return false;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = gameStore.grid[row][col];
        if (!cell.isPrefilled && cell.value === "") {
          return true;
        }
      }
    }
    return false;
  });
</script>

<svelte:head>
  <title>Hebrew Root Mini Crossword</title>
  <meta
    name="description"
    content="Daily Hebrew root mini crossword - solve the 3x3 grid!"
  />
</svelte:head>

<main>
  <Header
    streak={gameStore.stats.streak}
    hintsUsed={gameStore.hintsUsed}
    semanticHintsUsed={gameStore.semanticHintsUsed}
  />

  <div class="game-container">
    <div class="main-area">
      <div class="game-info">
        <Timer seconds={gameStore.timer} />
      </div>

      {#if gameStore.grid.length > 0}
        <Grid
          grid={gameStore.grid}
          onCellInput={handleCellInput}
          onCellFocus={handleCellFocus}
          onRevealRowHint={handleRevealRowHint}
          onRevealColHint={handleRevealColHint}
          revealedHints={gameStore.revealedSemanticHints}
          semanticHintMode={semanticHintMode}
        />
      {/if}

      <Keyboard onLetterClick={handleKeyboardLetterClick} onBackspace={handleBackspace} />

      <div class="controls">
        <HintButton onReveal={handleRevealHint} disabled={!hasEmptyCells()} />
        <button
          type="button"
          class="hint-button"
          class:active={semanticHintMode}
          onclick={toggleSemanticHintMode}
          aria-label={semanticHintMode ? "Cancel reveal meaning" : "Reveal row/column meaning"}
        >
          <span class="hint-icon" aria-hidden="true">📖</span>
          <span>{semanticHintMode ? "Cancel" : "Reveal Meaning"}</span>
        </button>
      </div>

      <!-- Mobile: hints below keyboard -->
      <div class="hints-mobile">
        <SemanticHints hints={gameStore.semanticHints} />
      </div>
    </div>

    <!-- Desktop: hints sidebar -->
    <aside class="hints-sidebar">
      <SemanticHints hints={gameStore.semanticHints} />
    </aside>
  </div>

  <ShareModal
    isOpen={showShareModal}
    puzzleId={gameStore.currentPuzzle?.id ?? 0}
    timeSeconds={gameStore.timer}
    hintsUsed={gameStore.hintsUsed}
    semanticHintsUsed={gameStore.semanticHintsUsed}
    streak={gameStore.stats.streak}
    grid={gameStore.grid}
    isAlternativeSolution={gameStore.isAlternativeSolution}
    alternativeSolutionsCount={gameStore.alternativeSolutionsCount()}
    onClose={handleCloseModal}
  />
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .game-container {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding-block: 1.5rem;
  }

  .main-area {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .game-info {
    display: flex;
    justify-content: center;
    padding-inline: 1rem;
  }

  .controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding-inline: 1rem;
    flex-wrap: wrap;
  }

  /* Mobile: show hints below keyboard, hide sidebar */
  .hints-mobile {
    display: block;
    padding-inline: 1rem;
  }

  .hints-sidebar {
    display: none;
  }

  /* Desktop: show sidebar, hide mobile hints */
  @media (min-width: 1024px) {
    .game-container {
      grid-template-columns: 1fr minmax(250px, 325px);
      max-width: 1400px;
      margin-inline: auto;
      gap: 1.5rem;
      padding-inline: 2rem;
    }

    .hints-mobile {
      display: none;
    }

    .hints-sidebar {
      display: block;
      position: sticky;
      top: 2rem;
      align-self: start;
      max-height: calc(100vh - 4rem);
      overflow-y: auto;
    }
  }

  .hint-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    font-weight: 600;
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-button-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s;
  }

  .hint-button:hover:not(:disabled) {
    background: var(--color-button-hover);
    border-color: var(--color-primary);
  }

  .hint-button.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
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
  }
</style>
