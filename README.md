# 🪦 The Project Graveyard

**Every unfinished project deserves a second chance.**

A digital afterlife for abandoned software — built for **Baloon National Hackathon 2026, Round 2** by **Manthan Rajpurohit** (Team: Straw hat pirate), continuing the Round 1 entry *PS 05 — The Project Graveyard*.

> *"Projects rest at night, they rise at dawn."*
> Restyled with a serene, print-inspired **Dawn Theme** — warm ivory `#FAF6EE`, white `#FFFFFF` cards with hairline `#E5DECD` borders, tactile Apple-style spring micro-interactions, and gold & green accents.

Builders abandon projects they once cared about, and the idea, the code, and the lessons disappear with them — scattered across forgotten folders like `final-final-v2`. The Project Graveyard gives every unfinished project a structured record: what it was, what was built, what is still unfinished, and honestly, why it stopped. Then it helps you decide what happens next.

## Live flow: Bury → Autopsy → Score → Fate → Revival Plan

1. **Bury It** — Add an unfinished project with its title, epitaph, original vision, and tags (or auto-fill directly from a public GitHub repo).
2. **Perform the Autopsy** — Record what was built, what remains unfinished, and the honest reason work stopped.
3. **Resurrection Score** — A transparent, explainable heuristic (not random, not AI):
   `Score = 50% Idea Strength + 30% Completeness + 20% Dormancy Bonus`
   Dormancy bonus = 10 points per month away, capped at 100 — distance gives a builder fresh eyes. The Autopsy view shows the full breakdown bar-by-bar.
4. **Choose Its Fate** — **Continue** it, **Restart** smarter, **Repurpose** its modules, or **Archive** it with honour. The decision is written to the project's Archive Log.
5. **Revival Plan** — Generate an actionable, editable checklist auto-built from the project's unfinished autopsy items plus a final task "Ship the revived version". Checking off milestones tracks progress % live on the tombstone card and autopsy view, flipping the project to **Revived ✓** upon completion.
6. **Adopt a Grave** — Mark a project adoptable, and another builder can claim it by name and give it a second life.

## Features

- **Dawn Design System**: Warm ivory background (`#FAF6EE`) with subtle paper grain texture, crisp white cards (`#FFFFFF`), hairline warm borders (`#E5DECD`), ink typography (`#1E2B23`), and warm Apple-like depth shadows.
- **Hero & Dawn Arch Illustration**: 2-column desktop layout pairing the signature gold-accented headline with the full-framed dawn arch visual (`hero-dawn.webp`), and direct CTAs (*Bury a project* & *Fetch from GitHub*).
- **Single White Strip Stats Card**: 5 segmented counters separated by hairline dividers (Buried / Dormant / Revived & Active / Adopted / Average Score).
- **Revival Radar**: Concurrently sweeps soft green concentric radar rings on ivory, dynamically spotlighting the highest-scoring dormant project with giant gold serif score typography (`86 / 100`).
- **Clean Monogram Print Cards**: 56px rounded-14 monogram tile with project initials and tint, SVG score ring, completeness progress track, badges (*Revival-Ready*, *Adoptable*, *Revived ✓*), and live Revival Plan progress indicator.
- **Revival Plan (Action Checklist)**: Auto-built from autopsy unfinished items, interactive milestone checkboxes, in-place editing, milestone additions/deletions, and automatic transition to `Revived ✓`.
- **Graveyard Insights**: Real-time analytics strip featuring:
  - **Pure-SVG Donut Chart** showing status distribution (Dormant, Resurrected, Revived ✓, Adopted, Archived)
  - **Score Distribution Bars** (0–59 Deep Hibernation / 60–79 Promising / 80–100 Revival Ready)
  - **Dormancy & Recovery Metrics** (average dormancy in months, revival readiness ratio, oldest grave link)
- **Tag Filter Bar & Search**: Dynamic tag chips with live counts, search box with `/` keyboard focus shortcut and `<kbd>` hint.
- **Graveyard Chronicles (Unified Activity Feed)**: Reverse-chronological timeline aggregating all burials, fate decisions, adoptions, and completed revival tasks.
- **Bury-from-GitHub**: Fast public GitHub API auto-fill for repo name, description, tags/languages, and dormancy months.
- **Apple-Inspired Motion**: Spring physics (`stiffness: 260, damping: 30`) on dialogs/toasts, active pointer-down feedback (`active:scale-[0.97]`), focus restoration, and full `prefers-reduced-motion` compliance.
- **Hardened Data Layer**: Versioned schema with migration, corruption fallback, and feedback toasts.
- **Custom In-App Confirm Dialogs**: Eliminates all browser-native `confirm()` popups.
- **Resilient Error Boundary**: Calm dawn fallback screen with reload and data reset utilities.

## Architecture

The application is structured into three clean, decoupled layers:

1. **Presentation Layer (`src/App.jsx`, `src/index.css`)**:
   - Modern React 19 component tree styled with Tailwind CSS v4 design tokens.
   - Framer Motion animation system for physics-based spring transitions and tactile button responses.
   - Responsive layouts optimized for 360px mobile viewports through 1440px desktop displays.

2. **Logic Layer (`src/score.js`, `src/utils.js`)**:
   - Pure, deterministic functions: Resurrection Score heuristic, breakdown point distributor, Revival Plan milestone builder, Graveyard Insights analytics, and reverse-chronological log merger.
   - Covered by comprehensive automated unit tests (`src/score.test.js`, `src/utils.test.js`).

3. **Data Layer (`src/storage.js`, `src/storage.test.js`)**:
   - Versioned storage service (`STORAGE_KEY = 'project-graveyard-v1'`, `SCHEMA_VERSION = 1`).
   - Seamless silent migration for legacy raw-array localStorage data to wrapped `{ version: 1, projects: [...] }`.
   - Complete resilience against corrupted JSON (falls back safely to default seed data without throwing errors to the UI).
   - Storage adapter design makes the client trivially swappable for Supabase or cloud backends post-hackathon.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 19 + Vite | Component-driven architecture, instant HMR, tiny production bundles |
| Styling | Tailwind CSS v4 | Dawn design system, warm ivory palette, Apple-like shadow tokens |
| Motion | Framer Motion | Spring-physics dialogs, interruptible gestures, reduced-motion support |
| Data & Storage | Versioned localStorage | Zero-backend persistence, migration support, portable JSON export/import |
| Charts | Pure SVG | Zero external dependencies; reactive donut charts & score bars |
| Deployment | Vercel | Static CDN deployment ready for immediate live judging |

## Run it locally

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # 15 automated unit tests across score, utils, and storage
npm run lint      # oxlint static analysis (0 warnings, 0 errors)
npm run build     # production build → dist/
npm run preview   # preview production build on http://localhost:4173
```

## Project structure

```
src/
  App.jsx          # UI: dawn theme layout, hero, radar, cards, autopsy, revival plan, insights, activity feed
  score.js         # Resurrection Score pure logic (50/30/20 formula)
  score.test.js    # Unit tests proving seed scores: 82 / 86 / 76
  storage.js       # Versioned data layer ({ version: 1, projects }) with migration & fallback
  storage.test.js  # Storage unit tests (roundtrip, migration, corrupted data resilience)
  utils.js         # Pure helpers: GitHub parsing, plan builder, progress calculator, insights, activity merger
  utils.test.js    # Unit tests for pure helpers
  main.jsx         # App entry point with React root
  index.css        # Dawn theme styling, paper grain, tokens, shadows, tactile feel
index.html         # Inline SVG dawn favicon, theme-color (#FAF6EE), SEO & Open Graph meta
```

## Why this wins

- **Distinctive concept** — a cemetery for projects, never a place of shame. Memorable in a room of generic dashboards.
- **Lived experience** — every student, hackathon participant, and indie maker has a folder full of dead projects.
- **Action tool, not just an archive** — the Revival Plan turns past autopsies into actionable checklists that guide projects back to life.
- **High taste level** — calm, warm dawn aesthetics, editorial typography, and Apple-grade tactile feedback.
- **Realistic scope, fully shipped** — frontend-only, tested, hardened, and working end-to-end.

---
*Projects rest at night, they rise at dawn.*
