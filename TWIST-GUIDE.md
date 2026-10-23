# Twist Guide — When the Round 2 Brief Drops (Oct 23, 10:00 AM)

Send the exact brief text to ThinkPad in the Baloon chat FIRST, before coding. Then match it here:

## If the twist is COLLABORATION / community
Already built: Adopt a Grave (claim by name, status, archive log).
Add if required: an "Adoption Board" view = filter is already there (Adoptable filter). Rename a section, don't rebuild.

## If the twist is an EXTRA FEATURE
Fast adds that fit this codebase (each < 1 hour, all in src/App.jsx):
- Search / filter / sort → ALREADY BUILT. Just demo it.
- Export / share → Export JSON already built. Add "Copy summary" button if they want sharing.
- Reminders / nudges → Revival Radar already built. Extend: badge on cards with score ≥ 80 ("Revival ready").
- Categories / tags → tags already exist; add a tag filter row.
- Timeline / history → Archive Log per project already exists.

## If the twist asks for BACKEND / login
Do NOT rebuild the app in a panic. Answer: persistence is localStorage by design; if a backend is mandatory, add a simple optional sync later — spend your hours on the graded features first, and say this honestly in the eval.

## If the twist is a SPECIFIC required feature not listed here
1. Build the smallest version that visibly works in the live link.
2. Put it on the FIRST screen or inside the Autopsy — judges can't grade what they can't find.
3. Update README's feature list + DEMO-SCRIPT section 8–11 with one sentence per requirement.
4. Re-deploy and re-test the live link before submitting.

## Golden rules for the 24 hours
- Working live link > more features. Deploy early, deploy often.
- Every brief requirement must be visible and clickable in the deployed app.
- Submit repo + deployed link by 9:00 AM Oct 24, not 9:59.
- You do all git steps yourself (create repo, commit, push) — agents write code, you ship it.
