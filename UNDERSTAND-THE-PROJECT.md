 
 # Understand The Project — In Super Easy Words

Read this one file and you can explain the whole project to anyone, including the judges.
No heavy words. Everything is in simple language.

---

## 1. What is this project? (One line)

**The Project Graveyard is a website where you save your dead / unfinished projects properly — like a graveyard for apps — so you can bring the good ones back to life later.**

That's it. If a judge asks "what did you build?", say this one line first.

## 2. Why does this problem exist? (The story)

Every student and developer has this folder on their laptop:

```
final-project/
final-project-v2/
hackathon-demo/
side-idea/
old-app-dont-delete/
```

They started these projects with full excitement. Then exams came, or the hackathon ended, or the idea became too big — and the project just… died silently.

Three things die with it:
1. **The idea** — why you started it
2. **The code** — parts that could be reused in the next project
3. **The lesson** — why it stopped, so you don't repeat the same mistake

**Our app saves all 3 things before they are forgotten.**

## 3. How does the app work? (4 simple steps)

Think of it like a real hospital + graveyard story:

```
STEP 1: BURY IT          →  You add your dead project to the website.
STEP 2: AUTOPSY          →  You write: what was the idea, what you finished,
                            what is left, and honestly why you stopped.
STEP 3: SCORE + FATE     →  The app gives a "Resurrection Score" and you
                            decide: continue it, restart it, reuse its parts,
                            or close it forever.
STEP 4: RESURRECT / ADOPT → You bring it back — OR another person adopts
                            your dead project and finishes it.
```

Autopsy = the doctor's report after something dies. Here it means: a proper report of the project.

## 4. The Resurrection Score — explained with maths

This is the question judges WILL ask. Learn this example.

The score is **NOT random. NOT AI.** It is a simple formula:

```
Score = (Idea Strength × 50%) + (Completeness × 30%) + (Dormancy Bonus × 20%)
```

- **Idea Strength** — How good was the idea? (you rate it 0–100)
- **Completeness** — How much did you already build? (0–100%)
- **Dormancy Bonus** — How long has it been sleeping? 10 points per month, max 100.
  Why give points for being old? Because when you come back after months, you see the project with fresh eyes. Old ≠ useless.

### Worked example — PulseNote (one of the demo projects)

- Idea Strength = 92 → 92 × 50% = **46**
- Completeness = 80 → 80 × 30% = **24**
- Dormant 6 months → 6 × 10 = 60 → 60 × 20% = **12**
- Total = 46 + 24 + 12 = **82** ✅

That 82 is the same 82 shown in your Round 1 PPT. All 3 demo projects match the PPT:
PulseNote = 82, ShaderCanvas Studio = 86, DevPulse CLI = 76.
There is even an automatic test in the code (`npm test`) that checks these numbers.

## 5. Every button on the website — what it does

| Button / thing | What it does, in easy words |
|---|---|
| Tombstone card | One dead project. Shows name, one-line story, score, and how much was built |
| Click a card | Opens the full Autopsy report of that project |
| + Bury a project | The form to add a new dead project. Move the sliders and the score changes live |
| Fetch repo (inside Bury form) | Paste a GitHub link — the form fills itself: name, description, language, and how many months the repo has been sleeping (counted from its last commit/push). You only write the autopsy |
| ⚡ Revival ready badge | Shows on a sleeping project with score 80 or more: "this one is worth waking up first" |
| Copy summary | Copies a neat text card of that project (score, story, status) — paste it anywhere: LinkedIn, X, WhatsApp |
| Revival Radar (top banner) | The app automatically points at the best sleeping project: "revive this one first" |
| Continue / Restart / Repurpose / Archive | The 4 decisions (fates) for a project. Picking one changes its status and writes it in the log |
| Adopt a Grave | Some other person can take your dead project and finish it. Type a name → project becomes "Adopted" |
| Search / Filter / Sort | Find a project by name or tag; sort by highest score, newest, or longest sleeping |
| Export JSON | Download all your projects as one file (backup) |
| Import JSON | Bring that file back — on any computer |
| Reset demo | Brings back the original 3 demo projects |
| Remove this grave | Deletes one project forever (it asks "are you sure?" first) |

**Data saving:** Everything saves automatically in the browser (called `localStorage`).
Refresh the page — your projects are still there. No login, no server, no cost.

## 6. The 3 demo projects (already inside the app)

1. **PulseNote (82)** — lecture recording app for students. Died because exams started.
2. **ShaderCanvas Studio (86)** — visual shader editor for beginners. Died because the scope became too big.
3. **DevPulse CLI (76)** — git habit tracker. Died because client work took priority. It is marked **Adoptable**.

Use THESE in your demo. Don't make new ones up live — judges can ask about these, and now you know their full stories (open each card to see).

## 7. Tech stack — one easy line each

- **React** — the tool used to build the website's screens and buttons
- **Vite** — the tool that runs the website fast on your laptop and builds the final version
- **Tailwind CSS** — the tool used for all the colours, spacing and design
- **Framer Motion** — the tool that makes cards and windows move smoothly
- **localStorage** — the browser's own small storage, used instead of a database
- **Vercel** — the free website where the final site is put online for judges

If a judge asks "why no backend / database?", say:
**"By design. A graveyard for your own projects must be instant and private — no signup, no server cost. The data lives in your browser, and Export JSON is your backup. Cloud sync is my next-step roadmap, not a missing piece."**

## 8. Who is this for? (4 types of people)

1. **Students** — semester projects die every exam season
2. **Hackathon participants** — 48-hour demos die the day after demo day
3. **Solo builders / indie makers** — side projects die when job/client work comes
4. **Product teams** — old prototypes and the reasons behind decisions get forgotten

## 9. File map — where is what in the code?

```
src/App.jsx     → the whole app: screens, cards, forms, all buttons
src/score.js    → ONLY the score formula (small, clean, easy to explain)
src/score.test.js → automatic tests that prove the formula gives 82 / 86 / 76
src/index.css   → colours, fonts, stars, moon, shimmer button effects
src/main.jsx    → the starting file (just starts the app)
```

If a judge asks "show me the score code" → open `src/score.js`. It is one small file, made exactly for that moment.

## 10. The night-before checklist (your part)

1. Unzip → `npm install` → `npm run dev` → open the site
2. Click all 3 demo cards. Bury one test project. Adopt DevPulse. Refresh the page.
3. Read DEMO-SCRIPT.md out loud ONE time
4. Sleep. Tomorrow 10 AM: paste the brief into the Baloon chat before coding anything.

---

**Remember the closing line of your demo:**
*"An unfinished project isn't a worthless project — it just never got an autopsy."*
