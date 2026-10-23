# QA Report — Project Graveyard (Oct 23, 2026 — Dawn Theme & Data Layer Pass)

## Dawn Theme & Data Layer Increments (Oct 23, 2026)
- [x] **Dawn Design Tokens Applied App-Wide**:
  - Background: Warm ivory `#FAF6EE` with subtle paper-grain dot pattern and warm soft vignette.
  - Surfaces: `#FFFFFF` cards, `#F3EEE2` inset controls/chips, `#E5DECD` hairline borders.
  - Typography: Ink `#1E2B23` high-contrast text, secondary sage `#5F7263`, Fraunces serif display, and gold `#C79A3B` / `#8A6414`.
  - Actions: Primary green `#0E9F6E` with hover `#0B8A5E`, green tint `#E2F3EA`, danger `#BC3F26`.
  - Shadows: Apple-like resting `0 1px 2px rgba(96,78,38,.05), 0 8px 24px -12px rgba(96,78,38,.16)`, hover lift with `translateY(-2px)`.
- [x] **Hero Signature Redesign**:
  - Replaced dark starfield/moon with a 2-column desktop layout (responsive stack on mobile).
  - Left column: gold uppercase eyebrow `DIGITAL AFTERLIFE FOR UNFINISHED SOFTWARE`, Fraunces headline *"Where good projects rest — until they rise again"* with gold italic accent, tagline, and two CTAs (`Bury a project` in solid green and `Fetch from GitHub` in white pill).
  - Right column: Full-framed `public/hero-dawn.webp` stone arch illustration in a 24px-radius container with resting depth shadow (no cropped arch).
- [x] **Single White Strip Stats Card**:
  - 5 segmented metrics separated by hairline dividers: Buried (`3`), Dormant (`3`), Revived / Active (`0`), Adopted (`0`), Average Score (`81`).
- [x] **Component Restyling**:
  - **Tombstone Cards**: Clean white print look, 56px rounded-14 monogram tile with tinted project accent and ink serif initials, gold score ring with centered score/100, badges (*Revival-Ready*, *Adoptable*, *Revived ✓*), and green completeness bar on `#EFEAD9` track.
  - **Revival Radar**: White card with soft green concentric rings + rotating sweep on ivory, bold gold serif score (`86 / 100`), signal subtext, and green `Open autopsy` pill.
  - **Graveyard Insights**: White cards with pure-SVG status donut chart, score distribution bars, and dormancy metrics.
  - **Unified Activity Feed**: White container with warm timeline dividers and green/gold milestone dots.
  - **Autopsy Modal & Bury Form**: White surfaces, warm backdrop `rgba(24,32,26,.45)` with blur, gold breakdown bars, green continue button, and ivory quote block with gold left border for the honest reason.
- [x] **Apple Motion & Feel System**:
  - Tactile pointer-down feedback: `active:scale-[0.97]` with 100ms ease-out on all buttons.
  - Spring-physics dialogs and bottom sheets (`stiffness: 260, damping: 30`, interruptible).
  - Focus-visible rings in `#0E9F6E` on every interactive control; focus returns to trigger element when modals close.
  - Full `prefers-reduced-motion` compliance.
- [x] **Data Layer Hardening (`src/storage.js` & `src/storage.test.js`)**:
  - Versioned storage service (`STORAGE_KEY = 'project-graveyard-v1'`, `SCHEMA_VERSION = 1`).
  - Wrapped payload format: `{ version: 1, projects: [...] }`.
  - Seamless silent migration for legacy raw-array localStorage data.
  - Resilience against corrupted data (returns `null` safely without throwing).
  - Unit-tested: 5 new tests in `src/storage.test.js` (total test suite: 15/15 green).
- [x] **Interactive Polish**:
  - Bottom-center dawn feedback toasts (~2.5s duration) on all 11 user actions.
  - Custom in-app styled confirmation modal replacing browser-native `confirm()` (0 instances of `confirm(` remain).
  - Global keyboard shortcut `/` focuses search with an in-input `<kbd>` badge.
  - Calm dawn Error Boundary fallback screen with reload and data reset utilities.
- [x] **Quality Checks**:
  - `npm test` → 15/15 pass (score + utils + storage suites).
  - `npm run lint` → 0 warnings, 0 errors (`oxlint`).
  - `npm run build` → success (Vite production build: CSS 33.98 kB, JS 429.39 kB).
  - Zero dark hexes remain in `src/` (only warm backdrop `rgba(24,32,26,.45)`).
  - Seed scores preserved: PulseNote 82, ShaderCanvas Studio 86, DevPulse CLI 76.

### Verification Output: Test, Lint, and Build

```
> project-graveyard@0.0.0 test
> node --test src/score.test.js src/utils.test.js src/storage.test.js

✔ seed scores match the Round 1 PPT (0.734829ms)
✔ dormancy bonus is capped and never negative (0.147767ms)
✔ score stays inside 0-100 at the extremes (0.149074ms)
✔ breakdown points add up to the total (0.16765ms)
✔ save -> load roundtrip works with wrapped schema (2.109799ms)
✔ loads old raw-array format seamlessly (silent migration) (0.30469ms)
✔ loads wrapped format with version (0.298485ms)
✔ corrupted data returns null without throwing (0.269045ms)
✔ clearProjects removes the storage key and returns true (1.249092ms)
✔ parses full GitHub URLs and owner/repo shorthand (1.566125ms)
✔ monthsSince counts whole months and never goes negative (0.185016ms)
✔ calculatePlanProgress computes task count, percentage, and allDone state (0.856774ms)
✔ buildRevivalPlan builds checklist from unfinished items + final ship task (0.46624ms)
✔ calculateGraveyardInsights calculates accurate distribution and stats (0.314196ms)
✔ mergeActivityFeed gathers all project logs in reverse-chronological order (7.462386ms)
ℹ tests 15
ℹ suites 0
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 86.03666

> project-graveyard@0.0.0 lint
> oxlint

Found 0 warnings and 0 errors.
Finished in 37ms on 9 files with 104 rules using 8 threads.

> project-graveyard@0.0.0 build
> vite build

vite v8.3.5 building client environment for production...
transforming (436) src/index.css✓ 436 modules transformed.
rendering chunks (1)...computing gzip size...
dist/index.html                   2.41 kB │ gzip:   0.97 kB
dist/assets/index-vj3HdIlQ.css   33.98 kB │ gzip:   7.18 kB
dist/assets/index-BWqlSvzK.js   429.39 kB │ gzip: 131.54 kB

✓ built in 236ms
```

---

# QA Report — Project Graveyard (Oct 23, 2026 — Round 2 Final Award-Level Release)

## Round 2 Final Increments (Oct 23, 2026)
- [x] **P1 — Revival Plan**: Auto-generates an editable milestone checklist from the project's unfinished autopsy items plus a final task "Ship the revived version".
  - Interactive checkboxes with instant completion state toggling and strikethrough.
  - In-place task editing and task deletion.
  - "+ Add another revival milestone" input for custom tasks.
  - Live progress % tracked in Autopsy modal and directly on Tombstone cards.
  - Auto-flips project status to **Revived ✓** upon completion of all tasks and appends to Archive Log.
  - Fully persisted in `localStorage` under `revivalPlan`.
- [x] **P2 — Graveyard Insights**: Real-time analytics strip computed directly from active projects:
  - **Pure-SVG Donut Chart**: Dynamic proportions, circumference dash calculations, and legend for Dormant, Resurrected, Revived ✓, Adopted, and Archived graves.
  - **Score Distribution Bars**: Live categorisation into 80–100 (Revival Ready), 60–79 (Promising), and 0–59 (Deep Hibernation).
  - **Dormancy & Recovery Metrics**: Average dormancy in months, revival readiness ratio, and clickable card for the oldest grave.
- [x] **P3 — Tag Chips & Unified Activity Feed**:
  - Clickable tag chips dynamically extracted from project tags with counts (e.g. `React (1)`, `WebAudio (1)`). "All" resets the filter.
  - Reverse-chronological activity feed merging every project's archive log into a unified timeline with clickable project links to inspect autopsies.
- [x] **P4 — Final Polish & SEO**:
  - Custom inline SVG favicon featuring arched tombstone, gold moon, and mint cross/RIP emblem.
  - Open Graph and Twitter Card metadata configured in `index.html`.
  - Vignette background radial gradient and custom dark scrollbars in `index.css`.
  - Mobile touch targets ≥ 44px and responsive layouts tested across 360px to 1440px.
- [x] **Pure Logic Tests**: 10/10 tests green in `src/score.test.js` and `src/utils.test.js`.
- [x] **Lint & Build**: `oxlint` 0 warnings/0 errors, `vite build` 100% successful.
