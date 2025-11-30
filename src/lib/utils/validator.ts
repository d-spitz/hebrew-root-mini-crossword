/**
 * Puzzle Validator
 * Validates grid solutions against Hebrew roots
 */

import { roots } from '../roots';
import { normalizeHebrew } from './hebrew';

const threeLetterRoots = roots.filter(r => [...r.root].length === 3);
const validRoots = new Set(threeLetterRoots.map(r => normalizeHebrew(r.root)));

export const rootMeanings = new Map(threeLetterRoots.map(r => [normalizeHebrew(r.root), r.meaning]));

/**
 * Check if a string is a valid Hebrew root
 */
export function isValidRoot(root: string): boolean {
  return validRoots.has(normalizeHebrew(root));
}

/**
 * Get the meaning of a root (if valid)
 */
export function getRootMeaning(root: string): string | null {
  return rootMeanings.get(normalizeHebrew(root)) || null;
}

/**
 * Get all valid roots (for autocomplete, hints, etc.)
 */
export function getAllValidRoots(): string[] {
  return Array.from(validRoots);
}

/**
 * Validate a complete 3x3 grid
 * Returns true if all rows and columns are valid roots
 */
export function validateGrid(grid: string[][]): boolean {
  if (grid.length !== 3 || grid.some(row => row.length !== 3)) {
    return false;
  }

  for (let i = 0; i < 3; i++) {
    const row = grid[i].join('');
    if (!isValidRoot(row)) return false;
  }

  for (let col = 0; col < 3; col++) {
    const column = grid[0][col] + grid[1][col] + grid[2][col];
    if (!isValidRoot(column)) return false;
  }

  return true;
}

/**
 * Get hints for a specific position based on what roots could fit
 * Returns possible letters that could work in this position
 */
export function getHintsForPosition(
  grid: string[][],
  row: number,
  col: number
): string[] {
  const possibleLetters = new Set<string>();

  // Get current row prefix and suffix
  const rowPrefix = grid[row].slice(0, col).join('');
  const rowSuffix = grid[row].slice(col + 1).join('');

  // Get current column prefix and suffix
  const colPrefix = grid.slice(0, row).map(r => r[col]).join('');
  const colSuffix = grid.slice(row + 1).map(r => r[col]).join('');

  // Find roots that match the row pattern
  for (const root of validRoots) {
    if (root.startsWith(rowPrefix) && root.endsWith(rowSuffix)) {
      const letter = root[col];
      if (letter) possibleLetters.add(letter);
    }
  }

  // Intersect with roots that match the column pattern
  const colPossible = new Set<string>();
  for (const root of validRoots) {
    if (root.startsWith(colPrefix) && root.endsWith(colSuffix)) {
      const letter = root[row];
      if (letter) colPossible.add(letter);
    }
  }

  // Return only letters that work for both row and column
  return Array.from(possibleLetters).filter(letter => colPossible.has(letter));
}

export function getSolutionKey(grid: string[][]): string {
  return grid.map(row => normalizeHebrew(row.join(''))).join('|');
}
