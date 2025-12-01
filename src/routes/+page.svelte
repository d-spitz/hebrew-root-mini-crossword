<script lang="ts">
  import { onMount } from "svelte";
  import { gameStore } from "$lib/stores/game.svelte";
  import { getTodaysPuzzle } from "$lib/utils/puzzle-selector";
  import Header from "$lib/components/Header.svelte";
  import Grid from "$lib/components/Grid.svelte";
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

    // If game was already completed, show share modal
    if (gameStore.status === "completed") {
      showShareModal = true;
    }
  });

  // Watch for game completion
  $effect(() => {
    if (gameStore.isComplete() && gameStore.status !== "completed") {
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
    gameStore.status; // Track status changes

    gameStore.saveGame();
  });

  function handleCellInput(row: number, col: number, value: string) {
    gameStore.setCellValue(row, col, value);
  }

  function handleCellFocus(row: number, col: number) {
    currentFocusedCell = { row, col };
  }

  function handleRevealHint() {
    if (!currentFocusedCell) return;

    const { row, col } = currentFocusedCell;
    gameStore.revealFocusedCell(row, col);
  }

  function handleRevealRowHint(rowIndex: number) {
    gameStore.revealSemanticHint("row", rowIndex);
    semanticHintMode = false; // Turn off mode after revealing
  }

  function handleRevealColHint(colIndex: number) {
    gameStore.revealSemanticHint("col", colIndex);
    semanticHintMode = false; // Turn off mode after revealing
  }

  function toggleSemanticHintMode() {
    semanticHintMode = !semanticHintMode;
  }

  function handleCloseModal() {
    showShareModal = false;
  }

  const canRevealFocusedCell = $derived(() => {
    if (!currentFocusedCell) return false;
    if (!gameStore.grid || gameStore.grid.length === 0) return false;

    const { row, col } = currentFocusedCell;
    const cell = gameStore.grid[row][col];

    return !cell.isPrefilled && !cell.isRevealed && cell.value === "";
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

  <div class="game-container" inert={gameStore.status === "completed"}>
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
        {semanticHintMode}
      />
    {/if}

    <div class="controls">
      <HintButton
        onReveal={handleRevealHint}
        disabled={!canRevealFocusedCell()}
      />
      <button
        type="button"
        class="hint-button"
        class:active={semanticHintMode}
        onclick={toggleSemanticHintMode}
        aria-label={semanticHintMode
          ? "Cancel reveal meaning"
          : "Reveal row/column meaning"}
      >
        <span class="hint-icon" aria-hidden="true">📖</span>
        <span>{semanticHintMode ? "Cancel" : "Meaning"}</span>
      </button>
    </div>

    <SemanticHints hints={gameStore.semanticHints} />
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
    min-block-size: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .game-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
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
  }

  .hint-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
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
