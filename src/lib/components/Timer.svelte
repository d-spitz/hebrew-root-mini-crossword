<script lang="ts">
  import { formatTime } from '../utils/share';

  interface Props {
    seconds: number;
  }

  let { seconds }: Props = $props();

  const formatted = $derived(formatTime(seconds));
</script>

<div class="timer" aria-live="polite" aria-atomic="true">
  <span class="timer-icon" aria-hidden="true">⏱️</span>
  <time datetime={`PT${seconds}S`}>{formatted}</time>
</div>

<style>
  .timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: clamp(1rem, 3vw, 1.25rem);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-secondary);
  }

  .timer-icon {
    font-size: 1.25em;
  }
</style>
