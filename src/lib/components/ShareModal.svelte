<script lang="ts">
  import {
    formatTime,
    generateShareText,
    copyToClipboard,
    shareViaWebShare,
  } from "../utils/share";

  interface CellData {
    isPrefilled: boolean;
    isRevealed: boolean;
  }

  interface Props {
    isOpen: boolean;
    puzzleId: number;
    timeSeconds: number;
    hintsUsed: number;
    streak: number;
    grid: CellData[][];
    isAlternativeSolution: boolean;
    alternativeSolutionsCount: number;
    onClose: () => void;
  }

  let {
    isOpen,
    puzzleId,
    timeSeconds,
    hintsUsed,
    streak,
    grid,
    isAlternativeSolution,
    alternativeSolutionsCount,
    onClose,
  }: Props = $props();

  let dialogElement = $state<HTMLDialogElement | null>(null);
  let copyStatus = $state<"idle" | "copied" | "error">("idle");

  const shareText = $derived(() =>
    generateShareText(puzzleId, timeSeconds, hintsUsed, streak),
  );

  // Handle dialog open/close based on isOpen prop
  $effect(() => {
    if (!dialogElement) return;

    if (isOpen && !dialogElement.open) {
      dialogElement.showModal();
    } else if (!isOpen && dialogElement.open) {
      dialogElement.close();
    }
  });

  async function handleShare() {
    const fullText = shareText();

    // Try Web Share API first (mobile-friendly)
    const shared = await shareViaWebShare(fullText);
    if (!shared) {
      // Fallback to clipboard
      const copied = await copyToClipboard(fullText);

      if (copied) {
        copyStatus = "copied";
        setTimeout(() => {
          copyStatus = "idle";
        }, 2000);
      } else {
        copyStatus = "error";
      }
    }
  }

  function handleClose() {
    onClose();
  }
</script>

<dialog
  bind:this={dialogElement}
  aria-labelledby="modal-title"
  onclose={handleClose}
>
  <header class="modal-header">
    <h2 id="modal-title">
      {isAlternativeSolution ? "🌟 Alternative Solution!" : "Puzzle Complete!"}
    </h2>
    <button
      type="button"
      class="close-button"
      onclick={handleClose}
      aria-label="Close modal"
    >
      ✕
    </button>
  </header>

  <div class="modal-body">
    {#if isAlternativeSolution}
      <div class="alternative-badge">
        You found a different valid solution! Total alternative solutions: {alternativeSolutionsCount}
      </div>
    {/if}
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">⏱️</div>
        <div class="stat-value">{formatTime(timeSeconds)}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">💡</div>
        <div class="stat-value">{hintsUsed}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">🔥</div>
        <div class="stat-value">{streak}</div>
      </div>
    </div>

    <button type="button" class="share-button" onclick={handleShare}>
      {#if copyStatus === "copied"}
        ✓ Copied!
      {:else if copyStatus === "error"}
        Failed to copy
      {:else}
        Share Results
      {/if}
    </button>
  </div>
</dialog>

<style>
  dialog {
    border: none;
    border-radius: calc(var(--border-radius) * 2);
    background: var(--color-bg);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: calc(100% - 2rem);
    max-height: 90vh;
    padding: 0;
    overflow: hidden;
    margin: auto;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(3px);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid var(--color-border);
  }

  h2 {
    font-size: clamp(1.25rem, 4vw, 1.5rem);
    font-weight: 700;
    margin: 0;
    color: var(--color-text);
  }

  .close-button {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--border-radius);
    transition: background 0.15s ease;
  }

  .close-button:hover {
    background: var(--color-border);
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .stat-card {
    text-align: center;
    padding: 1rem;
    background: var(--color-prefilled-bg);
    border-radius: var(--border-radius);
  }

  .stat-label {
    font-size: 1.25rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .share-button {
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
    font-weight: 600;
    border: 2px solid var(--color-primary);
    border-radius: var(--border-radius);
    background: var(--color-primary);
    color: white;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .share-button:hover {
    background: var(--color-primary-dark);
  }

  .share-button:active {
    transform: scale(0.98);
  }

  .alternative-badge {
    padding: 1rem;
    background: linear-gradient(
      135deg,
      var(--color-correct) 0%,
      var(--color-primary) 100%
    );
    color: white;
    border-radius: var(--border-radius);
    text-align: center;
    font-weight: 600;
  }

  @media (prefers-reduced-motion: reduce) {
    .close-button,
    .share-button {
      transition: none;
    }

    .share-button:active {
      transform: none;
    }
  }
</style>
