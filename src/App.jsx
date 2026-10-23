import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { resurrectionScore, scoreBreakdown } from './score.js'
import {
  parseGitHubRepo,
  monthsSince,
  calculatePlanProgress,
  buildRevivalPlan,
  calculateGraveyardInsights,
  mergeActivityFeed,
} from './utils.js'

const STORAGE_KEY = 'project-graveyard-v1'

const now = () => new Date().toISOString().slice(0, 10)

const SEED = [
  {
    id: 'pulsenote',
    title: 'PulseNote — Study Audio',
    epitaph: 'Built in 36h for a campus sprint; paused at timestamp sync.',
    vision: 'Turn long lecture recordings into searchable, timestamped study notes for students who revise at 2x speed.',
    built: ['WebAudio recorder + tag UI', 'Lecture upload flow', 'Tag timeline'],
    unfinished: ['Transcript search & export', 'Timestamp sync with playback'],
    reason: 'Semester final exams began the day after demo day.',
    tags: ['React', 'WebAudio', 'EdTech'],
    completeness: 80,
    ideaStrength: 92,
    monthsDormant: 6,
    status: 'Dormant',
    adoptable: true,
    adoptedBy: '',
    createdAt: '2026-04-12',
    log: [{ date: '2026-04-12', text: 'Buried with a full autopsy.' }],
    revivalPlan: null,
  },
  {
    id: 'shadercanvas',
    title: 'ShaderCanvas Studio',
    epitaph: 'WebGL node editor paused before the export pipeline.',
    vision: 'A visual GLSL playground so beginners can build shaders by connecting nodes instead of writing raw shader code.',
    built: ['Node graph editor', 'Live shader preview', 'Preset gallery'],
    unfinished: ['GIF / video export', 'Node search'],
    reason: 'Scope grew too large at the compiler step.',
    tags: ['WebGL', 'GLSL', 'Creative Tools'],
    completeness: 85,
    ideaStrength: 92,
    monthsDormant: 7,
    status: 'Dormant',
    adoptable: false,
    adoptedBy: '',
    createdAt: '2026-03-05',
    log: [{ date: '2026-03-05', text: 'Buried with a full autopsy.' }],
    revivalPlan: null,
  },
  {
    id: 'devpulse',
    title: 'DevPulse CLI',
    epitaph: 'Local git habit tracker that never got its weekly report.',
    vision: 'A tiny CLI that reads your local git history and nudges you with a weekly coding-habit report — no account, no cloud.',
    built: ['Git log parser', 'Streak counter', 'Terminal dashboard'],
    unfinished: ['Weekly report generator', 'Config file support'],
    reason: 'Client work took priority and momentum never came back.',
    tags: ['CLI', 'Git', 'Productivity'],
    completeness: 55,
    ideaStrength: 78,
    monthsDormant: 14,
    status: 'Dormant',
    adoptable: true,
    adoptedBy: '',
    createdAt: '2025-08-20',
    log: [{ date: '2025-08-20', text: 'Buried with a full autopsy.' }],
    revivalPlan: null,
  },
]

const FATES = [
  { key: 'Continue', icon: '▶', desc: 'Pick it up exactly where you left it, with the autopsy as your map.' },
  { key: 'Restart', icon: '↻', desc: 'Start smarter — same idea, fresh build, lessons from the autopsy baked in.' },
  { key: 'Repurpose', icon: '◆', desc: 'Reuse the best modules in a different project instead of rebuilding from zero.' },
  { key: 'Archive', icon: '▣', desc: 'Close it with honour. The record stays; the guilt goes.' },
]

const STATUS_STYLE = {
  Dormant: 'bg-zinc-700/60 text-zinc-200 border border-zinc-600/40',
  Resurrected: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  Revived: 'bg-emerald-400 text-black font-bold shadow-sm shadow-emerald-500/40 border border-emerald-300',
  Archived: 'bg-zinc-800 text-zinc-500 border border-zinc-700/40',
  Adopted: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
}

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* fall through to seed */ }
  return SEED
}

function linesToList(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean)
}

function ScoreRing({ score, size = 64 }) {
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#f2c14e' : '#9db4a8'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Resurrection score ${score}`}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#26332d" strokeWidth="3.4" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round"
          strokeDasharray={`${score} ${100 - score}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-bold" style={{ color, fontSize: size * 0.3 }}>{score}</div>
    </div>
  )
}

function TombstoneCard({ project, onOpen }) {
  const score = resurrectionScore(project)
  const plan = calculatePlanProgress(project.revivalPlan?.tasks)

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4 }}
      onClick={() => onOpen(project)}
      className="tombstone grave-glow text-left w-full bg-[#182420] border border-[#26332d] px-5 pt-7 pb-5 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[project.status] || STATUS_STYLE.Dormant}`}>
          {project.status === 'Revived' ? 'Revived ✓' : project.status}
        </span>
        <ScoreRing score={score} size={58} />
      </div>

      <h3 className="text-lg font-bold leading-snug mt-2 break-words">{project.title}</h3>
      <p className="text-sm text-[#9db4a8] italic mt-1 break-words">“{project.epitaph}”</p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {project.tags.map((t) => (
          <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#0b0f0e] border border-[#26332d] text-[#9db4a8]">{t}</span>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-between mt-4 text-xs text-[#9db4a8]">
        <span>💤 Dormant {project.monthsDormant} mo</span>
        {score >= 80 && project.status === 'Dormant' && <span className="text-emerald-300 font-bold">⚡ Revival ready</span>}
        {project.adoptable && project.status === 'Dormant' && <span className="text-amber-300 font-semibold">Adoptable</span>}
        {project.status === 'Adopted' && <span className="text-amber-300">by {project.adoptedBy}</span>}
      </div>

      {/* Built completeness bar */}
      <div className="mt-3 h-1.5 rounded-full bg-[#0b0f0e] overflow-hidden">
        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${project.completeness}%` }} />
      </div>
      <p className="text-[11px] text-[#9db4a8] mt-1">{project.completeness}% built — tap for the autopsy</p>

      {/* Revival Plan Progress Bar on card */}
      {plan.total > 0 && (
        <div className="mt-3.5 bg-[#0e1613] border border-emerald-500/25 rounded-xl px-3 py-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-emerald-300 flex items-center gap-1">
              {plan.allDone ? '✓ Revived Plan' : '⚡ Revival Plan'}
            </span>
            <span className="text-[#cfe0d6] font-mono text-[11px]">{plan.completed}/{plan.total} ({plan.percent}%)</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#182420] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${plan.allDone ? 'bg-emerald-300' : 'bg-emerald-400'}`}
              style={{ width: `${plan.percent}%` }}
            />
          </div>
        </div>
      )}
    </motion.button>
  )
}

function RevivalPlanSection({ project, onUpdatePlan, onGeneratePlan }) {
  const plan = project.revivalPlan
  const progress = calculatePlanProgress(plan?.tasks)
  const [newTaskText, setNewTaskText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')

  if (!plan) {
    return (
      <div className="mt-4 bg-[#0b0f0e] border border-dashed border-[#26332d] rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-emerald-300">⚡ REVIVAL PLAN</h3>
            <p className="text-xs text-[#9db4a8] mt-0.5">
              Turn unfinished items into an actionable revival checklist. Choose a fate above or generate now.
            </p>
          </div>
          <button
            onClick={() => onGeneratePlan(project)}
            className="shimmer-btn bg-emerald-400 text-black text-xs font-bold px-4 py-2 rounded-xl shrink-0 cursor-pointer"
          >
            <span className="relative z-[2]">Generate Revival Plan</span>
          </button>
        </div>
      </div>
    )
  }

  const handleToggleTask = (taskId) => {
    const updatedTasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    onUpdatePlan(project, { ...plan, tasks: updatedTasks })
  }

  const handleAddTask = (e) => {
    e?.preventDefault()
    const text = newTaskText.trim()
    if (!text) return
    const newTask = {
      id: `task-${Date.now()}`,
      text,
      done: false,
    }
    onUpdatePlan(project, { ...plan, tasks: [...plan.tasks, newTask] })
    setNewTaskText('')
  }

  const handleDeleteTask = (taskId) => {
    const updatedTasks = plan.tasks.filter((t) => t.id !== taskId)
    onUpdatePlan(project, { ...plan, tasks: updatedTasks })
  }

  const handleStartEdit = (task) => {
    setEditingId(task.id)
    setEditingText(task.text)
  }

  const handleSaveEdit = (taskId) => {
    const text = editingText.trim()
    if (!text) {
      handleDeleteTask(taskId)
    } else {
      const updatedTasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, text } : t))
      onUpdatePlan(project, { ...plan, tasks: updatedTasks })
    }
    setEditingId(null)
  }

  return (
    <div className="mt-4 bg-[#0b0f0e] border border-emerald-500/30 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm tracking-wide text-emerald-300 flex items-center gap-2">
            <span>⚡ REVIVAL PLAN</span>
            {progress.allDone && (
              <span className="text-[10px] bg-emerald-400 text-black font-extrabold px-2 py-0.5 rounded-full">
                REVIVED ✓
              </span>
            )}
          </h3>
          <p className="text-xs text-[#9db4a8] mt-0.5">
            Auto-built from unfinished autopsy items. Check them off to revive this build.
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-emerald-300 font-mono">
            {progress.completed}/{progress.total}
          </span>
          <span className="text-xs text-[#9db4a8] ml-1">({progress.percent}%)</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 rounded-full bg-[#182420] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            progress.allDone ? 'bg-gradient-to-r from-emerald-400 to-teal-300' : 'bg-emerald-400'
          }`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* Completion Banner */}
      {progress.allDone && (
        <div className="mt-3 bg-emerald-500/15 border border-emerald-400/40 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-emerald-300">
            🎉 All tasks completed! This project is officially <span className="underline">Revived ✓</span>
          </p>
          <p className="text-xs text-[#9db4a8] mt-0.5">
            Recorded in the graveyard archives. Your past effort produced real software.
          </p>
        </div>
      )}

      {/* Task List */}
      <ul className="mt-3 space-y-2">
        {plan.tasks.map((task) => (
          <li
            key={task.id}
            className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
              task.done
                ? 'bg-[#121a17]/50 border-emerald-500/20 text-[#7a9385]'
                : 'bg-[#182420] border-[#26332d] text-[#e8f0ea]'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => handleToggleTask(task.id)}
                className="w-4 h-4 accent-emerald-400 rounded cursor-pointer shrink-0"
              />
              {editingId === task.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(task.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                    className="flex-1 bg-[#0b0f0e] border border-emerald-400 rounded-lg px-2 py-1 text-xs text-white"
                  />
                  <button
                    onClick={() => handleSaveEdit(task.id)}
                    className="text-xs bg-emerald-400 text-black px-2 py-1 rounded font-bold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs text-[#9db4a8] hover:text-white px-1 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span
                  onClick={() => handleToggleTask(task.id)}
                  className={`text-xs break-words cursor-pointer select-none ${
                    task.done ? 'line-through text-[#8fa79a]' : 'font-medium'
                  }`}
                >
                  {task.text}
                </span>
              )}
            </div>

            {editingId !== task.id && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleStartEdit(task)}
                  className="text-[11px] text-[#9db4a8] hover:text-emerald-300 px-1.5 py-0.5 rounded cursor-pointer"
                  title="Edit task"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-[11px] text-[#9db4a8] hover:text-red-300 px-1.5 py-0.5 rounded cursor-pointer"
                  title="Remove task"
                >
                  ✕
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Add Task Input */}
      <form onSubmit={handleAddTask} className="flex gap-2 mt-3">
        <input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="+ Add another revival milestone…"
          className="flex-1 bg-[#121a17] border border-[#26332d] rounded-xl px-3 py-1.5 text-xs text-[#e8f0ea] placeholder-[#6b8277]"
        />
        <button
          type="submit"
          disabled={!newTaskText.trim()}
          className="bg-emerald-400 text-black font-bold text-xs px-3 py-1.5 rounded-xl disabled:opacity-40 cursor-pointer"
        >
          Add
        </button>
      </form>
    </div>
  )
}

function AutopsyView({
  project,
  onClose,
  onFate,
  onAdopt,
  onToggleAdoptable,
  onDelete,
  onUpdatePlan,
  onGeneratePlan,
}) {
  const score = resurrectionScore(project)
  const breakdown = scoreBreakdown(project)
  const [adopter, setAdopter] = useState('')
  const [copied, setCopied] = useState(false)

  const copySummary = async () => {
    const text = [
      `🪦 ${project.title} — Resurrection Score: ${score}/100 (${project.status})`,
      `"${project.epitaph}"`,
      `Vision: ${project.vision}`,
      `Built: ${project.built.join('; ') || '—'}`,
      `Unfinished: ${project.unfinished.join('; ') || '—'}`,
      `Why it stopped: ${project.reason}`,
      project.repoUrl ? `Repo: ${project.repoUrl}` : '',
      '— recorded in The Project Graveyard',
    ].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { setCopied(false) }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121a17] border border-[#26332d] w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Autopsy of ${project.title}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[project.status] || STATUS_STYLE.Dormant}`}>
              {project.status === 'Revived' ? 'Revived ✓' : project.status}
            </span>
            <h2 className="text-2xl font-bold mt-2 break-words">{project.title}</h2>
            <p className="text-[#9db4a8] italic break-words">“{project.epitaph}”</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={copySummary}
                className="text-xs border border-[#26332d] px-3 py-1.5 rounded-full cursor-pointer hover:bg-[#182420] transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy summary'}
              </button>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs border border-[#26332d] px-3 py-1.5 rounded-full hover:bg-[#182420] transition-colors"
                >
                  View repository ↗
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none px-2 text-[#9db4a8] hover:text-white cursor-pointer"
            aria-label="Close autopsy"
          >
            ×
          </button>
        </div>

        {/* The Autopsy Record */}
        <div className="mt-5 bg-[#0b0f0e] border border-[#26332d] rounded-2xl p-4">
          <h3 className="font-bold text-sm tracking-wide text-[#9db4a8]">THE AUTOPSY</h3>
          <p className="mt-2 text-sm"><span className="text-[#9db4a8] font-semibold">Original vision: </span>{project.vision}</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-sm font-semibold text-emerald-300">✓ What was built</p>
              <ul className="text-sm text-[#cfe0d6] list-disc ml-5 mt-1 space-y-0.5">
                {project.built.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300">○ Still unfinished</p>
              <ul className="text-sm text-[#cfe0d6] list-disc ml-5 mt-1 space-y-0.5">
                {project.unfinished.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          </div>
          <p className="mt-3 text-sm"><span className="text-[#9db4a8] font-semibold">Honest reason work stopped: </span>{project.reason}</p>
        </div>

        {/* Resurrection Score Breakdown */}
        <div className="mt-4 bg-[#0b0f0e] border border-[#26332d] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
          <ScoreRing score={score} size={84} />
          <div className="flex-1 w-full">
            <h3 className="font-bold text-sm tracking-wide text-[#9db4a8]">RESURRECTION SCORE — {score}/100</h3>
            {breakdown.map((b) => (
              <div key={b.label} className="mt-2">
                <div className="flex justify-between text-xs text-[#9db4a8]">
                  <span>{b.label} ({b.weight})</span>
                  <span>{b.raw} → +{b.points}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#26332d] mt-0.5">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${b.raw}%` }} />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-[#9db4a8] mt-2">
              Formula: 50% idea strength + 30% completeness + 20% dormancy bonus (10 pts/month away, max 100 — distance gives fresh eyes).
            </p>
          </div>
        </div>

        {/* Choose Its Fate */}
        <div className="mt-4">
          <h3 className="font-bold text-sm tracking-wide text-[#9db4a8]">CHOOSE ITS FATE</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {FATES.map((f) => (
              <button
                key={f.key}
                onClick={() => onFate(project, f.key)}
                className="text-left bg-[#182420] hover:bg-[#1f2f28] border border-[#26332d] rounded-xl p-3 cursor-pointer transition-colors"
              >
                <span className="font-bold text-sm">{f.icon} {f.key}</span>
                <span className="block text-xs text-[#9db4a8] mt-0.5">{f.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Revival Plan Section */}
        <RevivalPlanSection
          project={project}
          onUpdatePlan={onUpdatePlan}
          onGeneratePlan={onGeneratePlan}
        />

        {/* Adopt a Grave */}
        <div className="mt-4 bg-[#0b0f0e] border border-amber-500/30 rounded-2xl p-4">
          <h3 className="font-bold text-sm tracking-wide text-amber-300">ADOPT A GRAVE</h3>
          {project.status === 'Adopted' ? (
            <p className="text-sm mt-1">This project was adopted by <b>{project.adoptedBy}</b>. It gets a second life with a new builder.</p>
          ) : project.adoptable ? (
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <input
                value={adopter}
                onChange={(e) => setAdopter(e.target.value)}
                placeholder="Your name — claim this project"
                className="flex-1 bg-[#121a17] border border-[#26332d] rounded-xl px-3 py-2 text-sm"
              />
              <button
                disabled={!adopter.trim()}
                onClick={() => onAdopt(project, adopter.trim())}
                className="bg-amber-400 text-black font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-40 cursor-pointer"
              >
                Adopt this project
              </button>
            </div>
          ) : (
            <p className="text-sm mt-1 text-[#9db4a8]">Not marked adoptable yet.</p>
          )}
          <button
            onClick={() => onToggleAdoptable(project)}
            className="text-xs underline text-[#9db4a8] mt-2 cursor-pointer"
          >
            {project.adoptable ? 'Remove from adoption list' : 'Mark as adoptable'}
          </button>
        </div>

        {/* Archive Log */}
        {project.log.length > 0 && (
          <div className="mt-5">
            <h3 className="font-bold text-sm tracking-wide text-[#9db4a8]">ARCHIVE LOG</h3>
            <ul className="text-sm mt-2 space-y-1.5 border-l-2 border-[#26332d] pl-3 ml-1">
              {[...project.log].reverse().map((l, i) => (
                <li key={i} className="text-[#cfe0d6]">
                  <span className="text-[#9db4a8] font-mono text-xs mr-1">{l.date} —</span>
                  {l.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Delete */}
        <div className="mt-6 pt-4 border-t border-[#26332d] flex items-center justify-between">
          <span className="text-xs text-[#9db4a8]">Buried {project.createdAt}</span>
          <button onClick={() => onDelete(project)} className="text-xs text-red-300 hover:text-red-200 underline cursor-pointer">
            Remove this grave permanently
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function GraveyardInsights({ projects, onSelectProject }) {
  const insights = useMemo(() => calculateGraveyardInsights(projects), [projects])

  // Donut chart calculations
  const total = insights.total
  const radius = 40
  const circumference = 2 * Math.PI * radius // ≈ 251.327

  const slices = useMemo(() => {
    if (total === 0) return []
    const statusOrder = [
      { key: 'Dormant', color: '#71717a', label: 'Dormant' },
      { key: 'Resurrected', color: '#34d399', label: 'Resurrected' },
      { key: 'Revived', color: '#10b981', label: 'Revived ✓' },
      { key: 'Adopted', color: '#f59e0b', label: 'Adopted' },
      { key: 'Archived', color: '#4b5563', label: 'Archived' },
    ]
    let accumulated = 0
    return statusOrder.map((s) => {
      const count = insights.statusCounts[s.key] || 0
      const ratio = count / total
      const strokeDash = ratio * circumference
      accumulated += ratio
      return {
        ...s,
        count,
        percent: Math.round(ratio * 100),
        strokeDash: `${strokeDash} ${circumference}`,
        strokeOffset: -((accumulated - ratio) * circumference),
      }
    }).filter((s) => s.count > 0)
  }, [insights.statusCounts, total, circumference])

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <p className="text-xs tracking-[0.3em] text-emerald-300 font-semibold">GRAVEYARD INSIGHTS</p>
          <h2 className="font-display text-2xl sm:text-3xl font-black mt-1">Living data from the afterlife.</h2>
          <p className="text-sm text-[#9db4a8]">Real-time analytics computed live across your buried projects.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Graveyard Metrics</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Panel 1: Pure SVG Donut Chart */}
        <div className="bg-[#121a17] border border-[#26332d] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-[#cfe0d6]">STATUS BREAKDOWN</h3>
            <p className="text-xs text-[#9db4a8] mt-0.5">Where your builds currently stand</p>
          </div>

          <div className="flex items-center justify-center gap-6 my-4">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#1d2b25" strokeWidth="14" />
                {slices.map((slice) => (
                  <circle
                    key={slice.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="14"
                    strokeDasharray={slice.strokeDash}
                    strokeDashoffset={slice.strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-white">{total}</span>
                <span className="text-[10px] text-[#9db4a8]">Graves</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs flex-1">
              {slices.length === 0 ? (
                <p className="text-xs text-[#9db4a8]">No data yet</p>
              ) : (
                slices.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[#cfe0d6]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="truncate">{s.label}</span>
                    </span>
                    <span className="font-mono text-[#9db4a8] text-[11px]">{s.count} ({s.percent}%)</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <p className="text-[11px] text-[#9db4a8] border-t border-[#26332d] pt-2">
            Status updates automatically when fates are chosen or tasks completed.
          </p>
        </div>

        {/* Panel 2: Score Distribution Bars */}
        <div className="bg-[#121a17] border border-[#26332d] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-[#cfe0d6]">SCORE DISTRIBUTION</h3>
            <p className="text-xs text-[#9db4a8] mt-0.5">Projects ranked by revival potential</p>
          </div>

          <div className="space-y-3.5 my-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> 80–100 Revival Ready
                </span>
                <span className="font-mono text-[#cfe0d6] font-bold">
                  {insights.scoreDistribution.high} <span className="text-[#9db4a8] text-[11px]">({total ? Math.round((insights.scoreDistribution.high / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#0b0f0e] overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${total ? (insights.scoreDistribution.high / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> 60–79 Promising Builds
                </span>
                <span className="font-mono text-[#cfe0d6] font-bold">
                  {insights.scoreDistribution.mid} <span className="text-[#9db4a8] text-[11px]">({total ? Math.round((insights.scoreDistribution.mid / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#0b0f0e] overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${total ? (insights.scoreDistribution.mid / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#9db4a8] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" /> 0–59 Deep Hibernation
                </span>
                <span className="font-mono text-[#cfe0d6] font-bold">
                  {insights.scoreDistribution.low} <span className="text-[#9db4a8] text-[11px]">({total ? Math.round((insights.scoreDistribution.low / total) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#0b0f0e] overflow-hidden">
                <div
                  className="h-full bg-zinc-500 rounded-full transition-all duration-500"
                  style={{ width: `${total ? (insights.scoreDistribution.low / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#9db4a8] border-t border-[#26332d] pt-2">
            {insights.revivalReadyCount} dormant {insights.revivalReadyCount === 1 ? 'project is' : 'projects are'} currently ripe for continuation.
          </p>
        </div>

        {/* Panel 3: Dormancy & Oldest Stats */}
        <div className="bg-[#121a17] border border-[#26332d] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-[#cfe0d6]">DORMANCY & RECOVERY</h3>
            <p className="text-xs text-[#9db4a8] mt-0.5">Time away turns into clarity</p>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3">
            <div className="bg-[#0b0f0e] border border-[#26332d] rounded-xl p-3">
              <span className="text-[11px] text-[#9db4a8] block">Avg. Dormancy</span>
              <span className="text-2xl font-black text-emerald-300 font-mono mt-0.5 block">
                {insights.averageDormancy}
                <span className="text-xs font-normal text-[#9db4a8] ml-1">mo</span>
              </span>
              <span className="text-[10px] text-[#9db4a8] mt-1 block">Fresh eyes threshold</span>
            </div>

            <div className="bg-[#0b0f0e] border border-[#26332d] rounded-xl p-3">
              <span className="text-[11px] text-[#9db4a8] block">Revival-Ready</span>
              <span className="text-2xl font-black text-amber-300 font-mono mt-0.5 block">
                {total ? Math.round((insights.scoreDistribution.high / total) * 100) : 0}%
              </span>
              <span className="text-[10px] text-[#9db4a8] mt-1 block">Score ≥ 80 ratio</span>
            </div>
          </div>

          {insights.oldestGrave ? (
            <button
              onClick={() => onSelectProject(insights.oldestGrave.id)}
              className="text-left bg-[#0b0f0e] border border-[#26332d] hover:border-emerald-500/40 rounded-xl p-2.5 transition-colors cursor-pointer w-full"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-300 font-semibold">Oldest Grave</span>
                <span className="text-[#9db4a8]">{insights.oldestGrave.monthsDormant} mo away</span>
              </div>
              <div className="font-bold text-xs truncate mt-0.5">{insights.oldestGrave.title}</div>
            </button>
          ) : (
            <div className="text-xs text-[#9db4a8] py-2">No graves buried yet.</div>
          )}

          <p className="text-[11px] text-[#9db4a8] border-t border-[#26332d] pt-2 mt-2">
            Formula rewards up to 10 months of dormancy to encourage revival.
          </p>
        </div>
      </div>
    </section>
  )
}

function TagFilterBar({ tags, selectedTag, onSelectTag, projectsCount }) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
      <span className="text-[#9db4a8] font-semibold text-[11px] mr-1 shrink-0">Tags:</span>
      <button
        onClick={() => onSelectTag('All')}
        className={`px-3 py-1 rounded-full cursor-pointer transition-all shrink-0 font-medium ${
          selectedTag === 'All'
            ? 'bg-emerald-400 text-black font-bold shadow-xs'
            : 'bg-[#121a17] border border-[#26332d] text-[#9db4a8] hover:text-white hover:border-[#384941]'
        }`}
      >
        All ({projectsCount})
      </button>
      {tags.map((t) => (
        <button
          key={t.name}
          onClick={() => onSelectTag(selectedTag === t.name ? 'All' : t.name)}
          className={`px-3 py-1 rounded-full cursor-pointer transition-all shrink-0 font-medium ${
            selectedTag === t.name
              ? 'bg-emerald-400 text-black font-bold shadow-xs'
              : 'bg-[#121a17] border border-[#26332d] text-[#9db4a8] hover:text-white hover:border-[#384941]'
          }`}
        >
          {t.name} <span className="opacity-70 text-[10px]">({t.count})</span>
        </button>
      ))}
    </div>
  )
}

function ActivityFeed({ projects, onSelectProject }) {
  const feed = useMemo(() => mergeActivityFeed(projects), [projects])
  const [expanded, setExpanded] = useState(false)

  const visibleFeed = expanded ? feed : feed.slice(0, 6)

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <p className="text-xs tracking-[0.3em] text-emerald-300 font-semibold">GRAVEYARD CHRONICLES</p>
          <h2 className="font-display text-2xl sm:text-3xl font-black mt-1">Unified Activity Feed</h2>
          <p className="text-sm text-[#9db4a8]">Every burial, autopsy, fate decision, and revival recorded in reverse-chronological order.</p>
        </div>
        <span className="text-xs font-mono text-[#9db4a8]">{feed.length} total events</span>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-12 bg-[#121a17] border border-[#26332d] rounded-2xl">
          <p className="text-sm text-[#9db4a8]">No activity recorded in the graveyard yet.</p>
        </div>
      ) : (
        <div className="bg-[#121a17] border border-[#26332d] rounded-2xl p-5 sm:p-6">
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#26332d]">
            {visibleFeed.map((item) => (
              <div key={item.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#121a17] shadow-xs group-hover:scale-125 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <button
                      onClick={() => onSelectProject(item.projectId)}
                      className="font-bold text-sm text-[#e8f0ea] hover:text-emerald-300 transition-colors cursor-pointer text-left"
                    >
                      {item.projectTitle}
                    </button>
                    <span className="text-xs text-[#9db4a8]">•</span>
                    <span className="text-xs text-[#cfe0d6]">{item.text}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#9db4a8] shrink-0">{item.date}</span>
                </div>
              </div>
            ))}
          </div>

          {feed.length > 6 && (
            <div className="mt-6 pt-4 border-t border-[#26332d] text-center">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 cursor-pointer py-1 px-4 rounded-full border border-[#26332d] hover:bg-[#182420] transition-colors"
              >
                {expanded ? 'Show less' : `Show all ${feed.length} activity records`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

const EMPTY_FORM = {
  title: '', epitaph: '', vision: '', built: '', unfinished: '', reason: '',
  tags: '', completeness: 50, ideaStrength: 70, monthsDormant: 3, adoptable: false, repoUrl: '',
}

function BuryForm({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [ghInput, setGhInput] = useState('')
  const [ghState, setGhState] = useState({ busy: false, msg: '' })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const fetchFromGitHub = async () => {
    const parsed = parseGitHubRepo(ghInput)
    if (!parsed) {
      setGhState({ busy: false, msg: 'Paste a repo like owner/repo or a full github.com link.' })
      return
    }
    setGhState({ busy: true, msg: '' })
    try {
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`)
      if (res.status === 404) throw new Error('Repo not found — it may be private or the name is wrong.')
      if (res.status === 403) throw new Error('GitHub rate limit hit — try again in a few minutes, or fill the form manually.')
      if (!res.ok) throw new Error(`GitHub returned ${res.status}. Fill the form manually instead.`)
      const repo = await res.json()
      const tags = [repo.language, ...(repo.topics || [])].filter(Boolean)
      setForm((f) => ({
        ...f,
        title: repo.name.replace(/[-_]/g, ' '),
        vision: repo.description || f.vision,
        tags: tags.join(', ') || f.tags,
        monthsDormant: monthsSince(repo.pushed_at),
        repoUrl: repo.html_url,
        epitaph: f.epitaph || `Last commit ${monthsSince(repo.pushed_at)} months ago. Still deserves a record.`,
      }))
      setGhState({
        busy: false,
        msg: `✓ Filled from ${repo.full_name} — ⭐ ${repo.stargazers_count} · last push ${monthsSince(repo.pushed_at)} months ago. Now complete the autopsy below.`,
      })
    } catch (err) {
      setGhState({ busy: false, msg: err.message || 'Could not reach GitHub. Fill the form manually instead.' })
    }
  }

  const previewScore = resurrectionScore({
    ideaStrength: Number(form.ideaStrength),
    completeness: Number(form.completeness),
    monthsDormant: Number(form.monthsDormant),
  })

  const valid = form.title.trim() && form.vision.trim() && form.reason.trim()
  const field = 'w-full bg-[#0b0f0e] border border-[#26332d] rounded-xl px-3 py-2 text-sm mt-1 text-[#e8f0ea]'
  const label = 'block text-sm font-semibold mt-4 text-[#cfe0d6]'

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121a17] border border-[#26332d] w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Bury a project"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bury a project</h2>
            <p className="text-sm text-[#9db4a8]">No shame. Give it a proper autopsy and it can live again.</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none px-2 text-[#9db4a8] hover:text-white cursor-pointer"
            aria-label="Close form"
          >
            ×
          </button>
        </div>

        <div className="mt-5 bg-[#0b0f0e] border border-[#26332d] rounded-2xl p-4">
          <p className="text-sm font-bold">⚡ Fastest way — bury it straight from GitHub</p>
          <p className="text-xs text-[#9db4a8] mt-0.5">
            Paste a public repo. We fetch its name, description, language and how long it has been dormant — you only write the autopsy.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <input
              value={ghInput}
              onChange={(e) => setGhInput(e.target.value)}
              placeholder="github.com/you/that-dead-repo"
              className="flex-1 bg-[#121a17] border border-[#26332d] rounded-xl px-3 py-2 text-sm text-[#e8f0ea]"
            />
            <button
              type="button"
              disabled={ghState.busy || !ghInput.trim()}
              onClick={fetchFromGitHub}
              className="bg-emerald-400 text-black font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-40 cursor-pointer"
            >
              {ghState.busy ? 'Fetching…' : 'Fetch repo'}
            </button>
          </div>
          {ghState.msg && <p className="text-xs mt-2 text-[#cfe0d6]">{ghState.msg}</p>}
          {form.repoUrl && <p className="text-xs mt-1 text-[#9db4a8]">Linked repo: {form.repoUrl}</p>}
        </div>

        <label className={label}>Project title *</label>
        <input
          className={field}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. HostelMess Menu App"
        />

        <label className={label}>Epitaph — one honest line</label>
        <input
          className={field}
          value={form.epitaph}
          onChange={(e) => set('epitaph', e.target.value)}
          placeholder="e.g. Died waiting for the mess committee to reply."
        />

        <label className={label}>Original vision *</label>
        <textarea
          className={field}
          rows={2}
          value={form.vision}
          onChange={(e) => set('vision', e.target.value)}
          placeholder="What was this supposed to become?"
        />

        <label className={label}>What was built (one per line)</label>
        <textarea
          className={field}
          rows={2}
          value={form.built}
          onChange={(e) => set('built', e.target.value)}
          placeholder={'Login screen\nMenu list UI'}
        />

        <label className={label}>Still unfinished (one per line)</label>
        <textarea
          className={field}
          rows={2}
          value={form.unfinished}
          onChange={(e) => set('unfinished', e.target.value)}
          placeholder={'Payments\nPush notifications'}
        />

        <label className={label}>Honest reason work stopped *</label>
        <input
          className={field}
          value={form.reason}
          onChange={(e) => set('reason', e.target.value)}
          placeholder="e.g. Exams, scope creep, lost interest, team left…"
        />

        <label className={label}>Tags (comma separated)</label>
        <input
          className={field}
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="React, Firebase, Campus"
        />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Built % — {form.completeness}</label>
            <input
              type="range"
              min="0"
              max="100"
              className="w-full accent-emerald-400"
              value={form.completeness}
              onChange={(e) => set('completeness', Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label}>Idea strength — {form.ideaStrength}</label>
            <input
              type="range"
              min="0"
              max="100"
              className="w-full accent-emerald-400"
              value={form.ideaStrength}
              onChange={(e) => set('ideaStrength', Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label}>Months dormant</label>
            <input
              type="number"
              min="0"
              max="60"
              className={field}
              value={form.monthsDormant}
              onChange={(e) => set('monthsDormant', Number(e.target.value))}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="accent-amber-400 w-4 h-4"
            checked={form.adoptable}
            onChange={(e) => set('adoptable', e.target.checked)}
          />
          <span className="text-[#cfe0d6]">Mark as adoptable — another builder may claim and continue it</span>
        </label>

        <div className="flex items-center justify-between mt-6 bg-[#0b0f0e] border border-[#26332d] rounded-2xl px-4 py-3">
          <span className="text-sm text-[#9db4a8]">Live Resurrection Score preview</span>
          <ScoreRing score={previewScore} size={52} />
        </div>

        <button
          disabled={!valid}
          onClick={() => onSave(form)}
          className="w-full mt-4 bg-emerald-400 text-black font-bold py-3 rounded-2xl disabled:opacity-40 cursor-pointer transition-all"
        >
          Bury it with honour
        </button>
        {!valid && (
          <p className="text-xs text-[#9db4a8] mt-2 text-center">
            Title, vision and honest reason are required — the autopsy is the whole point.
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}

const STARS = Array.from({ length: 70 }, (_, i) => ({
  left: `${(i * 37.7 + 11) % 100}%`,
  top: `${(i * 23.3 + 5) % 55}%`,
  size: (i % 3) + 1,
  tw: `${2.2 + (i % 5) * 0.7}s`,
  delay: `${(i % 7) * 0.4}s`,
}))

function Starfield() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            '--tw': s.tw,
            animationDelay: s.delay,
          }}
        />
      ))}
      <div className="moon absolute rounded-full" style={{ width: 74, height: 74, right: '9%', top: 34 }} />
      <div className="fog absolute rounded-full bg-emerald-200/10" style={{ width: '70%', height: 60, left: '15%', bottom: 6 }} />
    </div>
  )
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const tick = (t) => {
      const k = Math.min((t - start) / 700, 1)
      setDisplay(Math.round(value * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{display}</>
}

const STEPS = [
  { n: '01', title: 'Bury It', text: 'Add an unfinished project with its title, initial goal, and a brief tombstone epitaph.' },
  { n: '02', title: 'Perform the Autopsy', text: 'Record what was built, what remains unfinished, and why development honestly stopped.' },
  { n: '03', title: 'Choose Its Fate', text: 'The Resurrection Score ranks its revival potential — pick restart, continue, repurpose, or archive.' },
  { n: '04', title: 'Resurrect with Plan', text: 'Work through an actionable revival checklist, or let another builder adopt the grave.' },
]

const PERSONAS = [
  { title: 'Student Builders', tag: 'SEMESTER PROJECTS', text: 'Start projects every semester but need a guilt-free place to preserve and rediscover unfinished ideas when schedules clear.', focus: 'Guilt-free archiving · Semester-break revival' },
  { title: 'Hackathon Participants', tag: '48-HOUR SPRINTS', text: 'Want 48-hour prototypes to live beyond demo day instead of turning into forgotten repos with zero follow-ups.', focus: 'Post-demo continuity · Prototype preservation' },
  { title: 'Indie Makers', tag: 'SOLO BUILDERS', text: 'Need to preserve ideas and their initial spark when client work takes priority, ready to resume later.', focus: 'Saving the spark · Fast context recovery' },
  { title: 'Product Teams', tag: 'R&D MEMORY', text: 'Need a structured record of shelved prototypes and past decisions to avoid repeating previous dead ends.', focus: 'Shelved MVPs · Decision history' },
]

const PAINS = [
  { pain: 'Projects scattered across folders and repos — impossible to find', fix: 'One indexed graveyard: every grave searchable, filterable, sortable' },
  { pain: 'The reasons behind decisions and failures fade from memory', fix: 'The Autopsy preserves vision, progress, and the honest reason it stopped' },
  { pain: 'Nothing ever reminds you to revisit an old project', fix: 'Resurrection Score + Revival Radar surface the right project at the right time' },
  { pain: 'Another builder could finish it — but can never discover it', fix: 'Adopt a Grave makes abandoned projects claimable by a new builder' },
]

function InfoSections({ onBury }) {
  const reveal = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.55 },
  }
  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-14">
        <motion.div {...reveal}>
          <p className="text-xs tracking-[0.3em] text-emerald-300 font-semibold text-center">HOW IT WORKS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-center mt-2">From burial to resurrection in four steps.</h2>
        </motion.div>
        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              {...reveal}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="relative bg-[#121a17] border border-[#26332d] rounded-2xl p-5"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-400 text-black font-black flex items-center justify-center text-sm relative z-10">{s.n.slice(1)}</div>
              <h3 className="font-bold mt-3">{s.title}</h3>
              <p className="text-sm text-[#9db4a8] mt-1">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-6">
        <motion.div {...reveal}>
          <p className="text-xs tracking-[0.3em] text-emerald-300 font-semibold text-center">TARGET USERS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-center mt-2">Built for people who start things.</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {PERSONAS.map((p, i) => (
            <motion.div
              key={p.title}
              {...reveal}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="bg-[#121a17] border border-[#26332d] rounded-2xl p-5"
            >
              <p className="text-[10px] tracking-[0.22em] text-amber-300 font-bold">{p.tag}</p>
              <h3 className="font-bold mt-1.5">{p.title}</h3>
              <p className="text-sm text-[#9db4a8] mt-1">{p.text}</p>
              <p className="text-xs text-emerald-300 mt-3 font-semibold">{p.focus}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14">
        <motion.div {...reveal}>
          <p className="text-xs tracking-[0.3em] text-emerald-300 font-semibold text-center">THE PROBLEM → THE ANSWER</p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-center mt-2">Four ways unfinished work loses its value.</h2>
        </motion.div>
        <div className="mt-8 space-y-3">
          {PAINS.map((row, i) => (
            <motion.div
              key={row.pain}
              {...reveal}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="grid md:grid-cols-2 gap-2 md:gap-0 bg-[#121a17] border border-[#26332d] rounded-2xl overflow-hidden"
            >
              <div className="p-5 text-[#cfe0d6]"><span className="text-red-300 font-bold mr-2">✕</span>{row.pain}</div>
              <div className="p-5 bg-emerald-500/5 md:border-l border-[#26332d]"><span className="text-emerald-300 font-bold mr-2">✓</span>{row.fix}</div>
            </motion.div>
          ))}
        </div>
        <motion.div {...reveal} className="text-center mt-10">
          <p className="font-display text-2xl font-bold italic">“An unfinished project isn't a worthless project.”</p>
          <button onClick={onBury} className="shimmer-btn mt-5 bg-emerald-400 text-black font-bold px-6 py-3 rounded-full cursor-pointer">
            <span className="relative z-[2]">Bury your first project</span>
          </button>
        </motion.div>
      </section>
    </>
  )
}

export default function App() {
  const [projects, setProjects] = useState(loadProjects)
  const [selectedId, setSelectedId] = useState(null)
  const [showBury, setShowBury] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedTag, setSelectedTag] = useState('All')
  const [sortBy, setSortBy] = useState('score')
  const fileRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  }, [projects])

  // Modal behaviour: Esc closes, background scroll locks while a dialog is open.
  useEffect(() => {
    if (!selectedId && !showBury) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedId(null)
        setShowBury(false)
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [selectedId, showBury])

  const selected = projects.find((p) => p.id === selectedId) || null

  const stats = useMemo(() => ({
    total: projects.length,
    dormant: projects.filter((p) => p.status === 'Dormant').length,
    resurrected: projects.filter((p) => p.status === 'Resurrected' || p.status === 'Revived').length,
    adopted: projects.filter((p) => p.status === 'Adopted').length,
    avgScore: projects.length ? Math.round(projects.reduce((a, p) => a + resurrectionScore(p), 0) / projects.length) : 0,
  }), [projects])

  const radar = useMemo(() => {
    const dormant = projects.filter((p) => p.status === 'Dormant')
    if (!dormant.length) return null
    return dormant.reduce((best, p) => (resurrectionScore(p) > resurrectionScore(best) ? p : best), dormant[0])
  }, [projects])

  // Collect unique tags with counts
  const tagList = useMemo(() => {
    const map = {}
    projects.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (t) map[t] = (map[t] || 0) + 1
        })
      }
    })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [projects])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = projects.filter((p) => {
      const matchesStatus =
        statusFilter === 'All' ||
        p.status === statusFilter ||
        (statusFilter === 'Adoptable' && p.adoptable && p.status === 'Dormant') ||
        (statusFilter === 'Revived' && p.status === 'Revived')

      const matchesTag =
        selectedTag === 'All' ||
        (Array.isArray(p.tags) && p.tags.includes(selectedTag))

      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.vision.toLowerCase().includes(q)

      return matchesStatus && matchesTag && matchesQuery
    })

    if (sortBy === 'score') list = [...list].sort((a, b) => resurrectionScore(b) - resurrectionScore(a))
    if (sortBy === 'recent') list = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    if (sortBy === 'dormant') list = [...list].sort((a, b) => (b.monthsDormant || 0) - (a.monthsDormant || 0))
    return list
  }, [projects, query, statusFilter, selectedTag, sortBy])

  const update = (id, fn) => setProjects((ps) => ps.map((p) => (p.id === id ? fn(p) : p)))

  const handleFate = (project, fate) => {
    const isArchive = fate === 'Archive'
    const status = isArchive ? 'Archived' : 'Resurrected'
    const newLog = {
      date: now(),
      text: isArchive ? 'Archived with honour. Record preserved.' : `Resurrected — fate chosen: ${fate}.`,
    }

    update(project.id, (p) => {
      // Auto-generate revival plan if resuming and no plan exists
      const plan = (!isArchive && !p.revivalPlan) ? buildRevivalPlan(p) : p.revivalPlan
      return {
        ...p,
        status,
        revivalPlan: plan,
        log: [...p.log, newLog],
      }
    })
  }

  const handleGeneratePlan = (project) => {
    const plan = buildRevivalPlan(project)
    update(project.id, (p) => ({
      ...p,
      revivalPlan: plan,
      log: [...p.log, { date: now(), text: 'Revival Plan generated from autopsy items.' }],
    }))
  }

  const handleUpdatePlan = (project, newPlan) => {
    const progress = calculatePlanProgress(newPlan.tasks)
    update(project.id, (p) => {
      let nextStatus = p.status
      const logs = [...p.log]

      if (progress.allDone && p.status !== 'Revived') {
        nextStatus = 'Revived'
        logs.push({ date: now(), text: 'All revival tasks completed — project Revived ✓!' })
      } else if (!progress.allDone && p.status === 'Revived') {
        nextStatus = 'Resurrected'
        logs.push({ date: now(), text: 'Revival reopened — tasks remaining.' })
      }

      return {
        ...p,
        status: nextStatus,
        revivalPlan: newPlan,
        log: logs,
      }
    })
  }

  const handleAdopt = (project, name) => {
    update(project.id, (p) => ({
      ...p,
      status: 'Adopted',
      adoptedBy: name,
      log: [...p.log, { date: now(), text: `Adopted by ${name} — second life begins.` }],
    }))
  }

  const handleToggleAdoptable = (project) => {
    update(project.id, (p) => ({
      ...p,
      adoptable: !p.adoptable,
      log: [...p.log, { date: now(), text: !p.adoptable ? 'Marked adoptable.' : 'Removed from adoption list.' }],
    }))
  }

  const handleDelete = (project) => {
    if (confirm(`Remove "${project.title}" permanently? This cannot be undone.`)) {
      setProjects((ps) => ps.filter((p) => p.id !== project.id))
      setSelectedId(null)
    }
  }

  const handleSave = (form) => {
    const project = {
      id: `p-${Date.now()}`,
      title: form.title.trim(),
      epitaph: form.epitaph.trim() || 'Gone, but properly recorded.',
      vision: form.vision.trim(),
      built: linesToList(form.built),
      unfinished: linesToList(form.unfinished),
      reason: form.reason.trim(),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      completeness: Number(form.completeness),
      ideaStrength: Number(form.ideaStrength),
      monthsDormant: Number(form.monthsDormant),
      status: 'Dormant',
      adoptable: !!form.adoptable,
      repoUrl: form.repoUrl || '',
      adoptedBy: '',
      createdAt: now(),
      log: [{ date: now(), text: 'Buried with a full autopsy.' }],
      revivalPlan: null,
    }
    setProjects((ps) => [project, ...ps])
    setShowBury(false)
    setSelectedId(project.id)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project-graveyard-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((p) => p.title && p.vision)) {
          const clean = parsed.map((p, i) => ({
            id: p.id || `imported-${Date.now()}-${i}`,
            title: String(p.title).slice(0, 120),
            epitaph: p.epitaph || 'Gone, but properly recorded.',
            vision: String(p.vision),
            built: Array.isArray(p.built) ? p.built : [],
            unfinished: Array.isArray(p.unfinished) ? p.unfinished : [],
            reason: p.reason || 'Not recorded.',
            tags: Array.isArray(p.tags) ? p.tags : [],
            completeness: Math.min(100, Math.max(0, Number(p.completeness) || 0)),
            ideaStrength: Math.min(100, Math.max(0, Number(p.ideaStrength) || 0)),
            monthsDormant: Math.min(60, Math.max(0, Number(p.monthsDormant) || 0)),
            status: ['Dormant', 'Resurrected', 'Revived', 'Archived', 'Adopted'].includes(p.status) ? p.status : 'Dormant',
            adoptable: !!p.adoptable,
            repoUrl: p.repoUrl || '',
            adoptedBy: p.adoptedBy || '',
            createdAt: p.createdAt || now(),
            log: Array.isArray(p.log) ? p.log : [{ date: now(), text: 'Imported into this graveyard.' }],
            revivalPlan: p.revivalPlan && Array.isArray(p.revivalPlan.tasks) ? p.revivalPlan : null,
          }))
          setProjects(clean)
          setSelectedId(null)
        } else alert('That file is not a valid Project Graveyard export.')
      } catch { alert('Could not read that file as JSON.') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const resetDemo = () => {
    if (confirm('Reset the graveyard back to the 3 demo projects? Your buried projects will be removed.')) {
      setProjects(SEED)
      setSelectedId(null)
      setSelectedTag('All')
      setStatusFilter('All')
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f0e]">
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#0b0f0e]/85 border-b border-[#26332d]/70">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-display font-black text-lg flex items-center gap-2">
            <span>🪦</span>
            <span>The Project <span className="text-emerald-300">Graveyard</span></span>
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] px-2.5 py-1 rounded-full border border-amber-500/40 text-amber-300 font-semibold bg-amber-500/5">
              BALOON · ROUND 2
            </span>
            <button
              onClick={() => setShowBury(true)}
              className="shimmer-btn bg-emerald-400 text-black font-bold px-4 py-2 rounded-full text-sm cursor-pointer shadow-sm hover:bg-emerald-300 transition-colors"
            >
              <span className="relative z-[2]">+ Bury a project</span>
            </button>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden">
        <Starfield />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-28 text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs tracking-[0.35em] text-emerald-300 font-semibold"
          >
            DIGITAL AFTERLIFE FOR UNFINISHED SOFTWARE
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.04] mt-4"
          >
            Every unfinished project<br /><span className="italic text-emerald-300">deserves a second chance.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="text-[#9db4a8] max-w-2xl mx-auto mt-4 text-base sm:text-lg"
          >
            Bury a project with an honest autopsy, calculate its Resurrection Score, choose its fate — restart, continue, repurpose, archive — and execute an actionable Revival Plan.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="flex flex-wrap justify-center gap-2 mt-7"
          >
            <button
              onClick={() => setShowBury(true)}
              className="shimmer-btn bg-emerald-400 text-black font-bold px-6 py-3 rounded-full cursor-pointer hover:bg-emerald-300 transition-colors"
            >
              <span className="relative z-[2]">+ Bury a project</span>
            </button>
            <button
              onClick={exportJSON}
              className="border border-[#26332d] bg-[#121a17]/70 px-4 py-3 rounded-full text-sm cursor-pointer hover:bg-[#182420] transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="border border-[#26332d] bg-[#121a17]/70 px-4 py-3 rounded-full text-sm cursor-pointer hover:bg-[#182420] transition-colors"
            >
              Import JSON
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
            <button
              onClick={resetDemo}
              className="border border-[#26332d] bg-[#121a17]/70 px-4 py-3 rounded-full text-sm text-[#9db4a8] hover:text-white cursor-pointer hover:bg-[#182420] transition-colors"
            >
              Reset demo
            </button>
          </motion.div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,70 C240,40 420,85 720,60 C1020,35 1200,80 1440,55 L1440,90 L0,90 Z" fill="#0e1512" />
          <g fill="#0e1512">
            <rect x="180" y="34" width="26" height="34" rx="12" />
            <rect x="640" y="26" width="30" height="38" rx="14" />
            <rect x="1090" y="30" width="24" height="32" rx="11" />
            <rect x="1265" y="40" width="18" height="24" rx="8" />
          </g>
          <path d="M0,82 C260,60 520,90 820,72 C1100,56 1280,84 1440,70 L1440,90 L0,90 Z" fill="#0b0f0e" />
        </svg>
      </header>

      {/* Top Quick Counters */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ['Buried', stats.total],
          ['Dormant', stats.dormant],
          ['Revived / Active', stats.resurrected],
          ['Adopted', stats.adopted],
          ['Avg. score', stats.avgScore],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#121a17] border border-[#26332d] rounded-2xl p-4 text-center">
            <div className="text-2xl font-black"><AnimatedNumber value={value} /></div>
            <div className="text-xs text-[#9db4a8] mt-0.5">{label}</div>
          </div>
        ))}
      </section>

      {/* Revival Radar */}
      {radar && (
        <section className="max-w-6xl mx-auto px-4 mt-4">
          <button
            onClick={() => setSelectedId(radar.id)}
            className="w-full text-left bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-amber-500/10 border border-emerald-500/35 hover:border-emerald-400/60 rounded-2xl p-4 cursor-pointer transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold tracking-widest text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ⚡ REVIVAL RADAR — HIGHEST SCORE STILL SLEEPING
                </span>
                <span className="block font-bold mt-1 text-lg sm:text-xl text-[#e8f0ea]">
                  {radar.title} — Resurrection Score {resurrectionScore(radar)}/100
                </span>
                <span className="block text-sm text-[#9db4a8]">
                  If you revive one project this weekend, the data says this one. Tap to inspect the autopsy & revival plan.
                </span>
              </div>
              <span className="text-xs bg-emerald-400 text-black font-bold px-3 py-1.5 rounded-full shrink-0 w-fit">
                Open Autopsy →
              </span>
            </div>
          </button>
        </section>
      )}

      {/* Tag Chips Row */}
      <section className="max-w-6xl mx-auto px-4 mt-6">
        <TagFilterBar
          tags={tagList}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          projectsCount={projects.length}
        />
      </section>

      {/* Search & Sort Controls */}
      <section className="max-w-6xl mx-auto px-4 mt-3 flex flex-col sm:flex-row gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, tag or vision…"
          className="flex-1 bg-[#121a17] border border-[#26332d] rounded-full px-4 py-2.5 text-sm text-[#e8f0ea]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#121a17] border border-[#26332d] rounded-full px-4 py-2.5 text-sm text-[#cfe0d6] cursor-pointer"
        >
          {['All', 'Dormant', 'Resurrected', 'Revived', 'Adopted', 'Archived', 'Adoptable'].map((s) => (
            <option key={s} value={s}>{s === 'Revived' ? 'Revived ✓' : s}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#121a17] border border-[#26332d] rounded-full px-4 py-2.5 text-sm text-[#cfe0d6] cursor-pointer"
        >
          <option value="score">Sort: Highest score</option>
          <option value="recent">Sort: Recently buried</option>
          <option value="dormant">Sort: Longest dormant</option>
        </select>
      </section>

      {/* Main Tombstone Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-12">
        {visible.length === 0 ? (
          <div className="text-center py-20 bg-[#121a17] border border-dashed border-[#26332d] rounded-3xl">
            <div className="text-5xl">🪦</div>
            <h2 className="text-xl font-bold mt-3">Quiet for now</h2>
            <p className="text-[#9db4a8] text-sm mt-1">
              {projects.length === 0
                ? 'No graves yet — bury your first unfinished build.'
                : 'No projects match that search, tag, or status filter.'}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {(query || statusFilter !== 'All' || selectedTag !== 'All') && (
                <button
                  onClick={() => {
                    setQuery('')
                    setStatusFilter('All')
                    setSelectedTag('All')
                  }}
                  className="border border-[#26332d] px-4 py-2 rounded-full text-xs text-[#9db4a8] hover:text-white cursor-pointer"
                >
                  Reset filters
                </button>
              )}
              <button
                onClick={() => setShowBury(true)}
                className="bg-emerald-400 text-black font-bold px-5 py-2 rounded-full text-xs cursor-pointer hover:bg-emerald-300 transition-colors"
              >
                + Bury a project
              </button>
            </div>
          </div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {visible.map((p) => (
                <TombstoneCard key={p.id} project={p} onOpen={(proj) => setSelectedId(proj.id)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* P2: Graveyard Insights Section */}
      <GraveyardInsights projects={projects} onSelectProject={(id) => setSelectedId(id)} />

      {/* Info Sections */}
      <InfoSections onBury={() => setShowBury(true)} />

      {/* P3: Unified Activity Feed */}
      <ActivityFeed projects={projects} onSelectProject={(id) => setSelectedId(id)} />

      {/* Footer */}
      <footer className="border-t border-[#26332d] mt-6 bg-[#080d0b]">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="font-display font-black text-base flex items-center justify-center gap-2">
            <span>🪦</span>
            <span>The Project Graveyard</span>
          </p>
          <p className="text-xs text-[#9db4a8] mt-1.5 leading-relaxed">
            Frontend-only by design — no account, no backend, your graveyard lives in your browser (localStorage).<br />
            Built by Manthan Rajpurohit · Team Straw hat pirate · Baloon National Hackathon 2026, Round 2.
          </p>
          <p className="text-xs text-emerald-300/80 italic mt-2">
            Honouring past code so good ideas never stay buried.
          </p>
        </div>
      </footer>

      {/* Dialog Modals */}
      <AnimatePresence>
        {selected && (
          <AutopsyView
            project={selected}
            onClose={() => setSelectedId(null)}
            onFate={handleFate}
            onAdopt={handleAdopt}
            onToggleAdoptable={handleToggleAdoptable}
            onDelete={handleDelete}
            onUpdatePlan={handleUpdatePlan}
            onGeneratePlan={handleGeneratePlan}
          />
        )}
        {showBury && <BuryForm onClose={() => setShowBury(false)} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  )
}
