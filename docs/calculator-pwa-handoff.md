# Inch Calc PWA handoff

This handoff documents the calculator PWA currently kept in this repository, how it works under the hood, and why the implementation is shaped the way it is. The short version: **Inch Calc is a single-page, installable tape-measure calculator for shop math.** It optimizes for fast thumb entry of inches, fractions, feet, memory values, and reusable job presets while always showing both a rounded tape-friendly answer and an exact decimal answer.

## Repository map

| File | Role | Notes |
| --- | --- | --- |
| `calc_screens.html` | Main deployed calculator page | A complete single-file app: HTML, CSS, and JavaScript live together. The service worker currently precaches this file. |
| `calc_screens2.html` | Newer/enhanced calculator variant | Superset-style version with the same calculator core plus saved equations, a vertical memory-set manager, and a hinge/style marker tool. It is not currently listed in `sw.js` precache assets. |
| `sw.js` | PWA service worker | Handles install, activate, cache cleanup, navigation fetches, same-origin assets, and cross-origin CDN fallbacks. |
| `README.md` | Repo overview | General demo index; now links to this handoff. |

> Important deployment note: both calculator HTML files reference `manifest.webmanifest`, `apple-touch-icon.png`, calculator icons, and `layout-landscape.css`, but those assets are not present in the current repository snapshot. The service worker also precaches several of those missing PWA assets. Before treating installability as complete, add those files or update the references/cache list.

## Product intent

Inch Calc is meant to feel closer to a physical tape and construction calculator than a generic phone calculator:

- Enter whole inches with a numeric keypad.
- Add common sixteenth-inch fractions with one tap.
- Enter or preview feet without leaving the inch-based math model.
- Keep the result visible as a **mixed fraction rounded to the nearest 1/16 inch** and as an **exact decimal**.
- Render a live tape strip with the red center mark pinned to the current result.
- Save frequently used numbers or job-specific memory sets.
- Copy result text directly from the display.
- Install as a PWA and work from cache when the necessary assets exist.

The central UX decision is that the app should preserve the way a user thinks on a job site: `42 1/4 + 2.375 + 9/16` should be easy to enter and should remain readable in the history instead of being normalized into opaque decimal-only math.

## Architecture overview

The calculator is intentionally lightweight and framework-free:

1. **Static HTML shell** defines the bezel, tape, result display, memory row, keypad, fraction grid, modal tools, install/update toast, and copy toast.
2. **Inline CSS** controls the whole visual system: calculator body, physical-looking bezel, tape strip, responsive key sizing, modal carousel, memory tooling, and helper cards.
3. **Inline JavaScript IIFE** owns all state and behavior. It closes over token arrays, memory slots, display mode, modal state, and helper functions instead of using modules or build tooling.
4. **math.js from CDN** performs expression evaluation. App code still controls formatting, token display, feet conversion, memory persistence, and tape rendering.
5. **Service worker** adds offline/PWA behavior using a named cache and a mix of network-first and cache-first strategies.

This architecture favors GitHub Pages compatibility and quick iteration over strict separation of concerns. There is no bundler, package manager, test runner, or server dependency.

## UI layout and responsive sizing

The visible calculator is a three-zone grid:

1. **Bezel area**: physical display frame containing the live tape and the result/history display.
2. **Memory row**: clear/memory controls.
3. **Keypad area**: numeric/operator controls plus the fraction grid.

The layout solver (`computeTile`) calculates gap sizes, line heights, result panel minimums, and final button tile size based on the current card dimensions. This avoids brittle fixed breakpoints and keeps the app usable on narrow mobile screens. The solver also redraws the tape after layout changes so the center line stays visually aligned.

Reasoning behind the dynamic solver:

- Minimum tap size is protected for touch use.
- The results display gets enough room for history plus one output line before the keypad claims space.
- The same `--tile` variable drives both number/operator buttons and fraction tiles, keeping the calculator visually consistent.
- `ResizeObserver`, `resize`, and `orientationchange` events are all watched because mobile browsers can change usable viewport height after URL-bar, safe-area, or orientation changes.

## Calculator state model

The core calculator keeps a small set of mutable state values:

- `tokens`: the numeric/operator expression passed to math.js.
- `tokenDisplays`: the user-facing labels for matching tokens, preserving mixed fractions and feet notation.
- `currentEntry`: the in-progress number or fraction string that has not yet been committed to `tokens`.
- `measure`: a feet-builder object with `{ active, feet, inches, inEntry }` for entering values like `1′ 6 1/2″`.
- `displayMode`: either `inch` or `feet`, used mainly for long-press feet preview.
- `lastGood`: the last successfully evaluated result, used to keep the display/tape stable after invalid transient input.
- `memorySlots`: saved numeric inch values.

The most important design choice is that **all math is normalized to inches internally**. Feet are treated as input/display notation, not as a separate unit system in the expression engine. That keeps addition, subtraction, multiplication, division, memory recall, and saved equations predictable.

## Expression and history pipeline

The expression pipeline has two parallel concerns:

1. **Evaluation correctness**: build a math.js-safe expression from numeric inch values and operators.
2. **History readability**: render the sequence as the user typed it, including fractions, mixed numbers, feet symbols, inch symbols, and precedence parentheses where useful.

Typical flow:

1. User taps number/fraction/operator buttons.
2. Input handlers update `currentEntry`, `measure`, `tokens`, and `tokenDisplays`.
3. `updateInput()` calls history rendering.
4. `qEval()` debounces evaluation to avoid excessive recalculation during rapid taps.
5. `evaluate()` joins tokens, includes any live entry/measure as a preview, calls math.js, and formats the result.
6. `drawTape()` redraws sixteenth-inch ticks around the evaluated result.

The debounce is short enough to feel instant but prevents unnecessary redraw/evaluation churn on quick input sequences.

## Result formatting

The app deliberately shows two result forms:

- **Left/fraction line**: rounded to the nearest 1/16 inch and displayed as a tape-friendly mixed fraction. If rounding changed the exact value, a `▴` or `▾` arrow is prepended to show whether the true value is above or below the displayed fraction.
- **Right/decimal line**: exact decimal formatted to four places, not snapped to sixteenths.

The reason for dual output is practical: the fraction is what a tape measure can mark quickly, while the decimal confirms precision and is useful for copying into other tools.

Feet formatting follows the same philosophy. Long-pressing `Ft` switches display mode to feet temporarily, showing the rounded feet/inches result on the left and exact decimal feet on the right without changing the underlying expression.

## Fractions, feet, and mixed numbers

Fraction buttons are first-class inputs rather than text shortcuts:

- If no number is active, tapping `1/2` starts a fractional entry.
- If a whole number is active, tapping `1/2` commits a mixed value such as `1 1/2` while storing the numeric inch total internally.
- If a measure-builder is active, fractions add to the inch portion of the feet/inches value.
- Otherwise, fractions can start a new addend after inserting an implicit `+`.

The `Ft` button has two behaviors:

- **Tap**: commit the current whole/decimal/fraction as feet, or start a feet/inch builder for whole-foot input.
- **Long-press/keyboard hold**: temporarily preview the current result in feet.

This split is intentional: tap changes input semantics; hold changes display semantics only. That lets users quickly check a result in feet without corrupting their inch-based expression.

## Tape renderer

The tape is not a static image. It is generated in the DOM each time a result/layout changes:

- The visible window spans a fixed number of inches across the current tape width.
- Ticks are created at 1/16-inch intervals around the current center value.
- Full-inch ticks get number labels.
- Half/quarter/sixteenth marks get different visual heights.
- The red center line is positioned by pixel math after measuring the rendered tape width.

The tape clamps negative centers to zero, which matches the physical metaphor: the display does not scroll left of the start of a tape. The center-line override exists because CSS percentages and transforms can produce sub-pixel visual drift on different screens.

## Memory systems

There are two memory approaches in the repository:

### `calc_screens.html`: memory slots plus mini-carousel groups

The main page supports four live memory slots and a memory-center carousel. Slots store numeric inch values in `localStorage` under `calcMemorySlots_uniform420`. Legacy string values are migrated back to numeric inch values when memory loads.

Memory interactions:

- Tap an empty memory slot to save the current result.
- Tap a filled memory slot to recall it.
- Double-click or long-press a filled slot to store/replace.
- `MC` opens the Memory Center instead of immediately wiping state.
- Memory groups can save a set of slots and be swiped/loaded later.

### `calc_screens2.html`: saved equations and vertical memory sets

The enhanced page adds:

- Saved equations under `calcSavedEquations_v1`.
- Memory sets under `inchCalc.memorySets.v2`.
- A vertical memory-set list with editable names, load buttons, delete buttons, and duplicate detection.
- A saved-equation loader that can replace the current expression with the saved result after confirmation.

This is more suitable for handoff as a product direction, but the service worker currently precaches `calc_screens.html`, so deployment should be clarified before promoting `calc_screens2.html` as canonical.

## Tools modal

The tools modal is a carousel-style overlay opened from the `Tools` button. It keeps secondary workflows out of the main keypad while staying inside the same app shell.

Current cards include:

- App guide/home.
- Saved equations (`calc_screens2.html`).
- Memory Center.
- Hinge/Style Marker (`calc_screens2.html`).
- Info / release notes.

The carousel exposes a small `window._cmOpen`, `window._cmGoTo`, and `window._cmIndexOf` API so other controls can jump to a particular card without coupling to carousel internals.

## Hinge/Style Marker helper (`calc_screens2.html`)

The hinge/style marker is a lightweight spacing helper inside the tools modal. It accepts a door width in feet and inches, computes total inches, chooses approximately 24-inch spacing, and renders interior chalk marks as formatted inch labels using the same result formatter as the calculator.

Decision rationale:

- Reusing `formatResultInch()` keeps helper output consistent with the calculator display.
- Clamping inches to `0–11` prevents invalid feet/inches combinations.
- Widths under 24 inches report that no chalk line is needed.
- Keeping it modal-scoped avoids expanding the primary keypad UI.

## Copy, gestures, and touch details

The app includes several mobile-specific details:

- Button text selection/context menus are blocked only for controls, not for history/output areas.
- Output lines are copy-on-tap with a toast fallback.
- Memory and feet controls use long-press timing with click suppression to avoid accidental duplicate actions after touchend.
- The enhanced page has direction-locked gesture helpers so carousel-like areas can distinguish horizontal swipes from vertical scrolling.
- Buttons get ripple/press/hold visuals for feedback on touch screens.

The underlying reason is that mobile browsers often synthesize clicks after touch events; the guard flags prevent long-press actions from also firing normal click behavior.

## PWA/service worker behavior

`sw.js` uses one cache name, `inch-calc-v2`, and a static `ASSETS` list. During install it opens the cache, adds all listed assets, and calls `skipWaiting()`. During activation it deletes old caches and claims clients.

Fetch strategy:

- Navigations and HTML requests: **network-first**, then cache fallback.
- Same-origin assets: **cache-first**, then fetch and cache.
- Cross-origin assets such as CDN scripts/fonts: **network-first**, then cache fallback.
- A `message` listener accepts `skipWaiting` for update activation.

This mix is reasonable for a PWA that should refresh HTML quickly when online but still work offline after assets are cached. However, because missing assets in `ASSETS` can make `cache.addAll()` reject, the current asset inventory should be fixed before relying on offline install behavior.

## Major implementation decisions and reasons

| Decision | Reason |
| --- | --- |
| Normalize all values to inches internally | Avoids unit bugs and lets math.js evaluate a plain numeric expression. |
| Keep display tokens separate from math tokens | Preserves user intent in history without compromising evaluation. |
| Round only the left result to 1/16 inch | Matches tape-measure workflow while keeping exact decimal precision visible. |
| Show rounding arrows | Prevents rounded fractions from silently overstating/understating the exact result. |
| Use a live DOM tape instead of an image | Enables arbitrary results, responsive width, and pixel-perfect center alignment. |
| Use inline single-file app structure | Works easily on GitHub Pages and avoids build tooling for a small app. |
| Use localStorage for memories/equations | Simple offline persistence without accounts or backend infrastructure. |
| Use long-press for preview/store actions | Keeps the keypad compact while exposing power-user actions. |
| Use modal carousel for tools | Preserves primary calculator focus and keeps related utilities one tap away. |
| Use service worker network-first for HTML | Lets deployed updates appear quickly while retaining offline fallback. |

## Known gaps and risks

1. **Missing PWA assets**: `manifest.webmanifest`, icons, and `layout-landscape.css` are referenced but absent in this snapshot.
2. **Service worker precache mismatch**: `sw.js` lists missing assets and only precaches `calc_screens.html`, not `calc_screens2.html`.
3. **Two calculator variants**: decide whether `calc_screens.html` or `calc_screens2.html` is canonical, then archive/rename the other or document it as experimental.
4. **CDN dependency**: math.js and Typekit require network on first load unless successfully cached after an online visit.
5. **No automated tests**: the app relies on browser behavior and manual verification. Pure functions such as formatting/parsing would be good candidates for extraction and unit tests.
6. **Inline code size**: the enhanced file is large enough that refactoring into modules would improve maintainability if the project grows.
7. **Prompts/confirms**: memory naming and destructive actions use blocking browser dialogs, which are simple but can feel dated and are hard to style/test.
8. **LocalStorage migration**: current loaders are defensive, but future schema changes should keep explicit versioned keys and migration notes.

## Recommended next steps

1. **Pick the canonical calculator page.** If `calc_screens2.html` is the intended future, update `sw.js`, landing links, and file naming accordingly.
2. **Restore/add PWA assets.** Add `manifest.webmanifest`, referenced icons, and any missing CSS, or remove references that should no longer exist.
3. **Update service worker cache list.** Keep `ASSETS` aligned with real files and bump `CACHE_NAME` whenever cache behavior changes.
4. **Extract pure math/formatting helpers.** Move parsing, formatting, rounding, and memory serialization into testable modules if build tooling is acceptable.
5. **Add a browser smoke test.** At minimum, verify key workflows: `1 + 1/2`, feet tap, feet hold, memory save/recall, copy output, modal open, and offline reload.
6. **Document manual release steps.** Include cache bump, asset check, PWA install check, and GitHub Pages verification.

## Handoff checklist for a new maintainer

- Start with `calc_screens2.html` if you need the newest product ideas; start with `calc_screens.html` if you need the currently precached app.
- Keep math tokens and display tokens separate; do not replace `tokenDisplays` with raw numeric strings unless you are intentionally changing history UX.
- Preserve inch-normalized internal values when adding feet-related features.
- When changing result formatting, check both fraction output and exact decimal output.
- When changing layout CSS, test portrait mobile, landscape mobile, and desktop width because `computeTile()` depends on measured card dimensions.
- When changing service worker assets, test first-load, reload, offline reload, and update-toast behavior.
- Treat `localStorage` keys as public data contracts; users may already have saved memories and equations.
