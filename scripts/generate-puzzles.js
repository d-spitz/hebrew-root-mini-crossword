#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FINAL_TO_REGULAR = {
  'ך': 'כ',
  'ם': 'מ',
  'ן': 'נ',
  'ף': 'פ',
  'ץ': 'צ'
};

function normalizeHebrew(text) {
  return text.split('').map(char => FINAL_TO_REGULAR[char] || char).join('');
}

const rootsPath = join(__dirname, '../src/lib/roots.ts');
const rootsContent = readFileSync(rootsPath, 'utf-8');

const match = rootsContent.match(/= (\[[\s\S]*\]);/);
if (!match) {
  throw new Error('Could not parse roots.ts file');
}

const jsonStr = match[1]
  .replace(/root:/g, '"root":')
  .replace(/meaning:/g, '"meaning":');

const roots = JSON.parse(jsonStr);
console.log(`📚 Loaded ${roots.length} total roots`);

const threeLetterRoots = roots.filter(r => [...r.root].length === 3);
console.log(`✅ Filtered to ${threeLetterRoots.length} three-letter roots`);

const rootSet = new Set(threeLetterRoots.map(r => normalizeHebrew(r.root)));

function isValidGrid(grid) {
  for (let i = 0; i < 3; i++) {
    const row = normalizeHebrew(grid[i].join(''));
    if (!rootSet.has(row)) return false;
  }

  for (let col = 0; col < 3; col++) {
    const column = normalizeHebrew(grid[0][col] + grid[1][col] + grid[2][col]);
    if (!rootSet.has(column)) return false;
  }

  return true;
}

function generatePuzzle() {
  const grid = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];

  function backtrack(row, col) {
    if (row === 3) {
      return isValidGrid(grid);
    }

    const nextCol = (col + 1) % 3;
    const nextRow = nextCol === 0 ? row + 1 : row;

    const hebrewLetters = getUniqueLettersFromRoots();

    for (const letter of hebrewLetters) {
      grid[row][col] = letter;

      if (isPotentiallyValid(grid, row, col)) {
        if (backtrack(nextRow, nextCol)) {
          return true;
        }
      }
    }

    grid[row][col] = '';
    return false;
  }

  const randomRoot = threeLetterRoots[Math.floor(Math.random() * threeLetterRoots.length)];
  const rootChars = [...randomRoot.root];
  grid[0] = rootChars;

  if (backtrack(1, 0)) {
    return grid;
  }

  return null;
}

function isPotentiallyValid(grid, currentRow, currentCol) {
  if (currentCol === 2) {
    const row = normalizeHebrew(grid[currentRow].join(''));
    if (!rootSet.has(row)) return false;
  }

  if (currentRow === 2) {
    const column = normalizeHebrew(grid[0][currentCol] + grid[1][currentCol] + grid[2][currentCol]);
    if (!rootSet.has(column)) return false;
  }

  if (currentRow > 0) {
    let columnPrefix = '';
    for (let r = 0; r <= currentRow; r++) {
      if (grid[r][currentCol] === '') break;
      columnPrefix += grid[r][currentCol];
    }

    if (columnPrefix.length > 0) {
      const normalizedPrefix = normalizeHebrew(columnPrefix);
      const hasMatch = threeLetterRoots.some(root => normalizeHebrew(root.root).startsWith(normalizedPrefix));
      if (!hasMatch) return false;
    }
  }

  return true;
}

function getUniqueLettersFromRoots() {
  const letters = new Set();
  for (const root of threeLetterRoots) {
    for (const char of root.root) {
      letters.add(char);
    }
  }
  return Array.from(letters);
}

function calculateDifficulty(grid) {
  const letterFrequency = new Map();

  for (const root of threeLetterRoots) {
    for (const char of root.root) {
      letterFrequency.set(char, (letterFrequency.get(char) || 0) + 1);
    }
  }

  let totalRarity = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const char = grid[row][col];
      const frequency = letterFrequency.get(char) || 1;
      totalRarity += 1000 / frequency;
    }
  }

  return Math.min(100, Math.round(totalRarity / 9));
}

function getPrefilledCount(difficulty) {
  return {
    1: 6, 2: 6, 3: 5, 4: 5, 5: 4, 6: 4, 7: 4
  }[difficulty] || 5;
}

function generatePrefilledCells(count, seed) {
  const allPositions = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      allPositions.push({ row, col });
    }
  }

  function seededRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }

  return allPositions.slice(0, count);
}

console.log('\n🎲 Generating puzzles...\n');

const targetPuzzles = 100;
const puzzles = [];
let attempts = 0;
const uniqueGrids = new Set();

for (let difficulty = 1; difficulty <= 7; difficulty++) {
  const prefilledCount = getPrefilledCount(difficulty);
  const puzzlesPerDifficulty = Math.ceil(targetPuzzles / 7);

  console.log(`📊 Difficulty ${difficulty} (${prefilledCount} clues):`);

  let difficultyPuzzles = 0;

  while (difficultyPuzzles < puzzlesPerDifficulty && attempts < 10000) {
    attempts++;

    const grid = generatePuzzle();

    if (grid) {
      const gridKey = grid.map(row => row.join('')).join('|');

      if (!uniqueGrids.has(gridKey)) {
        uniqueGrids.add(gridKey);

        const difficultyScore = calculateDifficulty(grid);
        const prefilled = generatePrefilledCells(prefilledCount, puzzles.length);

        puzzles.push({
          grid: grid.map(row => row.join('')),
          difficulty: difficultyScore,
          prefilledCells: prefilled,
          dayDifficulty: difficulty
        });

        difficultyPuzzles++;
        console.log(`  Generated ${difficultyPuzzles}/${puzzlesPerDifficulty}`);
      }
    }
  }
}

console.log(`\n✅ Generated ${puzzles.length} puzzles in ${attempts} attempts\n`);

const output = {
  generated: new Date().toISOString(),
  totalPuzzles: puzzles.length,
  rootsUsed: threeLetterRoots.length,
  puzzles: puzzles.map((puzzle, index) => ({
    id: index,
    ...puzzle
  }))
};

mkdirSync(join(__dirname, '../src/lib/data'), { recursive: true });

const outputPath = join(__dirname, '../src/lib/data/puzzles.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`📝 Wrote ${puzzles.length} puzzles to ${outputPath}`);
console.log(`\nDifficulty distribution:`);
for (let i = 1; i <= 7; i++) {
  const count = puzzles.filter(p => p.dayDifficulty === i).length;
  console.log(`  Day ${i}: ${count} puzzles`);
}
console.log('\n✨ Done!\n');
