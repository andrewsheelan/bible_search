# Bible Reader UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the jQuery autocomplete Bible page in `docs/` with a modern multi-file reader: book/chapter selects, always-on English + optional Tamil/Sinhala, Light/Dark/High-contrast themes, and English speech play/pause/prev/next/speed.

**Architecture:** Static GitHub Pages site. `index.html` provides structure; `css/style.css` themes and responsive layout; `js/app.js` owns data loading, rendering, theme, and prefs; `js/reader.js` owns `speechSynthesis` and verse highlight. No build step. `vendor/bible/` is legacy — do not modify.

**Tech Stack:** HTML5, CSS3 (custom properties), vanilla ES modules or classic scripts, Browser `fetch` + `speechSynthesis`, Google Fonts (distinctive pair — e.g. Fraunces for display, Source Serif 4 for verses).

## Global Constraints

- Scope: `docs/` only; do not sync `vendor/bible/`
- English column always visible (no hide toggle)
- Tamil and Sinhala checkboxes default checked
- Themes: `light` | `dark` | `high-contrast` via `data-theme` on `<html>`
- localStorage keys: `bible-reader-theme`, `bible-reader-show-tamil`, `bible-reader-show-sinhala`, `bible-reader-rate`, `bible-reader-book`, `bible-reader-chapter`
- No jQuery; leave `docs/lib/` unused
- Desktop ≥768px: parallel columns; mobile: per-verse stacked languages
- Manual browser verification (no unit test runner in this static site)

---

## File structure

| File | Responsibility |
|------|----------------|
| `docs/index.html` | Toolbar, controls, `#content` mount, script tags |
| `docs/css/style.css` | Variables, themes, layout, highlight, sticky bar |
| `docs/js/app.js` | Books, fetch, render, columns, theme, persistence; wires reader |
| `docs/js/reader.js` | `BibleReader` class: play/pause, prev/next, rate, highlight |

---

### Task 1: HTML shell + CSS themes/layout

**Files:**
- Create/overwrite: `docs/index.html`
- Create/overwrite: `docs/css/style.css`

**Interfaces:**
- Produces: DOM ids/classes that JS will bind: `#book-select`, `#chapter-select`, `#toggle-tamil`, `#toggle-sinhala`, `#theme-select`, `#btn-prev`, `#btn-play`, `#btn-next`, `#rate-select`, `#reader-status`, `#content`
- Produces: `data-theme` on `<html>`; content uses `.verse-grid` / `.verse-row` / `.lang-en|.lang-ta|.lang-sn` / `.verse-num` / `.is-active`

- [ ] **Step 1: Write `docs/index.html`**

Replace contents with a complete shell (no jQuery). Include Google Fonts link for Fraunces + Source Serif 4. Structure:

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bible Reader</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <header class="toolbar">
    <div class="toolbar-brand">Bible Reader</div>
    <div class="toolbar-nav">
      <label>Book <select id="book-select"></select></label>
      <label>Chapter <select id="chapter-select"></select></label>
    </div>
    <div class="toolbar-langs">
      <span class="lang-fixed" title="Always shown">English · NKJV</span>
      <label><input type="checkbox" id="toggle-tamil" checked /> Tamil</label>
      <label><input type="checkbox" id="toggle-sinhala" checked /> Sinhala</label>
    </div>
    <div class="toolbar-theme">
      <label>Theme
        <select id="theme-select">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="high-contrast">High contrast</option>
        </select>
      </label>
    </div>
    <div class="toolbar-reader" id="reader-controls">
      <button type="button" id="btn-prev" aria-label="Previous verse">Prev</button>
      <button type="button" id="btn-play" aria-label="Play or pause">Play</button>
      <button type="button" id="btn-next" aria-label="Next verse">Next</button>
      <label>Speed
        <select id="rate-select">
          <option value="0.75">0.75×</option>
          <option value="1" selected>1×</option>
          <option value="1.25">1.25×</option>
          <option value="1.5">1.5×</option>
        </select>
      </label>
      <p id="reader-status" class="reader-status" hidden></p>
    </div>
  </header>
  <main id="content" class="content" aria-live="polite">
    <p class="empty-state">Loading…</p>
  </main>
  <script src="js/reader.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `docs/css/style.css`**

Implement:

1. Reset + CSS variables for `[data-theme="light"]`, `[data-theme="dark"]`, `[data-theme="high-contrast"]` (`--bg`, `--bg-elevated`, `--text`, `--text-muted`, `--border`, `--accent`, `--highlight`, `--toolbar-bg`).
2. Light: warm stone/ink neutrals (not purple, not cream+terracotta cliché). Dark: deep slate/ink. High contrast: `#000` / `#fff`, thick borders, strong `--highlight`.
3. Sticky `.toolbar` with wrap flex; min tap size ~44px on controls.
4. Desktop (≥768px): `.verse-grid` CSS grid; columns via `--col-count` or classes `.show-ta` / `.show-sn` on `#content` (English always). Each `.verse-row` is one verse across columns; `.verse-num` in English column or shared.
5. Mobile (<768px): `.verse-grid` single column; each `.verse-block` stacks `.lang-en`, `.lang-ta`, `.lang-sn` (hide via `.hide-ta` / `.hide-sn` on `#content`).
6. `.is-active` uses `--highlight`.
7. Subtle fade-in on `.content` children (1–2 intentional motions only).

- [ ] **Step 3: Manual check shell**

Run: `cd docs && python3 -m http.server 8080`  
Open `http://localhost:8080/` — toolbar renders; no JS errors from missing scripts yet (404 on js until Task 2–3).  
Optional: temporarily stub empty `js/reader.js` and `js/app.js` as `/* stub */` if needed.

- [ ] **Step 4: Commit**

```bash
git add docs/index.html docs/css/style.css
git commit -m "Add Bible Reader HTML shell and themed layout CSS"
```

---

### Task 2: `BibleReader` (`js/reader.js`)

**Files:**
- Create: `docs/js/reader.js`

**Interfaces:**
- Consumes: DOM buttons/selects passed in options; verse elements with `data-verse-index` and English text in `.lang-en .verse-text` (or `data-english`)
- Produces: global `window.BibleReader` constructor

```js
/**
 * @param {{
 *   getVerseElements: () => HTMLElement[],
 *   getEnglishText: (el: HTMLElement) => string,
 *   btnPlay: HTMLButtonElement,
 *   btnPrev: HTMLButtonElement,
 *   btnNext: HTMLButtonElement,
 *   rateSelect: HTMLSelectElement,
 *   statusEl: HTMLElement
 * }} options
 */
function BibleReader(options) { ... }
BibleReader.prototype.setRate = function(rate) { ... };
BibleReader.prototype.resetToStart = function() { ... }; // cancel + highlight index 0
BibleReader.prototype.destroy = function() { ... }; // cancel, remove listeners if any
```

Behavior:

- If `!window.speechSynthesis`: set `statusEl` text “Audio not supported in this browser.”, `hidden=false`, disable play/prev/next/rate.
- `play()`: if speaking, pause (cancel, keep index, button label “Play”); else speak current verse English, on `onend` advance and speak next until end.
- `prev`/`next`: clamp index; update `.is-active` + `scrollIntoView({ block: "nearest" })`; if was playing, cancel and speak new verse.
- Rate from select; persist is owned by `app.js` (reader only applies `utterance.rate`).

- [ ] **Step 1: Implement `docs/js/reader.js`** with the API above (IIFE or plain script assigning `window.BibleReader`).

- [ ] **Step 2: Smoke-check in browser console** after Task 3 wires it — for this task alone, verify file parses:  
  `node --check docs/js/reader.js`  
  Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add docs/js/reader.js
git commit -m "Add English speech BibleReader module"
```

---

### Task 3: App logic — load, render, prefs (`js/app.js`)

**Files:**
- Create: `docs/js/app.js`

**Interfaces:**
- Consumes: `window.BibleReader`, DOM from Task 1, `json/books.json` and `json/{Book}_{en_nkjv|ta_tav|sn_snv}.json`
- Produces: working reader UI end-to-end

Constants:

```js
const OT_END = "Malachi";
const STORAGE = {
  theme: "bible-reader-theme",
  tamil: "bible-reader-show-tamil",
  sinhala: "bible-reader-show-sinhala",
  rate: "bible-reader-rate",
  book: "bible-reader-book",
  chapter: "bible-reader-chapter"
};
```

- [ ] **Step 1: Implement preference helpers** — `loadPrefs()`, `savePref(key, value)`, apply theme to `document.documentElement.dataset.theme` and `#theme-select`, apply tamil/sinhala checkboxes and `#content` classes `hide-ta` / `hide-sn`.

- [ ] **Step 2: Implement `bookFile(book, suffix)`**  
  `json/${encodeURIComponent(book).replace(/%20/g, "%20")}_${suffix}.json` — use path segments carefully: spaces must be `%20` in the URL. Prefer:

```js
function bookUrl(book, suffix) {
  return "json/" + encodeURIComponent(book) + "_" + suffix + ".json";
}
```

- [ ] **Step 3: Implement load + render**

1. `fetch("json/books.json")` → fill `#book-select` with `<optgroup label="Old Testament">` / `New Testament` (split: books before Matthew are OT; from Matthew onward NT — use index of `"Matthew"`).
2. On book change: `Promise.all` fetch en, ta, sn; store on a module-level `state = { book, en, ta, sn }`; fill chapter select from `Object.keys(en).sort((a,b)=>+a-+b)`; select saved chapter if valid else `"1"`; call `renderChapter`.
3. `renderChapter(chapterKey)`:
   - Clear `#content`.
   - Get `enVerses = state.en[chapterKey] || []`; if empty, show “No verses found.”
   - Build markup usable for both layouts: prefer **one DOM** that CSS restyles:
     - For each index `i`, create `.verse-row` with `data-verse-index="${i}"`, children: `.verse-num`, `.lang-en .verse-text`, `.lang-ta .verse-text`, `.lang-sn .verse-text` (empty string if missing).
   - CSS: desktop = grid columns on `.verse-row`; mobile = stack within `.verse-row`.
4. Wire chapter change → `reader.resetToStart()` + `renderChapter` + save prefs.
5. Wire tamil/sinhala toggles → toggle `hide-ta`/`hide-sn` on `#content`, save prefs.
6. Wire theme select → set `data-theme`, save.
7. Init `BibleReader` after first render; on each re-render call `reader.resetToStart()` so highlight binds to new nodes (reader uses `getVerseElements: () => content.querySelectorAll(".verse-row")`).
8. Initial load: prefs → books → select book (saved or Genesis) → load → chapter → render → reader.
9. On fetch failure: `#content` text “Couldn’t load this book. Try again.”

- [ ] **Step 4: Syntax check**

```bash
node --check docs/js/app.js
```

Expected: exit 0.

- [ ] **Step 5: Manual verification**

```bash
cd docs && python3 -m http.server 8080
```

Checklist:

- [ ] Genesis 1 and John 3 load
- [ ] Song of Solomon loads (spaces in filename)
- [ ] Uncheck Tamil/Sinhala; English remains; layout reflows
- [ ] Light / Dark / High contrast switch + survive reload
- [ ] Play → pause → play; prev/next; speed; stops at chapter end
- [ ] Resize across 768px: columns vs stacked per verse
- [ ] Book/chapter change cancels speech and resets highlight

- [ ] **Step 6: Commit**

```bash
git add docs/js/app.js docs/index.html docs/css/style.css
git commit -m "Wire Bible Reader data loading, render, and preferences"
```

---

### Task 4: Polish + spec alignment pass

**Files:**
- Modify: `docs/css/style.css`, `docs/index.html`, `docs/js/app.js`, `docs/js/reader.js` as needed

- [ ] **Step 1:** Fix any gaps from manual checklist (focus rings, disabled button styles, empty Tamil cell when missing).
- [ ] **Step 2:** Ensure sticky toolbar does not cover active verse when scrolling (padding-top on `main`).
- [ ] **Step 3:** Final commit

```bash
git add docs/
git commit -m "Polish Bible Reader UI for themes, a11y, and mobile"
```

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| Multi-file layout | 1–3 |
| Book + chapter selects, OT/NT groups | 3 |
| English always on; TA/SN toggles | 1, 3 |
| Desktop columns / mobile stack | 1 CSS |
| Speech play/pause/prev/next/speed/highlight | 2, 3 |
| Light / Dark / High contrast | 1, 3 |
| localStorage prefs | 3 |
| Fetch error + empty chapter | 3 |
| docs only / vendor legacy | Global |
| No jQuery | 1 |

## Execution

After plan save: implement Task 1 → 4 in order (inline or subagent-driven).
