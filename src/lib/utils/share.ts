/**
 * Share Utilities
 * Generate shareable text for completed puzzles
 */

/**
 * Format time as MM:SS
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate share text for a completed puzzle
 */
export function generateShareText(
  puzzleId: number,
  timeSeconds: number,
  hintsUsed: number,
  streak: number,
  siteUrl: string = window.location.origin,
): string {
  const timeStr = formatTime(timeSeconds);

  return `Hebrew Mini Crossword #${puzzleId}
⏱️ ${timeStr}
💡 ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}
🔥 ${streak} day streak

${siteUrl}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Share via Web Share API (mobile-friendly)
 */
export async function shareViaWebShare(
  text: string,
  title: string = 'Hebrew Root Mini Crossword'
): Promise<boolean> {
  const shareData = {
    title,
    text,
    url: window.location.origin,
  };
  if (!navigator?.canShare(shareData)) {
    return false;
  }

  try {
    await navigator.share({
      title,
      text,
      url: window.location.origin,
    });
    return true;
  } catch (error) {

    // User cancelled or error occurred
    return false;
  }
}
