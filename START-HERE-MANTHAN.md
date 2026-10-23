# START HERE — Your Steps (numbered, do them in order)

The app is DONE and build-verified (npm run build passes, preview served HTTP 200).
You only do the shipping steps — that's always been our rule: I write code, you do git.

## Tonight (Oct 22) — 20 minutes
1. Unzip `project-graveyard-baloon-round2.zip` somewhere clean, e.g. `~/project-graveyard`
2. Open that folder in terminal:
   ```
   cd ~/project-graveyard
   npm install
   npm run dev
   ```
3. Open http://localhost:5173 — click every grave, open an autopsy, bury a test project, adopt DevPulse, refresh the page (data must stay), export JSON once.
4. Read UNDERSTAND-THE-PROJECT.md — it explains the whole project in super easy words, with the score maths worked out. Then read DEMO-SCRIPT.md once out loud. That is your 15 minutes tomorrow-after.
5. Optional proof check: run `npm test` — you should see 4 tests pass. Those tests prove the demo scores match your Round 1 PPT (82 / 86 / 76).

## Tomorrow (Oct 23) — when the brief drops at 10:00 AM
5. Copy-paste the EXACT brief text into the Baloon chat in Muse before writing any code.
6. We map the brief onto TWIST-GUIDE.md and add only what's required.

## Tomorrow — deploy + submit (finish by 9:00 AM Oct 24)
7. Create a GitHub repo named `project-graveyard` (public), then in the folder:
   ```
   git init
   git add .
   git commit -m "Project Graveyard — Baloon Round 2 build"
   git branch -M main
   git remote add origin https://github.com/manthansingh26/project-graveyard.git
   git push -u origin main
   ```
   (Use your own repo URL if the name differs.)
8. Go to vercel.com → Add New Project → import that repo → Framework: Vite (auto-detected) → Deploy. No env vars needed.
9. Open the Vercel link, test the FULL demo flow on the live link (not localhost).
10. Submit on Unstop: GitHub repo link + Vercel deployed link.
11. Keep the live link + your Round 1 PPT open during the Google Meet eval.

## If anything breaks
- Build error after a change: run `npm run build` and send ThinkPad the exact error text.
- Vercel deploy fails: check the build log's first red line, send it to ThinkPad. Don't random-fix.
