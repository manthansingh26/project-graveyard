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

### Test & Build Verification Output

```
> project-graveyard@0.0.0 test
> node --test src/score.test.js src/utils.test.js

✔ seed scores match the Round 1 PPT (0.718369ms)
✔ dormancy bonus is capped and never negative (0.12779ms)
✔ score stays inside 0-100 at the extremes (0.1331ms)
✔ breakdown points add up to the total (0.219128ms)
✔ parses full GitHub URLs and owner/repo shorthand (1.462648ms)
✔ monthsSince counts whole months and never goes negative (0.166729ms)
✔ calculatePlanProgress computes task count, percentage, and allDone state (0.771828ms)
✔ buildRevivalPlan builds checklist from unfinished items + final ship task (0.507589ms)
✔ calculateGraveyardInsights calculates accurate distribution and stats (0.307169ms)
✔ mergeActivityFeed gathers all project logs in reverse-chronological order (7.923346ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 68.752741

> project-graveyard@0.0.0 lint
> oxlint

Found 0 warnings and 0 errors.
Finished in 34ms on 7 files with 104 rules using 8 threads.

> project-graveyard@0.0.0 build
> vite build

vite v8.3.5 building client environment for production...
transforming (435) src/index.css✓ 435 modules transformed.
rendering chunks (1)...computing gzip size...
dist/index.html                   2.42 kB │ gzip:   0.99 kB
dist/assets/index-qFMBmEgc.css   37.47 kB │ gzip:   7.49 kB
dist/assets/index-CjhOZxsR.js   419.12 kB │ gzip: 130.04 kB

✓ built in 220ms
```

---

# QA Report — Project Graveyard v3 (Oct 23, 2026 — v2 checks + Round 2 increments)

## v3 additions (Oct 23, while organisers' brief is still pending)
- [x] Bury-from-GitHub: parses full URLs and owner/repo shorthand (unit-tested), fetches the public GitHub REST API, auto-fills title/description/tags/dormancy from `pushed_at`, links the repo in the Autopsy
- [x] GitHub error paths handled in UI: 404 (not found/private), 403 (rate limit), network failure — all fall back to manual entry with a clear message. The 403 path was exercised live during QA (shared-IP rate limit) and behaves as designed.
- [x] Revival-ready badge on dormant projects with score ≥ 80; Copy-summary button in Autopsy (clipboard, with copied confirmation)
- [x] Tests now 6/6 (score suite + utils suite); lint 0/0; production build passes; re-verified from a clean unzip of the v3 zip

---

# QA Report — Project Graveyard v2 (Oct 22, 2026, night build)

Verified from a CLEAN unzip of the delivered zip (not just the working folder):

| Check | Result |
|---|---|
| `npm install` from clean unzip | ✅ Pass |
| `npm test` — score formula unit tests | ✅ 4/4 pass (seed scores 82/86/76 match Round 1 PPT, dormancy cap, 0–100 bounds, breakdown sums to total) |
| `npm run lint` | ✅ 0 warnings, 0 errors |
| `npm run build` | ✅ Pass (Vite production build) |
| `npm run preview` | ✅ Serves HTTP 200 |

## Feature checklist — every item from the Round 1 PPT, checked
- [x] Graveyard dashboard with tombstone cards (name, epitaph, score, status, % built)
- [x] AutopsyView — vision / built / unfinished / honest reason
- [x] Resurrection Score with on-screen formula breakdown
- [x] RevivalPicker — Continue / Restart / Repurpose / Archive, status + archive log update
- [x] Adopt a Grave — mark adoptable, claim by name, status → Adopted
- [x] Bury form with live score preview, required-field validation
- [x] 3 sample projects pre-loaded (PulseNote, ShaderCanvas Studio, DevPulse CLI)
- [x] localStorage persistence (survives refresh), Reset demo restores seeds
- [x] Empty state "Quiet for now"
- [x] Frontend-only, no account / no backend

## Extra hardening (v2)
- [x] Search / status filter (incl. Adoptable) / 3 sort modes
- [x] Export + Import JSON with strict validation and value clamping
- [x] Revival Radar — highest-scoring dormant project auto-surfaced
- [x] Delete a grave (with confirmation)
- [x] Esc closes dialogs, background scroll locks while a dialog is open
- [x] Long titles/epitaphs wrap safely (no layout break)
- [x] Animated hero (starfield, moon, fog, hill silhouette), shimmer CTAs, animated stat counters
- [x] How It Works / Target Users / Problem→Answer sections matching the PPT, scroll-reveal
- [x] Reduced-motion support in CSS

## Known honest limits (say these if a judge asks)
- Adoption is in-app (single browser), not a cross-user public board yet — roadmap.
- No cloud sync — localStorage + JSON export is the backup story — by design.
