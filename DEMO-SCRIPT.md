# Demo Script — 15-Minute Evaluation (Google Meet)

Total eval: 30 min = 15 demo + 10 Q&A + 5 feedback. Rehearse this once out loud tonight.

## 0:00–2:00 — Problem (don't touch the screen yet)
"Every builder here has a folder they pretend doesn't exist — final-final-v2, hackathon demos, side projects. The idea, the reusable code, and the lessons all die silently. There is no system for recovery, so everyone restarts from zero. My Round 1 identified this. In Round 2, I built the system."

## 2:00–8:00 — Live demo (share the DEPLOYED link, not localhost)
1. **Dashboard**: "3 sample graves, each a tombstone card — name, epitaph, Resurrection Score, status, how much was built."
2. **Revival Radar**: "The app itself tells you which sleeping project is most worth reviving."
3. **Open PulseNote → Autopsy**: vision, what was built ✓, what's unfinished ○, honest reason it stopped.
4. **Score breakdown**: "82 = 50% idea strength, 30% completeness, 20% dormancy bonus. The formula is on screen — nothing is random."
5. **Choose a Fate → Continue & Revival Plan (The Showpiece)**:
   - Click **Continue**: status flips to Resurrected and generates a concrete **Revival Plan** from the autopsy's unfinished items + final task "Ship the revived version".
   - Check off a milestone live: progress % updates instantly (33% → 67%). Check the last item: project flips to **Revived ✓** and logs to the Archive!
   - Close modal: the tombstone card displays the glowing **Revived ✓** badge and Revival Plan progress bar! Refresh the page — it all persists (localStorage).
6. **Bury a NEW project live**: Move sliders, show the live score preview, or paste a GitHub repo URL (auto-fills description, dormancy, and tags), save it — appears in the graveyard.
7. **Adopt a Grave**: Open DevPulse CLI, adopt it with the judge's name if they offer one — status becomes Adopted.

## 8:00–11:00 — What Round 2 added
1. **Revival Plan**: Turns the autopsy from a passive memorial into an action plan with live completion tracking.
2. **Graveyard Insights**: Real-time analytics strip featuring a pure-SVG Donut chart (status distribution), Resurrection Score distribution bars, and dormancy metrics.
3. **Dynamic Tag Chips & Search**: Filter instantly across tags (`React`, `WebGL`, `CLI`) with live counts.
4. **Graveyard Chronicles (Unified Activity Feed)**: Reverse-chronological feed near footer tracking every burial, adoption, and revival milestone.
5. "Round 1 was a concept deck. Round 2 is that exact concept, working, matching the PPT feature-for-feature plus actionable revival workflows."

## 11:00–13:00 — Tech (fast)
"React 19 + Vite + Tailwind CSS v4, Framer Motion for motion, pure SVG for razor-sharp charts, localStorage for persistence — frontend-only by design: no account friction, zero backend cost, judges open one link and everything works."

## 13:00–15:00 — Impact + close
"Target users: student builders, hackathon participants, indie makers, product teams with shelved MVPs. Roadmap: cross-user adoption board, GitHub issue generator, revival reminders. An unfinished project isn't a worthless project — it just never got an autopsy. Thank you."

## Q&A traps — ready answers
- **"Score formula?"** → 50/30/20, dormancy capped at 10 months. Point at the breakdown bars.
- **"Why no backend?"** → Design choice: zero friction + privacy + instant judging. Sync is roadmap, said honestly.
- **"Is Adopt real?"** → Yes, in-app: claim by name, status + log update, persists. Cross-user public board is roadmap — say exactly that.
- **"What if I close the browser?"** → localStorage persists; Export JSON is the backup/portability story — demo it if asked.
- Never claim a feature that isn't in the live link. If it's not built, it's "roadmap".
