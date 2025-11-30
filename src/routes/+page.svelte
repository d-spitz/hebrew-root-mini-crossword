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

  let currentFocusedCell = $state<{ row: number; col: number } | null>(null);
  let showShareModal = $state(false);

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

    gameStore.saveGame();
  });

  function handleCellInput(row: number, col: number, value: string) {
    gameStore.setCellValue(row, col, value);
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

  function handleRevealHint() {
    gameStore.revealRandomEmptyCell();
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
  <Header streak={gameStore.stats.streak} hintsUsed={gameStore.hintsUsed} />

  <div class="game-container">
    <div class="game-info">
      <Timer seconds={gameStore.timer} />
    </div>

    {#if gameStore.grid.length > 0}
      <Grid grid={gameStore.grid} onCellInput={handleCellInput} />
    {/if}

    <Keyboard onLetterClick={handleKeyboardLetterClick} />

    <div class="controls">
      <HintButton onReveal={handleRevealHint} disabled={!hasEmptyCells()} />
    </div>
  </div>

  <ShareModal
    isOpen={showShareModal}
    puzzleId={gameStore.currentPuzzle?.id ?? 0}
    timeSeconds={gameStore.timer}
    hintsUsed={gameStore.hintsUsed}
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
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-block: 1.5rem;
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
</style>
