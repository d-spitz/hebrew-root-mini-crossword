/**
 * Game State Store
 * Central state management using Svelte 5 runes
 */

import { getSolutionKey, validateGrid } from '../utils/validator';
import { roots } from '$lib/roots';

interface Cell {
  value: string;           // Current letter (empty string if not filled)
  isPrefilled: boolean;    // Is this a clue cell?
  isRevealed: boolean;     // Was this revealed via hint?
}

interface Puzzle {
  id: number;
  grid: string[];          // The solution grid (3 rows)
  difficulty: number;
}

interface GameStats {
  streak: number;
  lastPlayed: string | null;
  completedPuzzles: Set<number>;
  alternativeSolutions: Map<number, Set<string>>;
}

type GameStatus = 'playing' | 'completed';

interface SemanticHint {
  key: string;
  type: 'row' | 'col';
  index: number;
  root: string;
  meaning: string;
}

const STORAGE_KEY_STATS = 'hebrew-crossword-stats';
const STORAGE_KEY_GAME = 'hebrew-crossword-current-game';

/**
 * Load stats from localStorage
 */
function loadStats(): GameStats {
  if (typeof window === 'undefined') {
    return { streak: 0, lastPlayed: null, completedPuzzles: new Set(), alternativeSolutions: new Map() };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_STATS);
    if (!stored) {
      return { streak: 0, lastPlayed: null, completedPuzzles: new Set(), alternativeSolutions: new Map() };
    }

    const parsed = JSON.parse(stored);
    const altSolutions = new Map();
    if (parsed.alternativeSolutions) {
      for (const [puzzleId, solutions] of Object.entries(parsed.alternativeSolutions)) {
        altSolutions.set(Number(puzzleId), new Set(solutions as string[]));
      }
    }

    return {
      streak: parsed.streak || 0,
      lastPlayed: parsed.lastPlayed || null,
      completedPuzzles: new Set(parsed.completedPuzzles || []),
      alternativeSolutions: altSolutions
    };
  } catch {
    return { streak: 0, lastPlayed: null, completedPuzzles: new Set(), alternativeSolutions: new Map() };
  }
}

/**
 * Save stats to localStorage
 */
function saveStats(stats: GameStats) {
  if (typeof window === 'undefined') return;

  try {
    const altSolutions: Record<number, string[]> = {};
    for (const [puzzleId, solutions] of stats.alternativeSolutions) {
      altSolutions[puzzleId] = Array.from(solutions);
    }

    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify({
      streak: stats.streak,
      lastPlayed: stats.lastPlayed,
      completedPuzzles: Array.from(stats.completedPuzzles),
      alternativeSolutions: altSolutions
    }));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

/**
 * Load current game from localStorage
 */
function loadCurrentGame(): { grid: Cell[][], timer: number, hintsUsed: number, semanticHintsUsed: number, revealedSemanticHints: Set<string>, puzzleId: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_GAME);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      grid: parsed.grid,
      timer: parsed.timer || 0,
      hintsUsed: parsed.hintsUsed || 0,
      semanticHintsUsed: parsed.semanticHintsUsed || 0,
      revealedSemanticHints: new Set(parsed.revealedSemanticHints || []),
      puzzleId: parsed.puzzleId
    };
  } catch {
    return null;
  }
}

/**
 * Save current game to localStorage
 */
function saveCurrentGame(grid: Cell[][], timer: number, hintsUsed: number, semanticHintsUsed: number, revealedSemanticHints: Set<string>, puzzleId: number) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify({
      grid,
      timer,
      hintsUsed,
      semanticHintsUsed,
      revealedSemanticHints: Array.from(revealedSemanticHints),
      puzzleId
    }));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

/**
 * Clear current game from localStorage
 */
function clearCurrentGame() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_GAME);
}

/**
 * Create the game state store
 */
export function createGameStore() {
  // Create a Map for O(1) root lookups
  const rootsMap = new Map(roots.map(r => [r.root, r.meaning]));

  // State
  let grid = $state<Cell[][]>([]);
  let currentPuzzle = $state<Puzzle | null>(null);
  let timer = $state(0);
  let hintsUsed = $state(0);
  let semanticHintsUsed = $state(0);
  let revealedSemanticHints = $state<Set<string>>(new Set());
  let status = $state<GameStatus>('playing');
  let stats = $state<GameStats>(loadStats());
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let isAlternativeSolution = $state(false);

  const isComplete = $derived(() => {
    if (grid.length === 0 || !currentPuzzle) return false;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (grid[row][col].value === '') return false;
      }
    }

    const gridValues = grid.map(row => row.map(cell => cell.value));
    return validateGrid(gridValues);
  });

  const isValid = $derived(() => true);

  const semanticHints = $derived.by((): SemanticHint[] => {
    if (!currentPuzzle) return [];

    const hints: SemanticHint[] = [];

    for (const key of revealedSemanticHints) {
      const [type, indexStr] = key.split('-');
      const index = parseInt(indexStr);

      let root: string;
      if (type === 'row') {
        root = currentPuzzle.grid[index];
      } else {
        // Extract column root
        root = currentPuzzle.grid[0][index] +
               currentPuzzle.grid[1][index] +
               currentPuzzle.grid[2][index];
      }

      const meaning = rootsMap.get(root) ?? 'Meaning not available';

      hints.push({
        key,
        type: type as 'row' | 'col',
        index,
        root,
        meaning
      });
    }

    return hints;
  });

  // Methods
  function initializeGame(puzzle: Puzzle, prefilledPositions: { row: number; col: number }[]) {
    currentPuzzle = puzzle;

    // Check if we have a saved game for this puzzle
    const savedGame = loadCurrentGame();
    if (savedGame && savedGame.puzzleId === puzzle.id) {
      grid = savedGame.grid;
      timer = savedGame.timer;
      hintsUsed = savedGame.hintsUsed;
      semanticHintsUsed = savedGame.semanticHintsUsed;
      revealedSemanticHints = savedGame.revealedSemanticHints;
    } else {
      grid = Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => ({
          value: '',
          isPrefilled: false,
          isRevealed: false
        }))
      );

      // Set prefilled cells
      for (const pos of prefilledPositions) {
        const correctValue = puzzle.grid[pos.row][pos.col];
        grid[pos.row][pos.col] = {
          value: correctValue,
          isPrefilled: true,
          isRevealed: false
        };
      }

      timer = 0;
      hintsUsed = 0;
      semanticHintsUsed = 0;
      revealedSemanticHints = new Set();
    }

    status = 'playing';
    startTimer();
  }

  function setCellValue(row: number, col: number, value: string) {
    if (grid[row][col].isPrefilled) return;

    grid[row][col] = {
      ...grid[row][col],
      value
    };
  }

  function revealCell(row: number, col: number) {
    if (!currentPuzzle) return;
    if (grid[row][col].isPrefilled) return;
    if (grid[row][col].value !== '') return; // Don't reveal already filled cells

    const correctValue = currentPuzzle.grid[row][col];
    grid[row][col] = {
      value: correctValue,
      isPrefilled: false,
      isRevealed: true
    };

    hintsUsed++;
  }

  function revealRandomEmptyCell() {
    // Find all empty, non-prefilled cells
    const emptyCells: { row: number; col: number }[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (!grid[row][col].isPrefilled && grid[row][col].value === '') {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) return;

    // Pick a random empty cell
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { row, col } = emptyCells[randomIndex];

    revealCell(row, col);
  }

  function revealSemanticHint(type: 'row' | 'col', index: number) {
    const key = `${type}-${index}`;

    // Don't re-count if already revealed
    if (revealedSemanticHints.has(key)) return;

    // Create new Set to trigger reactivity
    revealedSemanticHints = new Set(revealedSemanticHints).add(key);
    semanticHintsUsed++;
  }

  function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
      timer++;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateStatsOnCompletion() {
    if (!currentPuzzle) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (stats.lastPlayed === yesterday) {
      stats.streak++;
    } else if (stats.lastPlayed !== today) {
      stats.streak = 1;
    }

    stats.lastPlayed = today;
    stats.completedPuzzles.add(currentPuzzle.id);

    const gridValues = grid.map(row => row.map(cell => cell.value));
    const solutionKey = getSolutionKey(gridValues);
    const expectedKey = getSolutionKey(currentPuzzle.grid.map(row => [...row]));

    if (solutionKey !== expectedKey) {
      isAlternativeSolution = true;
      if (!stats.alternativeSolutions.has(currentPuzzle.id)) {
        stats.alternativeSolutions.set(currentPuzzle.id, new Set());
      }
      stats.alternativeSolutions.get(currentPuzzle.id)!.add(solutionKey);
    } else {
      isAlternativeSolution = false;
    }

    saveStats(stats);
    clearCurrentGame();
  }

  function resetGame() {
    grid = [];
    currentPuzzle = null;
    timer = 0;
    hintsUsed = 0;
    semanticHintsUsed = 0;
    revealedSemanticHints = new Set();
    status = 'playing';
    stopTimer();
    clearCurrentGame();
  }

  function getShareText(): string {
    if (!currentPuzzle) return '';

    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const totalHints = hintsUsed + semanticHintsUsed;

    return `Hebrew Mini Crossword #${currentPuzzle.id}
Time: ${timeStr}
Hints: ${totalHints}
Streak: ${stats.streak}

Play at: [your-site-url]`;
  }

  const alternativeSolutionsCount = $derived(() => {
    if (!currentPuzzle) return 0;
    return stats.alternativeSolutions.get(currentPuzzle.id)?.size || 0;
  });

  return {
    get grid() { return grid; },
    set grid(value) { grid = value; },
    get currentPuzzle() { return currentPuzzle; },
    get timer() { return timer; },
    get hintsUsed() { return hintsUsed; },
    get semanticHintsUsed() { return semanticHintsUsed; },
    get revealedSemanticHints() { return revealedSemanticHints; },
    get semanticHints() { return semanticHints; },
    get status() { return status; },
    set status(value) { status = value; },
    get stats() { return stats; },
    get isAlternativeSolution() { return isAlternativeSolution; },
    get alternativeSolutionsCount() { return alternativeSolutionsCount; },

    get isComplete() { return isComplete; },
    get isValid() { return isValid; },

    initializeGame,
    setCellValue,
    revealCell,
    revealRandomEmptyCell,
    revealSemanticHint,
    resetGame,
    getShareText,
    startTimer,
    stopTimer,

    saveGame() {
      if (currentPuzzle && grid.length > 0) {
        saveCurrentGame(grid, timer, hintsUsed, semanticHintsUsed, revealedSemanticHints, currentPuzzle.id);
      }
    },
    completeGame() {
      status = 'completed';
      stopTimer();
      updateStatsOnCompletion();
    }
  };
}

// Export singleton instance
export const gameStore = createGameStore();
