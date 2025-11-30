# Hebrew Mini Crossword - Claude Development Guide

## Project Overview
A daily Hebrew root puzzle game built with SvelteKit 5. Players fill a 3×3 grid where each row and column forms a valid 3-letter Hebrew root.

## Svelte 5 Best Practices

### Runes - Core Reactive Primitives

#### $state - Reactive State
Use `$state` for all reactive variables:
```svelte
<script lang="ts">
  let count = $state(0);
  let user = $state({ name: 'Sarah', score: 0 });
</script>
```

- **Deep reactivity**: Objects and arrays are automatically reactive via proxies
- **No wrapper API**: `count` is just a number, `user.score++` just works
- **Use `$state.raw()`** for non-reactive data (performance optimization)
- **Use `$state.snapshot()`** for static copies when passing to external libraries

#### $derived - Computed Values
Use `$derived` instead of reactive statements:
```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  // For complex logic, use $derived.by()
  let message = $derived.by(() => {
    if (count > 10) return 'High';
    if (count > 5) return 'Medium';
    return 'Low';
  });
</script>
```

- **Prefer over `$effect`** for state synchronization
- Prevents circular updates
- Automatically tracks dependencies

#### $effect - Side Effects
Use `$effect` sparingly for side effects only:
```svelte
<script lang="ts">
  let count = $state(0);

  $effect(() => {
    console.log(`Count is now: ${count}`);

    // Return cleanup function if needed
    return () => {
      console.log('Cleaning up');
    };
  });
</script>
```

- Runs **after DOM updates** in microtasks
- Use `$effect.pre()` for pre-DOM-update logic
- **Avoid for state synchronization** - use `$derived` instead
- Auto-tracks dependencies

#### $props - Component Props
```svelte
<script lang="ts">
  interface Props {
    value: string;
    count?: number;
    onSubmit?: (value: string) => void;
  }

  let { value, count = 0, onSubmit }: Props = $props();

  // For two-way binding
  let { isOpen = $bindable(false) } = $props();
</script>
```

- Destructure with defaults
- Use `$bindable()` for two-way binding (sparingly - prefer callbacks)
- TypeScript interfaces for type safety

### Component Patterns

#### Snippets (Replace Slots)
```svelte
<!-- Parent component -->
<script lang="ts">
  let { children } = $props();
</script>

<div class="card">
  {@render children?.()}
</div>

<!-- Using snippets -->
{#snippet header()}
  <h1>Title</h1>
{/snippet}

{#snippet row(item, index)}
  <tr><td>{index}: {item}</td></tr>
{/snippet}

<div class="header">
  {@render header()}
</div>

{@render row('Apple', 1)}
```

- More powerful than slots
- Can accept parameters
- Can be passed as props

#### Event Handling
```svelte
<button onclick={() => count++}>
  Click me
</button>

<!-- For custom events that need to bubble -->
<button
  onclick={(e) => {
    const event = new CustomEvent('myevent', {
      bubbles: true,
      detail: { value }
    });
    e.currentTarget.dispatchEvent(event);
  }}
>
```

- Events delegate automatically for performance
- Manually dispatched events need `{ bubbles: true }`
- Avoid `stopPropagation` with delegated events

### Anti-Patterns to Avoid

❌ **Don't destructure reactive state**
```svelte
let user = $state({ name: 'Sarah' });
let { name } = user; // ❌ Breaks reactivity
```

✅ **Do keep object references**
```svelte
let user = $state({ name: 'Sarah' });
<input bind:value={user.name}> <!-- ✅ Reactive -->
```

❌ **Don't use `$effect` for state synchronization**
```svelte
let count = $state(0);
let doubled = $state(0);
$effect(() => {
  doubled = count * 2; // ❌ Use $derived instead
});
```

✅ **Do use `$derived` for computed values**
```svelte
let count = $state(0);
let doubled = $derived(count * 2); // ✅
```

## CSS Best Practices

### Minimal CSS Philosophy
- **Write as little CSS as possible**
- Let HTML semantics and browser defaults do the work
- Use modern CSS features (Grid, clamp, logical properties)
- Avoid unnecessary classes and div soup
- Let CSS Grid handle responsive layouts naturally

### Semantic HTML First
```html
<!-- ✅ Good: Semantic, minimal -->
<main>
  <header>
    <h1>Hebrew Mini Crossword</h1>
  </header>
  <section class="puzzle">
    <div class="grid">
      <input type="text" maxlength="1" aria-label="Row 1, Column 1">
    </div>
  </section>
</main>

<!-- ❌ Bad: Divitis, no semantics -->
<div class="container">
  <div class="header-wrapper">
    <div class="title">Hebrew Mini Crossword</div>
  </div>
</div>
```

### CSS Grid for Responsive Layouts
Use CSS Grid with intrinsic sizing - avoid media query spam:
```css
/* The 3×3 grid - responsive without media queries */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(3rem, 1fr));
  gap: clamp(0.5rem, 2vw, 1rem);
  max-width: min(90vw, 400px);
  margin-inline: auto;
}

/* Keyboard - adapts naturally */
.keyboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(2rem, 1fr));
  gap: 0.5rem;
}

/* Only add media queries when layout fundamentally changes */
@media (min-width: 768px) {
  /* Major layout shift only */
  body {
    display: grid;
    grid-template-columns: 1fr minmax(auto, 600px) 1fr;
  }
}
```

### Use Modern CSS Features
```css
/* clamp() for fluid typography - no media queries needed */
h1 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

/* Logical properties for better internationalization */
.card {
  padding-inline: 1rem;
  margin-block: 2rem;
}

/* Container queries instead of viewport media queries (when appropriate) */
.card {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card-content {
    display: flex;
  }
}
```

### Theme Support with light-dark()
Use CSS custom properties with `light-dark()`:
```css
:root {
  color-scheme: light dark;

  /* Semantic color variables */
  --color-bg: light-dark(#ffffff, #1a1a1a);
  --color-text: light-dark(#1a1a1a, #ffffff);
  --color-primary: light-dark(#3b82f6, #60a5fa);
  --color-border: light-dark(#e5e7eb, #374151);
  --color-correct: light-dark(#22c55e, #4ade80);
  --color-error: light-dark(#ef4444, #f87171);
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

### Reduced Motion Support
Always respect user preferences:
```css
.cell {
  transition: transform 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  .cell {
    transition: none;
  }

  /* Disable all animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### DRY Principles

#### Shared Styles
Use CSS custom properties for repeated values:
```css
:root {
  --cell-size: 4rem;
  --cell-gap: 0.5rem;
  --font-hebrew: 'Arial', sans-serif;
  --border-radius: 0.375rem;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

@media (min-width: 640px) {
  :root {
    --cell-size: 5rem;
    --cell-gap: 0.75rem;
  }
}
```

#### Component Scoped Styles
Keep styles close to components:
```svelte
<style>
  .cell {
    width: var(--cell-size);
    height: var(--cell-size);
    border-radius: var(--border-radius);
  }
</style>
```

#### Utility Patterns
Create reusable utility classes in `app.css`:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus-ring {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## Project-Specific Guidelines

### File Organization
- **Components**: One component per file, PascalCase naming
- **Stores**: Use `.svelte.ts` extension for rune-based stores
- **Utils**: Pure functions, well-typed, no side effects
- **Types**: Define in `models.ts` or colocated with components

### State Management
- **Game state**: Centralized in `src/lib/stores/game.svelte.ts`
- **Use `$state`** for all reactive game state
- **LocalStorage**: Persist streak, completion history, current game
- **Use `$effect`** only for localStorage sync and timer

### Performance
- **Pre-generate puzzles**: Don't compute at runtime
- **Lazy load**: Only load today's puzzle data
- **Minimize reactivity**: Use `$state.raw()` for static data
- **Optimize images**: Use modern formats (WebP, AVIF)

### Accessibility
- **Semantic HTML**: Use `<button>`, `<input>`, proper headings
- **Keyboard navigation**: Full keyboard support for grid and keyboard
- **Screen reader**: ARIA labels for Hebrew letters and game state
- **Focus management**: Clear focus indicators
- **Color contrast**: WCAG AA minimum (4.5:1 for text)

### TypeScript
- **Strict mode enabled**: No implicit any
- **Type all props**: Use interfaces
- **Type all stores**: Export typed state
- **Avoid `any`**: Use `unknown` if type is truly unknown

### Hebrew Text Handling
- **RTL support**: Use `dir="rtl"` where needed, but keep UI LTR
- **Font fallbacks**: `font-family: 'Arial', 'Noto Sans Hebrew', sans-serif`
- **Letter spacing**: Hebrew may need different spacing than Latin
- **Input handling**: Ensure Hebrew keyboard input works correctly

## Common Patterns for This Project

### Grid Cell State
```typescript
interface Cell {
  value: string;           // Current letter
  isPrefilled: boolean;    // Is this a clue cell?
  isRevealed: boolean;     // Was this revealed via hint?
}
```

### Game State Store
```typescript
// src/lib/stores/game.svelte.ts
export const gameState = (() => {
  let grid = $state<Cell[][]>([...]);
  let timer = $state(0);
  let hintsUsed = $state(0);
  let isComplete = $derived(/* check if all cells filled and valid */);

  $effect(() => {
    // Persist to localStorage
  });

  return {
    get grid() { return grid; },
    get timer() { return timer; },
    get hintsUsed() { return hintsUsed; },
    get isComplete() { return isComplete; },
    // ... methods
  };
})();
```

### Daily Puzzle Selection
```typescript
export function getTodaysPuzzle(): Puzzle {
  const israelDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Jerusalem'
  });
  const date = new Date(israelDate);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Difficulty: Monday (1) = easiest, Sunday (0) = hardest
  const difficulty = dayOfWeek === 0 ? 7 : dayOfWeek;

  // Hash date to get deterministic puzzle index
  const dateStr = date.toISOString().split('T')[0];
  const hash = simpleHash(dateStr);

  return puzzles[hash % puzzles.length];
}
```

## Testing Checklist
- [ ] Mobile (320px width) renders correctly
- [ ] Tablet (768px) and desktop (1024px+) responsive
- [ ] Light and dark mode both work
- [ ] Reduced motion disables animations
- [ ] Keyboard navigation works (Tab, Arrow keys, Enter)
- [ ] Screen reader announces game state
- [ ] Hebrew input works correctly
- [ ] LocalStorage persists data
- [ ] Timer counts correctly
- [ ] Hints reveal correctly
- [ ] Share function copies correct format
- [ ] Daily puzzle changes at midnight Israel time

## Resources
- [Svelte 5 Docs](https://svelte.dev/docs/svelte/overview)
- [SvelteKit Docs](https://svelte.dev/docs/kit/introduction)
- [MDN CSS light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
