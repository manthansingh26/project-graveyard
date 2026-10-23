# 🪦 The Project Graveyard

**Every unfinished project deserves a second chance.**

A digital afterlife for abandoned software — built for **Baloon National Hackathon 2026, Round 2** by **Manthan Rajpurohit** (Team: Straw hat pirate), continuing the Round 1 entry *PS 05 — The Project Graveyard*.

Builders abandon projects they once cared about, and the idea, the code, and the lessons disappear with them — scattered across forgotten folders like `final-final-v2`. The Project Graveyard gives every unfinished project a structured record: what it was, what was built, what is still unfinished, and honestly, why it stopped. Then it helps you decide what happens next.

## Live flow: Bury → Autopsy → Score → Fate → Revival Plan

1. **Bury It** — Add an unfinished project with its title, epitaph, original vision, and tags.
2. **Perform the Autopsy** — Record what was built, what remains unfinished, and the honest reason work stopped.
3. **Resurrection Score** — A transparent, explainable heuristic (not random, not AI):
   `Score = 50% Idea Strength + 30% Completeness + 20% Dormancy Bonus`
   Dormancy bonus = 10 points per month away, capped at 100 — distance gives a builder fresh eyes. The Autopsy view shows the full breakdown bar-by-bar.
4. **Choose Its Fate** — **Continue** it, **Restart** smarter, **Repurpose** its modules, or **Archive** it with honour. The decision is written to the project's Archive Log.
5. **Revival Plan** — Generate an actionable, editable checklist auto-built from the project's unfinished autopsy items plus a final task "Ship the revived version". Checking off milestones tracks progress % live on the tombstone card and autopsy view, flipping the project to **Revived ✓** upon completion.
6. **Adopt a Grave** — Mark a project adoptable, and another builder can claim it by name and give it a second life.

## Features

- Tombstone-card graveyard dashboard with live stats (buried / dormant / resurrected & revived / adopted / average score)
- **Revival Radar** — automatically surfaces the highest-scoring dormant project ("if you revive one this weekend, the data says this one")
- Full **Autopsy View** with score breakdown, fate picker, adoption flow, and archive log
- **Revival Plan (Action Checklist)** — auto-built from unfinished autopsy items, editable milestones, live progress % on tombstone card, and auto-transition to **Revived ✓** state when completed
- **Graveyard Insights** — real-time analytics section between the grid and info sections:
  - **Pure-SVG Donut Chart** visualizing project status distribution (Dormant, Resurrected, Revived ✓, Adopted, Archived)
  - **Score Distribution Bars** (0–59 Deep Hibernation / 60–79 Promising / 80–100 Revival Ready)
  - **Dormancy & Recovery Metrics** showing average dormancy in months, revival readiness ratio, and direct link to the oldest grave
- **Tag Filter Bar** — clickable tag chips dynamically derived from active projects with live counts to filter the grid instantly
- **Graveyard Chronicles (Unified Activity Feed)** — reverse-chronological timeline aggregating every project's burial, fate decision, adoption, and revival milestone into a single readable feed
- Bury-a-project form with a **live Resurrection Score preview** as you move the sliders
- **Bury straight from GitHub** — paste a public repo URL and the form auto-fills name, description, language/topics, dormancy (from last push), and links the repo (GitHub REST API, no key; friendly fallback if rate-limited)
- **Revival-ready badge** on dormant projects scoring 80+, and a **Copy summary** button in every Autopsy (shareable text card of the grave)
- Score + GitHub + Revival Plan + Insights helpers are pure functions in `src/score.js` and `src/utils.js`, covered by **10 unit tests**
- Search (title / tag / vision), filters (status + adoptable + revived), sorting (score / recent / longest dormant)
- 3 pre-loaded sample projects — PulseNote (82), ShaderCanvas Studio (86), DevPulse CLI (76) — matching the Round 1 deck exactly
- **Export / Import JSON** — your graveyard is portable; **Reset demo** restores the sample data
- Empty state with personality: *"Quiet for now — bury your first unfinished build."*
- Polished aesthetics: inline SVG tombstone favicon, Open Graph & Twitter meta tags, subtle vignette radial gradient, custom dark scrollbar, and Framer Motion transitions
- Mobile-first: autopsy opens as a bottom sheet on small screens, touch targets ≥ 44px
- **Frontend-only by design** — no account, no backend, no server cost. Everything persists in the browser via `localStorage`.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | React + Vite | Component-driven (`TombstoneCard`, `AutopsyView`, `RevivalPlanSection`, `GraveyardInsights`, `TagFilterBar`, `ActivityFeed`, `BuryForm`), instant dev/build |
| Styling | Tailwind CSS v4 | Rapid, consistent dark "calm cemetery" design system with vignette radial gradients |
| Persistence | localStorage | Zero-backend persistence of projects, autopsies, scores, revival plans, and logs in the browser |
| Animation | Framer Motion | Restrained card movement, score and modal transitions (respects `prefers-reduced-motion`) |
| Charts | Pure SVG | Zero external chart libraries; lightweight, razor-sharp, reactive donut chart and progress bars |
| Deployment | Vercel | Static build, live link judges can open immediately |

## Run it locally

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # unit tests for score formula & pure helpers (node --test)
npm run lint      # oxlint static analysis
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Project structure

```
src/
  App.jsx          # Entire app UI: seed data, dashboard, autopsy, revival plan, insights, tag bar, activity feed, bury form
  score.js         # Resurrection Score logic ONLY — pure functions, easy to explain to judges
  score.test.js    # Unit tests (node:test) proving seed scores match the Round 1 deck: 82 / 86 / 76
  utils.js         # Pure helpers: GitHub parsing, months-since, plan progress, plan builder, insights, activity merger
  utils.test.js    # Unit tests for pure helpers
  main.jsx         # Entry point
  index.css        # Tailwind + graveyard theme (starfield, moon, fog, shimmer CTA, vignette, custom scrollbars)
index.html         # Inline SVG favicon, SEO & Open Graph meta tags
```

All state lives in `App.jsx` under the localStorage key `project-graveyard-v1`. The pure score and calculation logic lives in `src/score.js` and `src/utils.js` and is covered by automated tests — `npm test` runs 10 tests across both suites.

## Why this wins

- **Distinctive concept** — a cemetery for projects, never a place of shame. Memorable in a room of generic dashboards.
- **Lived experience** — every student, hackathon participant, and indie maker has a folder full of dead projects. The problem needs no explaining.
- **Action tool, not just an archive** — the new Revival Plan turns past autopsies into actionable checklists that guide projects back to life.
- **Realistic scope, fully shipped** — frontend-only, but every promised feature in the Round 1 deck and Round 2 increments actually works end-to-end in the live link.
- **Honest by design** — the autopsy forces the *real* reason a project stopped. That honesty is the product.

## Roadmap (post-hackathon)

- Public adoption board so builders can discover and claim graves across the community
- GitHub sync & issue converter from Revival Plan tasks
- Revival reminders ("PulseNote has been dormant 6 months — its score just crossed 80")
- Optional peer review notes on project autopsies

---
*Honouring past code so good ideas never stay buried.*
