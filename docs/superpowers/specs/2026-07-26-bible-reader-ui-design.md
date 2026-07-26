# Bible Reader UI — Design Spec

Date: 2026-07-26  
Scope: Modernize the static GitHub Pages reader under `docs/` only. Treat `vendor/bible/` as legacy (do not sync).

## Goals

- Clean modern reading UI (Approach 2: multi-file).
- Book + chapter dropdown navigation (no free-text “Tags” field).
- Always-visible English column; optional Tamil and Sinhala columns (default on).
- Browser speech reader for English: play/pause, prev/next verse, speed, highlight + scroll.
- Light, Dark, High contrast light, and High contrast dark themes; mobile-friendly layout.
- Persist preferences in `localStorage`.

## Non-goals

- Tamil/Sinhala text-to-speech
- Full-text search
- Offline / service worker
- Updating `vendor/bible/`
- Build tooling (Vite, bundlers)

## File layout (`docs/`)

| Path | Responsibility |
|------|----------------|
| `index.html` | Markup: toolbar, theme control, column toggles, reader controls, verse region |
| `css/style.css` | Layout, themes (CSS variables), responsive rules |
| `js/app.js` | Books/chapters, fetch JSON, render, column visibility, theme, persistence |
| `js/reader.js` | `speechSynthesis` play/pause, prev/next, rate, highlight coordination |
| `json/*` | Existing verse data (unchanged) |

Remove jQuery / jQuery UI usage from the reader. Unused `docs/lib/` may remain unused.

## Navigation

- **Book** `<select>` populated from `json/books.json`, with Old Testament / New Testament `<optgroup>`s (split after Malachi / before Matthew).
- **Chapter** `<select>` populated from keys of the loaded English book JSON; default chapter `1` (or last saved).
- Changing book loads English (and Tamil/Sinhala if those columns are enabled or always preload all three for alignment), rebuilds chapter options, renders chapter 1 (or restored chapter if valid).
- Changing chapter re-renders that chapter and cancels any active speech, resetting highlight to verse 1.
- Encode spaces in book names when fetching (e.g. `Song of Solomon` → `Song%20of%20Solomon_en_nkjv.json`).

## Columns / languages

- **English (NKJV):** always shown. No user toggle (or a locked/disabled control if shown for clarity). Not hideable.
- **Tamil** and **Sinhala:** checkboxes, both checked by default. Unchecking hides that language in the layout.
- Desktop and mobile both respect visibility: only enabled languages appear.

## Layout

### Desktop (≥768px)

- Parallel vertical columns: one column per visible language (English always present).
- Column headers label the language/version (e.g. English · NKJV, Tamil, Sinhala).
- Each column is a vertical stack of verses for the selected chapter.
- Hidden languages collapse; remaining columns share width.

### Mobile (<768px)

- Single column.
- Each verse is one block: verse number once, then enabled languages stacked under it (English → Tamil → Sinhala when all on).

## Reader (English only)

- Controls: Previous verse · Play/Pause · Next verse · Speed (`0.75`, `1`, `1.25`, `1.5`).
- Play starts at the highlighted verse (default verse 1); speaks that verse’s English `verse_text` via `speechSynthesis`, then advances to the next verse until chapter end or pause.
- Pause cancels the current utterance and keeps the highlight.
- Prev/Next move the highlight; if speech is playing, cancel and speak the new verse.
- Active verse gets a distinct highlight and `scrollIntoView({ block: "nearest" })`.
- Book/chapter change: `speechSynthesis.cancel()`, reset to verse 1.
- If `speechSynthesis` is unavailable: show a short inline note and disable reader controls.

## Themes

Three mutually exclusive modes via a segmented control or `<select>`:

| Mode | Intent |
|------|--------|
| **Light** | Default clean modern reader — light neutrals, dark text |
| **Dark** | Dark surface, light text, muted borders; comfortable night reading |
| **High contrast light** | Near-black on near-white, strong borders, yellow highlight |
| **High contrast dark** | Near-white on near-black, yellow accent, blue highlight |

Implementation:

- `data-theme="light|dark|high-contrast|high-contrast-dark"` on `<html>` or `<body>`.
- CSS variables for background, text, muted text, border, accent, highlight, toolbar surface.
- No purple/glow aesthetic; avoid generic AI-default purple gradients.

## Persistence (`localStorage`)

Keys (names illustrative):

- `bible-reader-theme`: `light` | `dark` | `high-contrast` | `high-contrast-dark`
- `bible-reader-show-tamil`: boolean
- `bible-reader-show-sinhala`: boolean
- `bible-reader-rate`: number
- `bible-reader-book` / `bible-reader-chapter`: last selection

Apply on load before or immediately after first paint where practical.

## Data shape (existing)

English (and peers) JSON: object keyed by chapter string → array of `{ verse: number, verse_text: string }`.

Alignment: render by English verse index; if Tamil/Sinhala entry missing, leave that cell/block empty without throwing.

## Error handling

- Failed fetch: message in the content region (“Couldn’t load this book. Try again.”).
- Empty chapter edge case: show “No verses found.”

## Initial load

1. Restore theme and column prefs.
2. Load `books.json`.
3. Select restored book or Genesis; load chapter data; select restored chapter or 1; render.
4. Init reader with highlight on verse 1.

## Visual notes

- Title in toolbar: “Bible Reader” (or “Bible Verses”).
- Comfortable reading type size; UI chrome smaller than verse text.
- Sticky top toolbar on scroll.
- Touch-friendly control targets on mobile.

## Testing (manual)

- Genesis 1 and John 3 load; Song of Solomon fetches correctly (spaces).
- Tamil/Sinhala hide/show; English always visible.
- Light / Dark / High contrast light / High contrast dark switch and persist across reload.
- Play → pause → play; prev/next while playing; speed change; end of chapter stops.
- Desktop three-column vs mobile stacked-per-verse.
- Resize across 768px breakpoint.
