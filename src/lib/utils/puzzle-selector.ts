import puzzlesData from '../data/puzzles.json';

interface Puzzle {
  id: number;
  grid: string[];
  difficulty: number;
  prefilledCells: { row: number; col: number }[];
  dayDifficulty: number;
}

interface PuzzleWithClues {
  puzzle: Puzzle;
  prefilled: { row: number; col: number }[];
}

export function getIsraelDate(): Date {
  const israelDateStr = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Jerusalem'
  });
  return new Date(israelDateStr);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getDifficultyForDay(dayOfWeek: number): number {
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

export function getTodaysPuzzle(): PuzzleWithClues {
  const israelDate = getIsraelDate();
  const dateStr = israelDate.toISOString().split('T')[0];
  const dayOfWeek = israelDate.getDay();

  const dayDifficulty = getDifficultyForDay(dayOfWeek);

  const puzzlesForDay = (puzzlesData.puzzles as Puzzle[]).filter(
    p => p.dayDifficulty === dayDifficulty
  );

  const hash = simpleHash(dateStr);
  const puzzleIndex = hash % puzzlesForDay.length;

  const puzzle = puzzlesForDay[puzzleIndex];

  return {
    puzzle,
    prefilled: puzzle.prefilledCells
  };
}

export function getPuzzleById(id: number): PuzzleWithClues | null {
  const puzzle = puzzlesData.puzzles.find(p => p.id === id) as Puzzle | undefined;
  if (!puzzle) return null;

  return {
    puzzle,
    prefilled: puzzle.prefilledCells
  };
}

export function getPuzzleForDate(date: Date): PuzzleWithClues {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();

  const dayDifficulty = getDifficultyForDay(dayOfWeek);

  const puzzlesForDay = (puzzlesData.puzzles as Puzzle[]).filter(
    p => p.dayDifficulty === dayDifficulty
  );

  const hash = simpleHash(dateStr);
  const puzzleIndex = hash % puzzlesForDay.length;

  const puzzle = puzzlesForDay[puzzleIndex];

  return {
    puzzle,
    prefilled: puzzle.prefilledCells
  };
}
