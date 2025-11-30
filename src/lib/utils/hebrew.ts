/**
 * Hebrew Letter Utilities
 * Handle final forms and normalization
 */

// Map of final forms to regular forms
const FINAL_TO_REGULAR: Record<string, string> = {
  'ך': 'כ', // Kaf Sofit → Kaf
  'ם': 'מ', // Mem Sofit → Mem
  'ן': 'נ', // Nun Sofit → Nun
  'ף': 'פ', // Pe Sofit → Pe
  'ץ': 'צ'  // Tsadi Sofit → Tsadi
};

const REGULAR_TO_FINAL: Record<string, string> = {
  'כ': 'ך',
  'מ': 'ם',
  'נ': 'ן',
  'פ': 'ף',
  'צ': 'ץ'
};

/**
 * Normalize a Hebrew letter by converting final forms to regular forms
 */
export function normalizeLetter(letter: string): string {
  return FINAL_TO_REGULAR[letter] || letter;
}

/**
 * Normalize a Hebrew string by converting all final forms to regular forms
 */
export function normalizeHebrew(text: string): string {
  return text.split('').map(char => normalizeLetter(char)).join('');
}

/**
 * Check if two Hebrew strings are equal after normalization
 */
export function hebrewEquals(a: string, b: string): boolean {
  return normalizeHebrew(a) === normalizeHebrew(b);
}

/**
 * Get the final form of a letter (if it exists)
 */
export function getFinalForm(letter: string): string {
  return REGULAR_TO_FINAL[letter] || letter;
}

/**
 * Check if a letter is a final form
 */
export function isFinalForm(letter: string): boolean {
  return letter in FINAL_TO_REGULAR;
}

/**
 * Get all regular Hebrew letters (excluding final forms)
 * For use in the keyboard
 */
export function getRegularHebrewLetters(): string[] {
  return [
    'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט',
    'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ',
    'ק', 'ר', 'ש', 'ת'
  ];
}

/**
 * Hebrew keyboard layout (standard Israeli keyboard)
 * Returns rows of letters (without final forms)
 */
export function getHebrewKeyboardLayout(): string[][] {
  return [
    ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'], // Note: ן and ם here are actually part of standard keyboard
    ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
    ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ']
  ];
}

/**
 * Get Hebrew keyboard layout with only regular forms (no finals)
 * For crossword puzzle input
 */
export function getHebrewKeyboardRegular(): string[][] {
  return [
    ['ק', 'ר', 'א', 'ט', 'ו', 'נ', 'מ', 'פ'],
    ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל'],
    ['ז', 'ס', 'ב', 'ה', 'צ', 'ת']
  ];
}
