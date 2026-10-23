import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive,
  Moon,
  Sprout,
  HeartHandshake,
  Star,
  FileText,
  Compass,
  Sparkles,
  Download,
  Check,
  Zap,
} from 'lucide-react'

import { resurrectionScore, scoreBreakdown } from './score.js'
import {
  parseGitHubRepo,
  monthsSince,
  timeAgo,
  calculatePlanProgress,
  buildRevivalPlan,
  calculateGraveyardInsights,
  mergeActivityFeed,
  buildRevivalPrompt,
} from './utils.js'
import { loadProjects, saveProjects, clearProjects } from './storage.js'

const now = () => new Date().toISOString().slice(0, 10)

const SEED = [
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
    currentFate: '',
    adoptable: false,
    adoptedBy: '',
    adopter: null,
    createdAt: '2026-03-05',
    log: [{ date: '2026-03-05', text: 'Buried with a full autopsy.' }],
    revivalPlan: null,
  },
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
    currentFate: '',
    adoptable: true,
    adoptedBy: '',
    adopter: null,
    createdAt: '2026-04-12',
    log: [{ date: '2026-04-12', text: 'Buried with a full autopsy.' }],
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
    currentFate: '',
    adoptable: true,
    adoptedBy: '',
    adopter: null,
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
  Dormant: 'bg-[#F3EEE2] text-[#4D5E53] border border-[#E5DECD]',
  Resurrected: 'bg-[#E2F3EA] text-[#0B7A55] border border-[#A7D7C5]',
  Revived: 'bg-[#16A06B] text-white font-bold shadow-xs',
  Archived: 'bg-[#F3EEE2] text-[#8A9A8E] border border-[#E5DECD]',
  Adopted: 'bg-[#F7ECD2] text-[#8A6414] border border-[#E5C98A]',
}

function linesToList(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean)
}

function GitHubIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

function ScoreRing({ score, size = 64 }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Resurrection score ${score}`}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3EEE2" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke="#C8963E"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${score} ${100 - score}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-display font-black text-[#8A6414] leading-none" style={{ fontSize: size * 0.32 }}>
          {score}
        </span>
        <span className="text-[8px] font-sans text-[#4D5E53] leading-none mt-0.5">/100</span>
      </div>
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
      onClick={() => onOpen(project)}
      className="tombstone-card text-left w-full bg-white border border-[#E5DECD] rounded-[24px] p-5 cursor-pointer flex flex-col justify-between h-full"
    >
      <div>
        {/* Arched Top Section */}
        <div className="tombstone-arch-head p-4 pb-5 border border-[#E5DECD]/70 flex flex-col items-center justify-center text-center relative">
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${STATUS_STYLE[project.status] || STATUS_STYLE.Dormant}`}>
              {project.status === 'Revived' ? 'Revived ✓' : project.status}
            </span>
          </div>

          <div className="mt-4 mb-1">
            <ScoreRing score={score} size={64} />
          </div>

          <div className="text-[10px] uppercase font-bold tracking-widest text-[#8A6414] mt-1">
            Resurrection Score
          </div>
        </div>

        {/* Title and Epitaph */}
        <div className="px-1 mt-4">
          <h3 className="font-display text-xl font-bold leading-tight text-[#1F2A24] break-words">
            {project.title}
          </h3>

          {/* Thin gold gradient divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C8963E]/45 to-transparent my-2" />

          <p className="text-sm text-[#4D5E53] italic break-words line-clamp-2">
            “{project.epitaph}”
          </p>
        </div>

        {/* Badges & Tags */}
        <div className="px-1 flex flex-wrap items-center gap-1.5 mt-3">
          {score >= 80 && project.status === 'Dormant' && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E2F3EA] text-[#0B7A55]">
              Revival-Ready
            </span>
          )}
          {project.adoptable && project.status === 'Dormant' && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F7ECD2] text-[#8A6414]">
              Adoptable
            </span>
          )}
          {project.status === 'Adopted' && (
            <span
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F7ECD2] text-[#8A6414] truncate max-w-[210px]"
              title={`Adopted by ${project.adopter?.name || project.adoptedBy || 'Builder'}`}
            >
              Adopted by {project.adopter?.name || project.adoptedBy || 'Builder'}
            </span>
          )}
          {project.tags.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F3EEE2] border border-[#E5DECD] text-[#4D5E53]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Row (fixed layout to ensure equal card heights) */}
      <div className="mt-5 pt-3.5 border-t border-[#E5DECD]/70 px-1">
        <div className="h-1.5 rounded-full bg-[#EFEAD9] overflow-hidden">
          <div
            className="h-full bg-[#16A06B] rounded-full transition-all duration-300"
            style={{ width: `${project.completeness}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-[#4D5E53]">
          <span>{project.completeness}% built • Dormant {project.monthsDormant} mo</span>
          <span className="font-semibold text-[#16A06B] hover:underline">View autopsy →</span>
        </div>

        {/* Dedicated slot for revival plan / adopter progress inside footer */}
        <div className="h-8 mt-2 flex items-center">
          {plan.total > 0 ? (
            <div className="w-full bg-[#FAF6EE] border border-[#E5DECD] rounded-lg px-2.5 py-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#0B7A55] flex items-center gap-1.5 truncate">
                {plan.allDone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A06B]" />
                    <span>Revived Plan</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[#C8963E]" />
                    <span>Revival Plan</span>
                  </>
                )}
              </span>
              <span className="text-[#4D5E53] font-mono shrink-0">
                {plan.completed}/{plan.total} ({plan.percent}%)
              </span>
            </div>
          ) : project.status === 'Adopted' && project.adopter?.plan ? (
            <div className="w-full bg-[#FAF6EE] border border-[#E5C98A] rounded-lg px-2.5 py-1 text-[11px] text-[#8A6414] truncate" title={project.adopter.plan}>
              <span className="font-bold">Plan:</span> “{project.adopter.plan}”
            </div>
          ) : (
            <div className="text-[11px] text-[#8A9A8E] italic">
              Tap card to inspect vision & reasons
            </div>
          )}
        </div>
      </div>
    </motion.button>
  )
}

function RevivalPlanSection({ project, onUpdatePlan, onGeneratePlan, onCopyPrompt }) {
  const plan = project.revivalPlan
  const progress = calculatePlanProgress(plan?.tasks)
  const [newTaskText, setNewTaskText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')

  if (!plan) {
    return (
      <div className="mt-5 bg-[#FAF6EE] border border-dashed border-[#E5DECD] rounded-2xl p-4.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-[#0B7A55] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#C8963E]" />
              <span>REVIVAL PLAN</span>
            </h3>
            <p className="text-xs text-[#4D5E53] mt-0.5">
              Turn unfinished autopsy items into an actionable checklist. Choose a fate above or generate now.
            </p>
          </div>
          <button
            onClick={() => onGeneratePlan(project)}
            className="bg-[#16A06B] hover:bg-[#128256] text-white text-xs font-bold px-4 py-2 rounded-full shrink-0 shadow-xs cursor-pointer"
          >
            Generate Revival Plan
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
    <div className="mt-5 bg-[#FAF6EE] border border-[#E5DECD] rounded-2xl p-5 card-shadow">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm tracking-wide text-[#0B7A55] flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#C8963E]" />
              <span>REVIVAL PLAN</span>
            </span>
            {progress.allDone && (
              <span className="text-[10px] bg-[#16A06B] text-white font-extrabold px-2 py-0.5 rounded-full">
                REVIVED ✓
              </span>
            )}
          </h3>
          <p className="text-xs text-[#4D5E53] mt-0.5">
            Auto-built from unfinished autopsy items. Check them off to revive this build.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {onCopyPrompt && (
            <button
              type="button"
              onClick={onCopyPrompt}
              className="text-xs border border-[#C8963E]/60 bg-white hover:bg-[#F7ECD2] text-[#8A6414] font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
              title="Copy checklist as AI prompt for Cursor / Claude Code"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C8963E]" />
              <span className="hidden sm:inline">Copy as AI prompt</span>
              <span className="sm:hidden">Prompt</span>
            </button>
          )}
          <div className="text-right">
            <span className="text-sm font-bold text-[#0B7A55] font-mono">
              {progress.completed}/{progress.total}
            </span>
            <span className="text-xs text-[#4D5E53] ml-1">({progress.percent}%)</span>
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-[#EFEAD9] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 bg-[#16A06B]"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {progress.allDone && (
        <div className="mt-3.5 bg-[#E2F3EA] border border-[#A7D7C5] rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-[#0B7A55]">
            🎉 All tasks completed! This project is officially <span className="underline">Revived ✓</span>
          </p>
          <p className="text-xs text-[#4D5E53] mt-0.5">
            Recorded in the graveyard archives. Your past effort produced real software.
          </p>
        </div>
      )}

      <ul className="mt-3.5 space-y-2">
        {plan.tasks.map((task) => (
          <li
            key={task.id}
            className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
              task.done
                ? 'bg-[#F3EEE2] border-[#E5DECD] text-[#8A9A8E]'
                : 'bg-white border-[#E5DECD] text-[#1F2A24] shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <label className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer -ml-2 shrink-0">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleToggleTask(task.id)}
                  aria-label={`Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`}
                />
              </label>
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
                    className="flex-1 bg-white border border-[#16A06B] rounded-lg px-2.5 py-1 text-xs text-[#1F2A24]"
                  />
                  <button
                    onClick={() => handleSaveEdit(task.id)}
                    className="text-xs bg-[#16A06B] text-white px-2.5 py-1 rounded-full font-bold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs text-[#4D5E53] hover:text-[#1F2A24] px-1 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span
                  onClick={() => handleToggleTask(task.id)}
                  className={`text-xs break-words cursor-pointer select-none ${
                    task.done ? 'line-through text-[#8A9A8E]' : 'font-medium'
                  }`}
                >
                  {task.text}
                </span>
              )}
            </div>

            {editingId !== task.id && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleStartEdit(task)}
                  className="w-9 h-9 flex items-center justify-center text-xs text-[#4D5E53] hover:text-[#16A06B] hover:bg-[#F3EEE2] rounded-full cursor-pointer transition-colors"
                  title="Edit task"
                  aria-label="Edit milestone"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="w-9 h-9 flex items-center justify-center text-xs text-[#4D5E53] hover:text-[#BC3F26] hover:bg-[#FDF2F0] rounded-full cursor-pointer transition-colors"
                  title="Remove task"
                  aria-label="Remove milestone"
                >
                  ✕
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddTask} className="flex gap-2 mt-3.5">
        <input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="+ Add another revival milestone…"
          className="flex-1 bg-white border border-[#E5DECD] rounded-xl px-3.5 py-2 text-xs text-[#1F2A24] placeholder-[#8A9A8E]"
        />
        <button
          type="submit"
          disabled={!newTaskText.trim()}
          className="bg-[#16A06B] hover:bg-[#128256] text-white font-bold text-xs px-4 py-2 rounded-xl disabled:opacity-40 cursor-pointer shadow-xs"
        >
          Add
        </button>
      </form>
    </div>
  )
}

function useModalTrap({ isOpen, onClose }) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const el = modalRef.current
    if (!el) return

    const previousActiveElement = document.activeElement

    const getFocusables = () =>
      Array.from(
        el.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((node) => node.offsetParent !== null)

    const focusables = getFocusables()
    if (focusables.length > 0) {
      const firstInput = focusables.find((n) => n.tagName === 'INPUT') || focusables[0]
      firstInput.focus()
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const nodes = getFocusables()
        if (nodes.length === 0) {
          e.preventDefault()
          return
        }
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    }
  }, [isOpen, onClose])

  return modalRef
}

function AutopsyView({
  project,
  onClose,
  onFate,
  onToggleAdoptable,
  onRequestAdopt,
  onDeleteRequest,
  onUpdatePlan,
  onGeneratePlan,
  onNotify,
}) {
  const modalRef = useModalTrap({ isOpen: true, onClose })
  const score = resurrectionScore(project)
  const breakdown = scoreBreakdown(project)
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const shareCardRef = useRef(null)

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
      onNotify('Autopsy summary copied to clipboard.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const fallbackCopy = (text) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    try {
      document.execCommand('copy')
    } catch {}
    document.body.removeChild(ta)
  }

  const copyRevivalPrompt = () => {
    const promptText = buildRevivalPrompt(project)
    const successToast = () => onNotify('Revival prompt copied.')
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promptText)
        .then(successToast)
        .catch(() => {
          fallbackCopy(promptText)
          successToast()
        })
    } else {
      fallbackCopy(promptText)
      successToast()
    }
  }

  const exportShareCard = async () => {
    if (!shareCardRef.current || sharing) return
    setSharing(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(shareCardRef.current, {
        width: 1200,
        height: 630,
        cacheBust: true,
      })
      const slug = (project.id || project.title || 'project')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const link = document.createElement('a')
      link.download = `${slug}-tombstone.png`
      link.href = dataUrl
      link.click()
      onNotify('Tombstone image exported (1200×630).')
    } catch (err) {
      console.error(err)
      onNotify('Failed to generate image.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[rgba(20,32,26,0.45)] backdrop-blur-[6px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5DECD] w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl card-shadow text-[#1F2A24] relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`Autopsy of ${project.title}`}
      >
        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4 border-b border-[#E5DECD]/60 flex items-start justify-between gap-4 shrink-0 bg-white z-10">
          <div>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[project.status] || STATUS_STYLE.Dormant}`}>
              {project.status === 'Revived' ? 'Revived ✓' : project.status}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black mt-2 text-[#1F2A24] break-words">
              {project.title}
            </h2>
            <p className="text-[#4D5E53] italic break-words">“{project.epitaph}”</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={copySummary}
                className="text-xs border border-[#E5DECD] bg-[#FAF6EE] text-[#1F2A24] px-3.5 py-1.5 rounded-full cursor-pointer hover:bg-[#F3EEE2] transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy summary'}
              </button>
              <button
                onClick={copyRevivalPrompt}
                className="text-xs border border-[#C8963E]/60 bg-[#FAF6EE] text-[#8A6414] font-semibold px-3.5 py-1.5 rounded-full cursor-pointer hover:bg-[#F7ECD2] flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C8963E]" />
                <span>Copy revival prompt</span>
              </button>
              <button
                onClick={exportShareCard}
                disabled={sharing}
                className="text-xs border border-[#E5DECD] bg-[#FAF6EE] text-[#1F2A24] px-3.5 py-1.5 rounded-full cursor-pointer hover:bg-[#F3EEE2] flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#C8963E]" />
                <span>{sharing ? 'Generating…' : 'Download tombstone'}</span>
              </button>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs border border-[#E5DECD] bg-[#FAF6EE] text-[#1F2A24] px-3.5 py-1.5 rounded-full hover:bg-[#F3EEE2] transition-colors"
                >
                  View repository ↗
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-2xl leading-none rounded-full text-[#4D5E53] hover:text-[#1F2A24] hover:bg-[#F3EEE2] cursor-pointer shrink-0 transition-colors"
            aria-label="Close autopsy"
          >
            ×
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-scrollbar overflow-y-auto p-6 sm:p-7 pt-4 flex-1">
          {/* Autopsy Record */}
          <div className="bg-[#FAF6EE] border border-[#E5DECD] rounded-2xl p-5">
            <h3 className="font-bold text-xs tracking-wider uppercase text-[#8A6414]">THE AUTOPSY</h3>
            <p className="mt-2 text-sm text-[#1F2A24]">
              <span className="text-[#4D5E53] font-semibold">Original vision: </span>
              {project.vision}
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-3.5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0B7A55]">✓ What was built</p>
                <ul className="text-sm text-[#1F2A24] list-disc ml-5 mt-1 space-y-0.5">
                  {project.built.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8A6414]">○ Still unfinished</p>
                <ul className="text-sm text-[#1F2A24] list-disc ml-5 mt-1 space-y-0.5">
                  {project.unfinished.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-[#FBF8F1] border-l-4 border-[#C8963E] rounded-r-xl">
              <p className="text-sm text-[#1F2A24] italic font-display">
                <span className="font-sans font-bold not-italic text-xs uppercase tracking-wider text-[#8A6414] block mb-1">
                  Honest reason work stopped:
                </span>
                “{project.reason}”
              </p>
            </div>
          </div>

          {/* Resurrection Score Breakdown */}
          <div className="mt-5 bg-[#FAF6EE] border border-[#E5DECD] rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-center">
            <ScoreRing score={score} size={84} />
            <div className="flex-1 w-full">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#8A6414]">
                RESURRECTION SCORE BREAKDOWN
              </h3>
              <div className="space-y-2 mt-3">
                {breakdown.map((b) => (
                  <div key={b.label} className="bg-white border border-[#E5DECD] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1F2A24]">{b.mathText}</span>
                    <span className="font-mono text-[#0B7A55] font-bold">+{b.points}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm text-[#1F2A24] font-bold border-t border-[#E5DECD] pt-3 mt-3">
                <span>Total</span>
                <span className="font-mono text-[#C8963E] text-base">{score} / 100</span>
              </div>
              <p className="text-[11px] text-[#4D5E53] mt-2 leading-relaxed">
                Formula: 50% idea strength + 30% completeness + 20% dormancy bonus (10 pts/month away, max 100 — distance gives fresh eyes).
              </p>
            </div>
          </div>

          {/* Revival Plan Section */}
          <RevivalPlanSection
            project={project}
            onUpdatePlan={onUpdatePlan}
            onGeneratePlan={onGeneratePlan}
            onCopyPrompt={copyRevivalPrompt}
          />

          {/* Adopt a Grave */}
          <div className="mt-5 bg-[#FAF6EE] border border-[#E5DECD] rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#8A6414]">ADOPT A GRAVE</h3>
              {project.status === 'Adopted' && (
                <span className="text-[10px] bg-[#F7ECD2] text-[#8A6414] font-bold px-2 py-0.5 rounded-full border border-[#E5C98A]">
                  Adopted
                </span>
              )}
            </div>
            {project.status === 'Adopted' ? (
              <div className="mt-2 text-sm text-[#1F2A24] bg-white border border-[#E5C98A] rounded-xl p-3.5">
                <p>
                  Adopted by <b className="text-[#8A6414]">{project.adopter?.name || project.adoptedBy}</b>
                  {project.adopter?.plan ? ` — “${project.adopter.plan}”` : ''}
                  {project.adopter?.handle ? ` (${project.adopter.handle})` : ''}
                </p>
                <p className="text-xs text-[#4D5E53] mt-1">
                  This grave has a new builder continuing its journey.
                </p>
              </div>
            ) : project.adoptable ? (
              <div className="mt-2.5">
                <p className="text-xs text-[#4D5E53] mb-3">
                  This project was marked for adoption by its creator. You can take over ownership and continue the vision.
                </p>
                <button
                  onClick={() => onRequestAdopt && onRequestAdopt(project)}
                  className="bg-[#C8963E] hover:bg-[#B3822F] text-white font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Adopt this grave</span>
                </button>
              </div>
            ) : (
              <p className="text-sm mt-1 text-[#4D5E53]">Not marked adoptable yet.</p>
            )}
            {project.status !== 'Adopted' && (
              <button
                onClick={() => onToggleAdoptable(project)}
                className="text-xs underline text-[#4D5E53] hover:text-[#1F2A24] mt-3 cursor-pointer block"
              >
                {project.adoptable ? 'Remove from adoption list' : 'Mark as adoptable'}
              </button>
            )}
          </div>

          {/* Archive Log */}
          {project.log.length > 0 && (
            <div className="mt-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#4D5E53]">ARCHIVE LOG</h3>
              <ul className="text-sm mt-2 space-y-1.5 border-l-2 border-[#E5DECD] pl-3.5 ml-1">
                {[...project.log].reverse().map((l, i) => (
                  <li key={i} className="text-[#1F2A24]">
                    <span className="text-[#4D5E53] font-mono text-xs mr-1">{l.date} —</span>
                    {l.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Permanent Delete */}
          <div className="mt-6 pt-4 border-t border-[#E5DECD] flex items-center justify-between pb-2">
            <span className="text-xs text-[#4D5E53]">Buried {project.createdAt}</span>
            <button
              onClick={() => onDeleteRequest(project)}
              className="text-xs text-[#BC3F26] hover:underline cursor-pointer font-medium"
            >
              Remove this grave permanently
            </button>
          </div>
        </div>

        {/* Sticky Bottom Bar for Choosing Fate */}
        <div className="p-4 sm:p-5 border-t border-[#E5DECD] bg-[#FAF6EE] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A6414]">
              Choose Fate:
            </span>
            <span className="text-xs text-[#4D5E53]">Select an action to update project status</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FATES.map((f) => {
              const isContinue = f.key === 'Continue'
              return (
                <button
                  key={f.key}
                  onClick={() => onFate(project, f.key)}
                  className={`p-2.5 rounded-xl text-center cursor-pointer transition-all ${
                    isContinue
                      ? 'bg-[#16A06B] hover:bg-[#128256] text-white shadow-xs font-bold'
                      : 'bg-white hover:bg-[#F3EEE2] border border-[#E5DECD] text-[#1F2A24] font-medium'
                  }`}
                >
                  <span className="text-sm block">{f.icon} {f.key}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Off-screen 1200x630 share card target for export */}
        <div style={{ position: 'fixed', left: -9999, top: -9999, pointerEvents: 'none' }}>
          <div
            ref={shareCardRef}
            style={{
              width: 1200,
              height: 630,
              backgroundColor: '#FAF6EE',
              color: '#1F2A24',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '44px 56px',
              fontFamily: '"Space Grotesk", system-ui, sans-serif',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Arched tombstone outline / frame */}
            <div
              style={{
                position: 'absolute',
                inset: '24px',
                border: '3px solid #E5C98A',
                borderTopLeftRadius: '260px',
                borderTopRightRadius: '260px',
                borderBottomLeftRadius: '28px',
                borderBottomRightRadius: '28px',
                pointerEvents: 'none',
              }}
            />

            {/* Top header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, padding: '0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 36 }}>🪦</span>
                <span style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 28, fontWeight: 900, color: '#1F2A24' }}>
                  The Project Graveyard
                </span>
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#8A6414',
                  backgroundColor: '#F7ECD2',
                  padding: '6px 18px',
                  borderRadius: '999px',
                }}
              >
                Rest in progress. Rise at dawn.
              </span>
            </div>

            {/* Center Content */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40, position: 'relative', zIndex: 2, padding: '0 24px' }}>
              <div style={{ maxWidth: 740 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: '#0B7A55',
                    display: 'block',
                    marginBottom: 10,
                  }}
                >
                  {project.status === 'Revived' ? 'Revived Project' : project.status === 'Adopted' ? 'Adopted Grave' : 'Dormant Monument'}
                </span>
                <h1
                  style={{
                    fontFamily: '"Fraunces", Georgia, serif',
                    fontSize: 54,
                    fontWeight: 900,
                    lineHeight: 1.12,
                    margin: 0,
                    color: '#1F2A24',
                  }}
                >
                  {project.title}
                </h1>
                <div style={{ width: '120px', height: '2px', background: 'linear-gradient(90deg, #C8963E, transparent)', margin: '16px 0' }} />
                <p
                  style={{
                    fontSize: 22,
                    fontStyle: 'italic',
                    color: '#4D5E53',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  “{project.epitaph}”
                </p>
              </div>

              {/* Arched Score Ring Box */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '3px solid #C8963E',
                  borderRadius: '36px',
                  padding: '28px 36px',
                  textAlign: 'center',
                  boxShadow: '0 8px 24px rgba(200, 150, 62, 0.15)',
                  minWidth: '220px',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#8A6414', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Resurrection Score
                </div>
                <div style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 68, fontWeight: 900, color: '#C8963E', lineHeight: 1, marginTop: 8 }}>
                  {score}
                </div>
                <div style={{ fontSize: 16, color: '#4D5E53', fontWeight: 600, marginTop: 4 }}>
                  out of 100
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '2px solid #E5DECD',
                paddingTop: 18,
                fontSize: 16,
                color: '#4D5E53',
                position: 'relative',
                zIndex: 2,
                paddingLeft: 24,
                paddingRight: 24,
              }}
            >
              <span>{project.completeness}% built • Dormant {project.monthsDormant} months</span>
              <span style={{ fontWeight: 700, color: '#8A6414' }}>https://project-graveyard-woad.vercel.app</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function GraveyardInsights({ projects, onSelectProject }) {
  const insights = useMemo(() => calculateGraveyardInsights(projects), [projects])

  const total = insights.total
  const radius = 40
  const circumference = 2 * Math.PI * radius

  const slices = useMemo(() => {
    if (total === 0) return []
    const statusOrder = [
      { key: 'Dormant', color: '#D6CEBC', label: 'Dormant' },
      { key: 'Resurrected', color: '#C8963E', label: 'Resurrected' },
      { key: 'Revived', color: '#16A06B', label: 'Revived ✓' },
      { key: 'Adopted', color: '#E5C98A', label: 'Adopted' },
      { key: 'Archived', color: '#8A9A8E', label: 'Archived' },
    ]
    let accumulated = 0
    return statusOrder
      .map((s) => {
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
      })
      .filter((s) => s.count > 0)
  }, [insights.statusCounts, total, circumference])

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <p className="text-xs tracking-[0.3em] text-[#8A6414] font-bold uppercase">GRAVEYARD INSIGHTS</p>
          <h2 className="font-display text-2xl sm:text-3xl font-black mt-1 text-[#1F2A24]">
            Living data from the digital afterlife.
          </h2>
          <p className="text-sm text-[#4D5E53]">Real-time analytics computed live across your buried projects.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#0B7A55] bg-[#E2F3EA] border border-[#A7D7C5] px-3.5 py-1 rounded-full w-fit">
          <span className="w-2 h-2 rounded-full bg-[#16A06B]" />
          <span className="font-semibold">Live Graveyard Metrics</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E5DECD] rounded-[24px] p-6 card-shadow flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-[#1F2A24]">STATUS BREAKDOWN</h3>
            <p className="text-xs text-[#4D5E53] mt-0.5">Where your builds currently stand</p>
          </div>

          <div className="flex items-center justify-center gap-6 my-5">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#F3EEE2" strokeWidth="13" />
                {slices.map((slice) => (
                  <circle
                    key={slice.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="13"
                    strokeDasharray={slice.strokeDash}
                    strokeDashoffset={slice.strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display text-2xl font-black text-[#1F2A24]">{total}</span>
                <span className="text-[10px] text-[#4D5E53]">Graves</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs flex-1">
              {slices.length === 0 ? (
                <p className="text-xs text-[#4D5E53]">No data yet</p>
              ) : (
                slices.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[#1F2A24]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="truncate">{s.label}</span>
                    </span>
                    <span className="font-mono text-[#4D5E53] text-[11px]">{s.count} ({s.percent}%)</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <p className="text-[11px] text-[#4D5E53] border-t border-[#E5DECD] pt-2">
            Status updates automatically when fates are chosen or tasks completed.
          </p>
        </div>

        <div className="bg-white border border-[#E5DECD] rounded-[24px] p-6 card-shadow flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-[#1F2A24]">SCORE DISTRIBUTION</h3>
            <p className="text-xs text-[#4D5E53] mt-0.5">Projects ranked by revival potential</p>
          </div>

          <div className="space-y-4 my-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#0B7A55] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A06B]" /> 80–100 Revival Ready
                </span>
                <span className="font-mono text-[#1F2A24] font-bold">
                  {insights.scoreDistribution.high}{' '}
                  <span className="text-[#4D5E53] text-[11px]">
                    ({total ? Math.round((insights.scoreDistribution.high / total) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#F3EEE2] overflow-hidden">
                <div
                  className="h-full bg-[#16A06B] rounded-full transition-all duration-500"
                  style={{ width: `${total ? (insights.scoreDistribution.high / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8A6414] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C8963E]" /> 60–79 Promising Builds
                </span>
                <span className="font-mono text-[#1F2A24] font-bold">
                  {insights.scoreDistribution.mid}{' '}
                  <span className="text-[#4D5E53] text-[11px]">
                    ({total ? Math.round((insights.scoreDistribution.mid / total) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#F3EEE2] overflow-hidden">
                <div
                  className="h-full bg-[#C8963E] rounded-full transition-all duration-500"
                  style={{ width: `${total ? (insights.scoreDistribution.mid / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#4D5E53] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8A9A8E]" /> 0–59 Deep Hibernation
                </span>
                <span className="font-mono text-[#1F2A24] font-bold">
                  {insights.scoreDistribution.low}{' '}
                  <span className="text-[#4D5E53] text-[11px]">
                    ({total ? Math.round((insights.scoreDistribution.low / total) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#F3EEE2] overflow-hidden">
                <div
                  className="h-full bg-[#8A9A8E] rounded-full transition-all duration-500"
                  style={{ width: `${total ? (insights.scoreDistribution.low / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#4D5E53] border-t border-[#E5DECD] pt-2">
            {insights.revivalReadyCount} dormant {insights.revivalReadyCount === 1 ? 'project is' : 'projects are'} currently ripe for continuation.
          </p>
        </div>

        <div className="bg-white border border-[#E5DECD] rounded-[24px] p-6 card-shadow flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-[#1F2A24]">DORMANCY & RECOVERY</h3>
            <p className="text-xs text-[#4D5E53] mt-0.5">Time away turns into clarity</p>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3">
            <div className="bg-[#FAF6EE] border border-[#E5DECD] rounded-2xl p-3.5">
              <span className="text-[11px] text-[#4D5E53] font-medium block">Avg. Dormancy</span>
              <span className="font-display text-2xl font-black text-[#0B7A55] mt-0.5 block">
                {insights.averageDormancy}
                <span className="text-xs font-sans font-normal text-[#4D5E53] ml-1">mo</span>
              </span>
              <span className="text-[10px] text-[#4D5E53] mt-1 block">Fresh eyes threshold</span>
            </div>

            <div className="bg-[#FAF6EE] border border-[#E5DECD] rounded-2xl p-3.5">
              <span className="text-[11px] text-[#4D5E53] font-medium block">Revival-Ready</span>
              <span className="font-display text-2xl font-black text-[#8A6414] mt-0.5 block">
                {total ? Math.round((insights.scoreDistribution.high / total) * 100) : 0}%
              </span>
              <span className="text-[10px] text-[#4D5E53] mt-1 block">Score ≥ 80 ratio</span>
            </div>
          </div>

          {insights.oldestGrave ? (
            <button
              onClick={() => onSelectProject(insights.oldestGrave.id)}
              className="text-left bg-[#FAF6EE] border border-[#E5DECD] hover:border-[#16A06B] rounded-2xl p-3 transition-colors cursor-pointer w-full"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8A6414] font-semibold">Oldest Grave</span>
                <span className="text-[#4D5E53]">{insights.oldestGrave.monthsDormant} mo away</span>
              </div>
              <div className="font-bold text-xs truncate mt-0.5 text-[#1F2A24]">{insights.oldestGrave.title}</div>
            </button>
          ) : (
            <div className="text-xs text-[#4D5E53] py-2">No graves buried yet.</div>
          )}

          <p className="text-[11px] text-[#4D5E53] border-t border-[#E5DECD] pt-2 mt-2">
            Formula rewards up to 10 months of dormancy to encourage revival.
          </p>
        </div>
      </div>
    </section>
  )
}

function AdoptModal({ project, isOpen, onClose, onConfirm }) {
  const modalRef = useModalTrap({ isOpen, onClose })
  const [name, setName] = useState('')
  const [plan, setPlan] = useState('')
  const [handle, setHandle] = useState('')

  if (!isOpen || !project) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !plan.trim()) return
    onConfirm(project, {
      name: name.trim(),
      plan: plan.trim().slice(0, 140),
      handle: handle.trim(),
    })
    onClose()
  }

  const charsRemaining = 140 - plan.length

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[rgba(20,32,26,0.45)] backdrop-blur-[6px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5DECD] w-full max-w-lg max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl card-shadow text-[#1F2A24] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`Adopt ${project.title}`}
      >
        <div className="p-6 pb-4 border-b border-[#E5DECD]/60 flex items-start justify-between gap-4 shrink-0 bg-white">
          <div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#F7ECD2] text-[#8A6414]">
              Community Adoption
            </span>
            <h2 className="font-display text-2xl font-black mt-2 text-[#1F2A24]">
              Adopt {project.title}
            </h2>
            <p className="text-xs text-[#4D5E53] italic mt-0.5">
              “{project.epitaph}”
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-2xl leading-none rounded-full text-[#4D5E53] hover:text-[#1F2A24] hover:bg-[#F3EEE2] cursor-pointer shrink-0 transition-colors"
            aria-label="Close adoption modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-4 flex flex-col gap-4 overflow-y-auto modal-scrollbar">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
              Your Name or Pseudonym <span className="text-[#BC3F26]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full bg-[#FAF6EE] border border-[#E5DECD] rounded-xl px-3.5 py-2.5 text-sm text-[#1F2A24] focus:bg-white focus:border-[#C8963E] outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
                My plan in one line <span className="text-[#BC3F26]">*</span>
              </label>
              <span className={`text-[11px] font-mono ${charsRemaining < 20 ? 'text-[#BC3F26] font-bold' : 'text-[#8A9A8E]'}`}>
                {charsRemaining} left
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={140}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="e.g. Fork to Next.js 15, wire transcription API, ship beta"
              className="w-full bg-[#FAF6EE] border border-[#E5DECD] rounded-xl px-3.5 py-2.5 text-sm text-[#1F2A24] focus:bg-white focus:border-[#C8963E] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2A24] mb-1.5">
              Contact or GitHub Handle <span className="text-[#8A9A8E] lowercase font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@username or email"
              className="w-full bg-[#FAF6EE] border border-[#E5DECD] rounded-xl px-3.5 py-2.5 text-sm text-[#1F2A24] focus:bg-white focus:border-[#C8963E] outline-none transition-colors"
            />
          </div>

          <div className="bg-[#F7ECD2]/50 border border-[#E5C98A] rounded-xl p-3 text-xs text-[#8A6414]">
            💡 Adopting updates the project status to <b>Adopted</b>, stamps your name on the grave record, and welcomes you into the activity log.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#4D5E53] hover:text-[#1F2A24] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !plan.trim()}
              className="bg-[#C8963E] hover:bg-[#B3822F] text-white text-xs font-bold px-6 py-2.5 rounded-full cursor-pointer shadow-xs disabled:opacity-40 transition-all"
            >
              Confirm adoption
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function AdoptAGraveSection({ projects, onOpenAutopsy, onStartAdopt, onMarkFirstAdoptable }) {
  const adoptableProjects = projects.filter((p) => p.adoptable && p.status === 'Dormant')

  return (
    <section id="adoptable-graves" className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-[#F7ECD2]/60 via-white to-[#F7ECD2]/30 border border-[#E5C98A] rounded-[24px] p-6 sm:p-7 card-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#8A6414] uppercase">
              COMMUNITY REVIVAL
            </span>
            <h3 className="font-display text-2xl font-bold text-[#1F2A24] mt-0.5">
              Adopt-a-Grave
            </h3>
            <p className="text-xs text-[#4D5E53]">
              These unfinished builds were generously marked for adoption by their original creators. Claim one to give it a second life.
            </p>
          </div>
          <span className="text-xs bg-[#F7ECD2] text-[#8A6414] font-bold px-3 py-1 rounded-full shrink-0 w-fit">
            {adoptableProjects.length} Available
          </span>
        </div>

        {adoptableProjects.length === 0 ? (
          <div className="bg-white/80 border border-[#E5C98A]/60 rounded-2xl p-8 text-center mt-4">
            <p className="text-sm font-medium text-[#1F2A24]">
              No graves are waiting for a new builder yet.
            </p>
            <p className="text-xs text-[#4D5E53] mt-1 mb-4">
              Mark an unfinished project as adoptable to let other builders take over.
            </p>
            <button
              onClick={onMarkFirstAdoptable}
              className="bg-[#C8963E] hover:bg-[#B3822F] text-white text-xs font-bold px-5 py-2.5 rounded-full cursor-pointer shadow-xs transition-all"
            >
              Browse dormant graves to mark adoptable
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {adoptableProjects.map((p) => {
              const unfinishedPreview = p.unfinished && p.unfinished.length > 0
                ? p.unfinished.slice(0, 2).join(', ') + (p.unfinished.length > 2 ? ` (+${p.unfinished.length - 2} more)` : '')
                : 'Unfinished milestones recorded in autopsy'
              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#E5DECD] rounded-2xl p-4.5 flex flex-col justify-between card-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F7ECD2] text-[#8A6414]">
                        Adoptable
                      </span>
                      <span className="font-display font-bold text-sm text-[#8A6414]">
                        Score: {resurrectionScore(p)}
                      </span>
                    </div>
                    <h4
                      onClick={() => onOpenAutopsy(p)}
                      className="font-bold text-base text-[#1F2A24] mt-2 cursor-pointer hover:text-[#C8963E] transition-colors"
                    >
                      {p.title}
                    </h4>
                    <p className="text-xs text-[#4D5E53] italic mt-1 line-clamp-2">“{p.epitaph}”</p>

                    <div className="mt-3 text-xs bg-[#FAF6EE] border border-[#E5DECD] rounded-xl p-2.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A6414] block mb-0.5">
                        Unfinished
                      </span>
                      <span className="text-[#1F2A24] line-clamp-2">
                        {unfinishedPreview}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5DECD]/60 flex items-center justify-between gap-2">
                    <span className="text-xs text-[#4D5E53]">{p.completeness}% built</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenAutopsy(p)}
                        className="text-xs text-[#4D5E53] hover:text-[#1F2A24] px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#F3EEE2]"
                      >
                        Autopsy
                      </button>
                      <button
                        onClick={() => onStartAdopt(p)}
                        className="bg-[#C8963E] hover:bg-[#B3822F] text-white text-xs font-bold px-4 py-1.5 rounded-full cursor-pointer shadow-xs transition-all"
                      >
                        Adopt this grave
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function TagFilterBar({ tags, selectedTag, onSelectTag, projectsCount }) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
      <span className="text-[#4D5E53] font-semibold text-[11px] mr-1 shrink-0">Tags:</span>
      <button
        onClick={() => onSelectTag('All')}
        className={`px-3.5 py-2 min-h-[44px] flex items-center rounded-full cursor-pointer transition-all shrink-0 font-medium ${
          selectedTag === 'All'
            ? 'bg-[#1F2A24] text-[#FAF6EE] font-bold shadow-xs'
            : 'bg-white border border-[#E5DECD] text-[#4D5E53] hover:text-[#1F2A24] hover:border-[#D6CEBC]'
        }`}
      >
        All ({projectsCount})
      </button>
      {tags.map((t) => (
        <button
          key={t.name}
          onClick={() => onSelectTag(selectedTag === t.name ? 'All' : t.name)}
          className={`px-3.5 py-2 min-h-[44px] flex items-center rounded-full cursor-pointer transition-all shrink-0 font-medium ${
            selectedTag === t.name
              ? 'bg-[#1F2A24] text-[#FAF6EE] font-bold shadow-xs'
              : 'bg-white border border-[#E5DECD] text-[#4D5E53] hover:text-[#1F2A24] hover:border-[#D6CEBC]'
          }`}
        >
          {t.name} <span className="opacity-70 text-[10px] ml-1">({t.count})</span>
        </button>
      ))}
    </div>
  )
}

function ActivityFeed({ projects, onSelectProject }) {
  const feed = useMemo(() => mergeActivityFeed(projects), [projects])
  const [expanded, setExpanded] = useState(false)

  const visibleFeed = expanded ? feed : feed.slice(0, 6)

  // Group by project
  const groupedByProject = useMemo(() => {
    const map = new Map()
    visibleFeed.forEach((item) => {
      if (!map.has(item.projectId)) {
        map.set(item.projectId, { title: item.projectTitle, items: [] })
      }
      map.get(item.projectId).items.push(item)
    })
    return Array.from(map.entries())
  }, [visibleFeed])

  const getEventIcon = (type) => {
    switch (type) {
      case 'revive':
        return <Sparkles className="w-3.5 h-3.5 text-[#16A06B]" />
      case 'adopt':
        return <HeartHandshake className="w-3.5 h-3.5 text-[#C8963E]" />
      case 'fate':
        return <Compass className="w-3.5 h-3.5 text-[#C8963E]" />
      case 'autopsy':
        return <FileText className="w-3.5 h-3.5 text-[#0B7A55]" />
      default:
        return <Archive className="w-3.5 h-3.5 text-[#8A6414]" />
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <p className="text-xs tracking-[0.3em] text-[#8A6414] font-bold uppercase">GRAVEYARD CHRONICLES</p>
          <h2 className="font-display text-2xl sm:text-3xl font-black mt-1 text-[#1F2A24]">
            Unified Activity Feed
          </h2>
          <p className="text-sm text-[#4D5E53]">
            Every burial, autopsy, fate decision, and revival recorded in reverse-chronological order.
          </p>
        </div>
        <span className="text-xs font-mono text-[#4D5E53]">{feed.length} total events</span>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-12 bg-white border border-[#E5DECD] rounded-2xl card-shadow">
          <p className="text-sm text-[#4D5E53]">No activity recorded in the graveyard yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5DECD] rounded-[24px] p-6 sm:p-7 card-shadow">
          <div className="space-y-6">
            {groupedByProject.map(([projectId, group]) => (
              <div key={projectId} className="border-b border-[#E5DECD]/60 pb-5 last:border-b-0 last:pb-0">
                <button
                  onClick={() => onSelectProject(projectId)}
                  className="font-display font-bold text-base text-[#1F2A24] hover:text-[#16A06B] transition-colors cursor-pointer text-left flex items-center gap-2 mb-3"
                >
                  <span>🪦</span>
                  <span>{group.title}</span>
                </button>

                <div className="pl-6 space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5DECD]">
                  {group.items.map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between gap-2">
                      <div className="absolute -left-6 w-4 h-4 rounded-full bg-[#FAF6EE] border border-[#E5DECD] flex items-center justify-center">
                        {getEventIcon(item.type)}
                      </div>
                      <span className="text-sm text-[#1F2A24]">{item.text}</span>
                      <span
                        className="text-xs font-mono text-[#4D5E53] shrink-0 cursor-help"
                        title={item.date}
                      >
                        {timeAgo(item.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {feed.length > 6 && (
            <div className="mt-6 pt-4 border-t border-[#E5DECD] text-center">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-[#0B7A55] hover:underline cursor-pointer py-1.5 px-4 rounded-full border border-[#E5DECD] bg-[#FAF6EE] hover:bg-[#F3EEE2] transition-colors"
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

function BuryForm({ onClose, onSave, onNotify }) {
  const modalRef = useModalTrap({ isOpen: true, onClose })
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
      if (res.status === 404) {
        setGhState({ busy: false, msg: 'Repo not found or private' })
        return
      }
      if (res.status === 403) {
        setForm((f) => ({
          ...f,
          title: f.title || parsed.repo.replace(/[-_]/g, ' '),
          repoUrl: f.repoUrl || `https://github.com/${parsed.owner}/${parsed.repo}`,
        }))
        setGhState({
          busy: false,
          msg: 'GitHub rate limit reached (60/hr). Project title prefilled — continue manually below.',
        })
        return
      }
      if (!res.ok) {
        setForm((f) => ({
          ...f,
          title: f.title || parsed.repo.replace(/[-_]/g, ' '),
          repoUrl: f.repoUrl || `https://github.com/${parsed.owner}/${parsed.repo}`,
        }))
        setGhState({
          busy: false,
          msg: `GitHub returned ${res.status}. Project title prefilled — continue manually below.`,
        })
        return
      }
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
      onNotify(`Fetched details from ${repo.full_name}`)
    } catch {
      setForm((f) => ({
        ...f,
        title: f.title || parsed.repo.replace(/[-_]/g, ' '),
        repoUrl: f.repoUrl || `https://github.com/${parsed.owner}/${parsed.repo}`,
      }))
      setGhState({
        busy: false,
        msg: 'Could not reach GitHub (network issue). Project title prefilled — continue manually below.',
      })
    }
  }

  const previewScore = resurrectionScore({
    ideaStrength: Number(form.ideaStrength),
    completeness: Number(form.completeness),
    monthsDormant: Number(form.monthsDormant),
  })

  const missingFields = []
  if (!form.title.trim()) missingFields.push('Title')
  if (!form.vision.trim()) missingFields.push('Original vision')
  if (!form.reason.trim()) missingFields.push('Honest reason work stopped')

  const valid = missingFields.length === 0
  const field = 'w-full bg-[#FAF6EE] border border-[#E5DECD] rounded-xl px-3.5 py-2 text-sm mt-1 text-[#1F2A24] focus:border-[#16A06B]'
  const label = 'block text-sm font-semibold mt-4 text-[#1F2A24]'

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[rgba(20,32,26,0.45)] backdrop-blur-[6px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="modal-scrollbar bg-white border border-[#E5DECD] w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 card-shadow text-[#1F2A24]"
        role="dialog"
        aria-modal="true"
        aria-label="Bury a project"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#1F2A24]">Bury a project</h2>
            <p className="text-sm text-[#4D5E53] mt-0.5">No shame. Give it a proper autopsy and it can live again.</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-2xl leading-none rounded-full text-[#4D5E53] hover:text-[#1F2A24] hover:bg-[#F3EEE2] cursor-pointer shrink-0 transition-colors"
            aria-label="Close form"
          >
            ×
          </button>
        </div>

        {/* GitHub fetch box with Octocat icon */}
        <div className="mt-5 bg-[#FAF6EE] border border-[#E5DECD] rounded-2xl p-4.5">
          <div className="flex items-center gap-2">
            <GitHubIcon className="w-5 h-5 text-[#1F2A24]" />
            <p className="text-sm font-bold text-[#1F2A24]">Fastest way — bury it straight from GitHub</p>
          </div>
          <p className="text-xs text-[#4D5E53] mt-1">
            Paste a public repo. We fetch its name, description, language and dormancy — you only write the autopsy.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <input
              value={ghInput}
              onChange={(e) => setGhInput(e.target.value)}
              placeholder="github.com/you/that-dead-repo"
              className="flex-1 bg-white border border-[#E5DECD] rounded-xl px-3.5 py-2 text-sm text-[#1F2A24]"
            />
            <button
              type="button"
              disabled={ghState.busy || !ghInput.trim()}
              onClick={fetchFromGitHub}
              className="bg-[#16A06B] hover:bg-[#128256] text-white font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {ghState.busy ? 'Fetching…' : 'Fetch repo'}
            </button>
          </div>
          {ghState.msg && <p className="text-xs mt-2 text-[#1F2A24] font-medium">{ghState.msg}</p>}
          {form.repoUrl && <p className="text-xs mt-1 text-[#4D5E53]">Linked repo: {form.repoUrl}</p>}
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
            checked={form.adoptable}
            onChange={(e) => set('adoptable', e.target.checked)}
          />
          <span className="text-[#1F2A24]">Mark as adoptable — another builder may claim and continue it</span>
        </label>

        <div className="flex items-center justify-between mt-6 bg-[#FAF6EE] border border-[#E5DECD] rounded-2xl px-4 py-3">
          <span className="text-sm text-[#4D5E53]">Live Resurrection Score preview</span>
          <ScoreRing score={previewScore} size={50} />
        </div>

        <div className="relative group mt-5">
          <button
            disabled={!valid}
            onClick={() => onSave(form)}
            className={`w-full py-3.5 rounded-full font-bold text-white transition-all ${
              valid
                ? 'bg-[#16A06B] hover:bg-[#128256] btn-bury-enabled cursor-pointer'
                : 'bg-[#16A06B] opacity-50 cursor-not-allowed'
            }`}
            title={!valid ? `Missing required: ${missingFields.join(', ')}` : ''}
          >
            Bury it with honour
          </button>
          {!valid && (
            <div className="text-xs text-[#BC3F26] mt-2 text-center font-medium">
              Missing required: {missingFields.join(', ')} — the autopsy is the whole point.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function ConfirmDialog({ isOpen, title, message, confirmText = 'Confirm', confirmStyle = 'danger', onConfirm, onCancel }) {
  const modalRef = useModalTrap({ isOpen, onClose: onCancel })
  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[rgba(20,32,26,0.45)] backdrop-blur-[6px] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        ref={modalRef}
        className="bg-white border border-[#E5DECD] rounded-[24px] p-6 sm:p-7 max-w-md w-full card-shadow text-[#1F2A24]"
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <p className="text-sm text-[#4D5E53] mt-2 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2.5 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-[#E5DECD] bg-white text-[#1F2A24] hover:bg-[#F3EEE2] text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer ${
              confirmStyle === 'danger'
                ? 'bg-[#BC3F26] hover:bg-[#A3341D]'
                : 'bg-[#16A06B] hover:bg-[#128256]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    prevRef.current = value
    if (from === to) return

    let raf
    const start = performance.now()
    const tick = (t) => {
      const k = Math.min((t - start) / 700, 1)
      const eased = 1 - Math.pow(1 - k, 3)
      setDisplay(Math.round(from + (to - from) * eased))
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
          <p className="text-xs tracking-[0.3em] text-[#8A6414] font-bold uppercase text-center">HOW IT WORKS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-center mt-2 text-[#1F2A24]">
            From burial to resurrection in four steps.
          </h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              {...reveal}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="bg-white border border-[#E5DECD] rounded-2xl p-6 card-shadow flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-[#F7ECD2] text-[#8A6414] font-black font-display flex items-center justify-center text-sm">
                  {s.n}
                </div>
                <h3 className="font-bold text-base mt-4 text-[#1F2A24]">{s.title}</h3>
                <p className="text-sm text-[#4D5E53] mt-1.5 leading-relaxed">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <motion.div {...reveal}>
          <p className="text-xs tracking-[0.3em] text-[#8A6414] font-bold uppercase text-center">TARGET USERS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-center mt-2 text-[#1F2A24]">
            Built for people who start things.
          </h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {PERSONAS.map((p, i) => (
            <motion.div
              key={p.title}
              {...reveal}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="bg-white border border-[#E5DECD] rounded-2xl p-6 card-shadow flex flex-col justify-between"
            >
              <div>
                <p className="text-[10px] tracking-[0.22em] text-[#8A6414] font-bold uppercase">{p.tag}</p>
                <h3 className="font-bold text-base mt-2 text-[#1F2A24]">{p.title}</h3>
                <p className="text-sm text-[#4D5E53] mt-1.5 leading-relaxed">{p.text}</p>
              </div>
              <p className="text-xs text-[#0B7A55] mt-4 font-semibold">{p.focus}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14">
        <motion.div {...reveal}>
          <p className="text-xs tracking-[0.3em] text-[#8A6414] font-bold uppercase text-center">THE PROBLEM → THE ANSWER</p>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-center mt-2 text-[#1F2A24]">
            Four ways unfinished work loses its value.
          </h2>
        </motion.div>
        <div className="mt-8 space-y-3.5">
          {PAINS.map((row, i) => (
            <motion.div
              key={row.pain}
              {...reveal}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="grid md:grid-cols-2 gap-2 md:gap-0 bg-white border border-[#E5DECD] rounded-2xl overflow-hidden card-shadow"
            >
              <div className="p-5 text-[#1F2A24]">
                <span className="text-[#BC3F26] font-bold mr-2">✕</span>
                {row.pain}
              </div>
              <div className="p-5 bg-[#E2F3EA]/35 md:border-l border-[#E5DECD] text-[#0B7A55]">
                <span className="text-[#16A06B] font-bold mr-2">✓</span>
                {row.fix}
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div {...reveal} className="text-center mt-12">
          <p className="font-display text-2xl font-bold italic text-[#4D5E53]">
            “An unfinished project isn't a worthless project.”
          </p>
          <button
            onClick={onBury}
            className="mt-5 bg-[#16A06B] hover:bg-[#128256] text-white font-bold px-7 py-3.5 rounded-full cursor-pointer shadow-sm transition-all"
          >
            Bury your first project
          </button>
        </motion.div>
      </section>
    </>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-6 text-[#1F2A24]">
          <div className="bg-white border border-[#E5DECD] rounded-[24px] p-8 max-w-lg w-full card-shadow text-center">
            <span className="text-4xl mb-3 block">🪦</span>
            <h1 className="font-display text-2xl font-bold">Something went wrong in the graveyard</h1>
            <p className="text-sm text-[#4D5E53] mt-2">
              Don't worry — your buried projects are safely recorded. You can reload or reset your local graveyard data.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => window.location.reload()}
                className="bg-[#16A06B] hover:bg-[#128256] text-white font-bold px-5 py-2.5 rounded-full text-xs shadow-xs cursor-pointer"
              >
                Reload graveyard
              </button>
              <button
                onClick={() => {
                  clearProjects()
                  window.location.reload()
                }}
                className="bg-white border border-[#E5DECD] text-[#4D5E53] hover:text-[#1F2A24] font-semibold px-4 py-2.5 rounded-full text-xs cursor-pointer"
              >
                Reset saved data
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function AppContent() {
  const [projects, setProjects] = useState(() => loadProjects() || SEED)
  const [selectedId, setSelectedId] = useState(null)
  const [showBury, setShowBury] = useState(false)
  const [adoptProject, setAdoptProject] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedTag, setSelectedTag] = useState('All')
  const [sortBy, setSortBy] = useState('score')
  const [toasts, setToasts] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false })

  const fileRef = useRef(null)
  const searchRef = useRef(null)
  const lastOpenerRef = useRef(null)

  useEffect(() => {
    saveProjects(window.localStorage, projects)
  }, [projects])

  // Global "/" keyboard shortcut to focus search
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Modal behaviour: Esc closes, scroll lock, focus restoration
  useEffect(() => {
    const isModalOpen = selectedId || showBury || adoptProject || confirmDialog.isOpen
    if (!isModalOpen) {
      if (lastOpenerRef.current && typeof lastOpenerRef.current.focus === 'function') {
        lastOpenerRef.current.focus()
        lastOpenerRef.current = null
      }
      return
    }

    if (!lastOpenerRef.current && document.activeElement) {
      lastOpenerRef.current = document.activeElement
    }

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedId(null)
        setShowBury(false)
        setAdoptProject(null)
        setConfirmDialog({ isOpen: false })
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [selectedId, showBury, adoptProject, confirmDialog.isOpen])

  const notify = (message) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev.slice(-1), { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const selected = projects.find((p) => p.id === selectedId) || null

  const stats = useMemo(() => ({
    total: projects.length,
    dormant: projects.filter((p) => p.status === 'Dormant').length,
    resurrected: projects.filter((p) => p.status === 'Resurrected' || p.status === 'Revived').length,
    adopted: projects.filter((p) => p.status === 'Adopted').length,
    adoptable: projects.filter((p) => p.adoptable && p.status === 'Dormant').length,
    avgScore: projects.length ? Math.round(projects.reduce((a, p) => a + resurrectionScore(p), 0) / projects.length) : 0,
  }), [projects])

  const radar = useMemo(() => {
    const dormant = projects.filter((p) => p.status === 'Dormant')
    if (!dormant.length) return null
    return dormant.reduce((best, p) => (resurrectionScore(p) > resurrectionScore(best) ? p : best), dormant[0])
  }, [projects])

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
    if (project.currentFate === fate || (fate === 'Archive' && project.status === 'Archived')) {
      return
    }
    const isArchive = fate === 'Archive'
    const status = isArchive ? 'Archived' : 'Resurrected'
    const newLog = {
      date: now(),
      text: isArchive ? 'Archived with honour. Record preserved.' : `Resurrected — fate chosen: ${fate}.`,
    }

    update(project.id, (p) => {
      const plan = (!isArchive && !p.revivalPlan) ? buildRevivalPlan(p) : p.revivalPlan
      return {
        ...p,
        status,
        currentFate: fate,
        revivalPlan: plan,
        log: [...p.log, newLog],
      }
    })
    notify(`Fate chosen: ${fate} — recorded in archive.`)
  }

  const handleGeneratePlan = (project) => {
    const plan = buildRevivalPlan(project)
    update(project.id, (p) => ({
      ...p,
      revivalPlan: plan,
      log: [...p.log, { date: now(), text: 'Revival Plan generated from autopsy items.' }],
    }))
    notify(`Revival Plan generated with ${plan.tasks.length} milestones.`)
  }

  const handleUpdatePlan = async (project, newPlan) => {
    const progress = calculatePlanProgress(newPlan.tasks)
    let reachedCompletion = false
    let wasUnchecked = false

    update(project.id, (p) => {
      const logs = [...p.log]

      if (progress.allDone && p.status !== 'Revived') {
        logs.push({ date: now(), text: 'All revival tasks completed — project Revived ✓!' })
        reachedCompletion = true
        return {
          ...p,
          previousStatus: p.status,
          previousFate: p.currentFate || (p.status === 'Resurrected' ? 'Continue' : ''),
          status: 'Revived',
          revivalPlan: newPlan,
          log: logs,
        }
      } else if (!progress.allDone && p.status === 'Revived') {
        wasUnchecked = true
        const revertedStatus = p.previousStatus || 'Resurrected'
        const revertedFate = p.previousFate || p.currentFate || 'Continue'
        logs.push({ date: now(), text: `Revival reopened — status reverted to ${revertedStatus}.` })
        return {
          ...p,
          status: revertedStatus,
          currentFate: revertedFate,
          revivalPlan: newPlan,
          log: logs,
        }
      }

      return {
        ...p,
        revivalPlan: newPlan,
      }
    })

    if (reachedCompletion) {
      try {
        const confetti = (await import('canvas-confetti')).default
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#16A06B', '#C8963E', '#F7ECD2'],
        })
      } catch {
        // dynamic import fallback
      }
      notify('🎉 All revival milestones finished! Project marked Revived ✓')
    } else if (wasUnchecked) {
      notify('Revival reopened — status reverted.')
    }
  }

  const handleAdopt = (project, adopterData) => {
    const adopterObj = typeof adopterData === 'string'
      ? { name: adopterData, plan: 'Continuing this build.', handle: '', date: now() }
      : {
          name: adopterData.name?.trim() || 'Anonymous Builder',
          plan: adopterData.plan?.trim().slice(0, 140) || '',
          handle: adopterData.handle?.trim() || '',
          date: now(),
        }

    const logText = adopterObj.plan
      ? `Adopted by ${adopterObj.name} — "${adopterObj.plan}"`
      : `Adopted by ${adopterObj.name} — second life begins.`

    update(project.id, (p) => ({
      ...p,
      status: 'Adopted',
      adoptedBy: adopterObj.name,
      adopter: adopterObj,
      log: [...p.log, { date: now(), text: logText }],
    }))
    notify(`Adopted! ${project.title} has a new builder.`)
  }

  const handleToggleAdoptable = (project) => {
    const willBeAdoptable = !project.adoptable
    update(project.id, (p) => ({
      ...p,
      adoptable: willBeAdoptable,
      log: [...p.log, { date: now(), text: willBeAdoptable ? 'Marked adoptable.' : 'Removed from adoption list.' }],
    }))
    notify(willBeAdoptable ? 'Marked adoptable.' : 'Removed from adoption list.')
  }

  const handleMarkFirstAdoptable = () => {
    const dormant = projects.find((p) => p.status === 'Dormant' && !p.adoptable)
    if (dormant) {
      handleToggleAdoptable(dormant)
      notify(`Marked "${dormant.title}" as adoptable!`)
    } else {
      const el = document.getElementById('graveyard-grid')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const promptDelete = (project) => {
    setConfirmDialog({
      isOpen: true,
      title: `Remove "${project.title}" permanently?`,
      message: 'This cannot be undone. The autopsy, score and archive logs will be wiped.',
      confirmText: 'Remove grave',
      confirmStyle: 'danger',
      onConfirm: () => {
        setProjects((ps) => ps.filter((p) => p.id !== project.id))
        setSelectedId(null)
        setConfirmDialog({ isOpen: false })
        notify('Project permanently removed from graveyard.')
      },
      onCancel: () => setConfirmDialog({ isOpen: false }),
    })
  }

  const promptResetDemo = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset the graveyard demo?',
      message: 'Your buried projects will be replaced with the 3 original demo projects.',
      confirmText: 'Reset demo',
      confirmStyle: 'primary',
      onConfirm: () => {
        setProjects(SEED)
        clearProjects()
        setSelectedId(null)
        setSelectedTag('All')
        setStatusFilter('All')
        setConfirmDialog({ isOpen: false })
        notify('Graveyard reset to demo projects.')
      },
      onCancel: () => setConfirmDialog({ isOpen: false }),
    })
  }

  const handleSave = (form) => {
    if (!form.title?.trim() || !form.vision?.trim() || !form.reason?.trim()) return
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
      currentFate: '',
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
    notify('Project buried with honour.')
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project-graveyard-export.json'
    a.click()
    URL.revokeObjectURL(url)
    notify('Graveyard data exported successfully.')
  }

  const importJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const rawList = Array.isArray(parsed)
          ? parsed
          : (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects))
            ? parsed.projects
            : null

        if (!rawList || rawList.length === 0) {
          notify('Invalid file format. Could not import.')
          return
        }

        const isValid = rawList.every(
          (p) => p && typeof p === 'object' && typeof p.title === 'string' && p.title.trim()
        )

        if (!isValid) {
          notify('Invalid project data: missing required title or fields.')
          return
        }

        const clean = rawList.map((p, i) => ({
          id: typeof p.id === 'string' && p.id ? p.id : `imported-${Date.now()}-${i}`,
          title: String(p.title).trim().slice(0, 120),
          epitaph: typeof p.epitaph === 'string' && p.epitaph ? p.epitaph : 'Gone, but properly recorded.',
          vision: typeof p.vision === 'string' ? p.vision.trim() : '',
          built: Array.isArray(p.built) ? p.built.map(String) : [],
          unfinished: Array.isArray(p.unfinished) ? p.unfinished.map(String) : [],
          reason: typeof p.reason === 'string' && p.reason ? p.reason : 'Not recorded.',
          tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
          completeness: Math.min(100, Math.max(0, Number(p.completeness) || 0)),
          ideaStrength: Math.min(100, Math.max(0, Number(p.ideaStrength) || 0)),
          monthsDormant: Math.min(60, Math.max(0, Number(p.monthsDormant) || 0)),
          status: ['Dormant', 'Resurrected', 'Revived', 'Archived', 'Adopted'].includes(p.status) ? p.status : 'Dormant',
          currentFate: typeof p.currentFate === 'string' ? p.currentFate : '',
          adoptable: !!p.adoptable,
          repoUrl: typeof p.repoUrl === 'string' ? p.repoUrl : '',
          adoptedBy: typeof p.adoptedBy === 'string' ? p.adoptedBy : '',
          createdAt: typeof p.createdAt === 'string' && p.createdAt ? p.createdAt : now(),
          log: Array.isArray(p.log) && p.log.length > 0 ? p.log : [{ date: now(), text: 'Imported into this graveyard.' }],
          revivalPlan: p.revivalPlan && Array.isArray(p.revivalPlan.tasks) ? p.revivalPlan : null,
        }))

        setProjects(clean)
        setSelectedId(null)
        notify('Graveyard data imported successfully.')
      } catch {
        notify('Could not read file as JSON.')
      } finally {
        if (fileRef.current) fileRef.current.value = ''
      }
    }
    reader.onerror = () => {
      notify('Could not read file.')
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen text-[#1F2A24]">
      {/* Sticky Header */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF6EE]/90 border-b border-[#E5DECD]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xl">🪦</span>
            <span className="font-display font-black text-lg text-[#1F2A24] tracking-tight">
              The Project Graveyard
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={promptResetDemo}
              className="border border-[#E5DECD] bg-white px-3.5 py-1.5 rounded-full text-xs font-medium text-[#4D5E53] hover:text-[#7D2D20] hover:bg-[#FDF2F0] cursor-pointer transition-colors"
            >
              Reset demo
            </button>
            <button
              onClick={exportJSON}
              className="hidden sm:inline-block border border-[#E5DECD] bg-white px-3.5 py-1.5 rounded-full text-xs font-medium text-[#1F2A24] hover:bg-[#F3EEE2] cursor-pointer"
            >
              Export
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="hidden sm:inline-block border border-[#E5DECD] bg-white px-3.5 py-1.5 rounded-full text-xs font-medium text-[#1F2A24] hover:bg-[#F3EEE2] cursor-pointer"
            >
              Import
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />

            <button
              onClick={() => setShowBury(true)}
              className="bg-[#16A06B] hover:bg-[#128256] text-white font-bold px-4 py-2 rounded-full text-xs sm:text-sm cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
            >
              <span>+</span>
              <span>Bury a project</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-6xl mx-auto px-4 pt-12 pb-14">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 text-left">
            <p className="text-xs tracking-[0.25em] text-[#8A6414] font-bold uppercase">
              DIGITAL AFTERLIFE FOR UNFINISHED SOFTWARE
            </p>
            <h1
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-[#1F2A24] leading-[1.08] mt-3"
              style={{ textWrap: 'balance' }}
            >
              Where good projects rest —<br />
              <span className="italic text-[#C8963E]">until they rise again.</span>
            </h1>
            <p className="text-[#4D5E53] text-base sm:text-lg mt-3.5 max-w-xl leading-relaxed">
              Every unfinished project deserves a second chance.{' '}
              <a
                href="#adoptable-graves"
                className="inline-flex items-center gap-1 font-semibold text-[#8A6414] hover:underline cursor-pointer"
              >
                <span>Explore {stats.adoptable} adoptable graves</span>
                <span>→</span>
              </a>
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-7">
              <button
                onClick={() => setShowBury(true)}
                className="bg-[#16A06B] hover:bg-[#128256] text-white font-bold px-6 py-3 rounded-full text-sm sm:text-base cursor-pointer shadow-sm transition-all"
              >
                Bury a project
              </button>
              <button
                onClick={() => setShowBury(true)}
                className="bg-white hover:bg-[#F3EEE2] text-[#1F2A24] font-semibold border border-[#E5DECD] px-5 py-3 rounded-full text-sm sm:text-base cursor-pointer shadow-2xs flex items-center gap-2 transition-all"
              >
                <GitHubIcon className="w-4 h-4 text-[#1F2A24]" />
                <span>Fetch from GitHub</span>
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 25 }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-[24px] overflow-hidden card-shadow border border-[#E5DECD] bg-white">
              <img
                src="/hero-dawn.webp"
                alt="Dawn stone arch covered in ivy overlooking valleys and sunrise"
                className="w-full h-auto object-cover block"
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Stats Strip with Lucide Icons in Tinted Circles */}
      <section className="max-w-6xl mx-auto px-4 -mt-2 mb-8">
        <div className="bg-white border border-[#E5DECD] rounded-[24px] p-4 sm:p-6 card-shadow grid grid-cols-2 sm:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5DECD]">
          <div className="flex flex-col items-center justify-center text-center p-2">
            <div className="w-10 h-10 rounded-full bg-[#F7ECD2] flex items-center justify-center text-[#8A6414] mb-1.5 shadow-2xs">
              <Archive className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="font-display text-3xl sm:text-4xl font-black text-[#1F2A24]">
              <AnimatedNumber value={stats.total} />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-[#4D5E53] uppercase mt-1">BURIED</span>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-2 pt-4 sm:pt-2">
            <div className="w-10 h-10 rounded-full bg-[#F3EEE2] flex items-center justify-center text-[#4D5E53] mb-1.5 shadow-2xs">
              <Moon className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="font-display text-3xl sm:text-4xl font-black text-[#1F2A24]">
              <AnimatedNumber value={stats.dormant} />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-[#4D5E53] uppercase mt-1">DORMANT</span>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-2 pt-4 sm:pt-2">
            <div className="w-10 h-10 rounded-full bg-[#E2F3EA] flex items-center justify-center text-[#0B7A55] mb-1.5 shadow-2xs">
              <Sprout className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="font-display text-3xl sm:text-4xl font-black text-[#0B7A55]">
              <AnimatedNumber value={stats.resurrected} />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-[#0B7A55] uppercase mt-1">REVIVED / ACTIVE</span>
          </div>

          <a
            href="#adoptable-graves"
            className="flex flex-col items-center justify-center text-center p-2 pt-4 sm:pt-2 hover:opacity-85 transition-opacity cursor-pointer group"
            title="Jump to Adoptable Graves"
          >
            <div className="w-10 h-10 rounded-full bg-[#F7ECD2] flex items-center justify-center text-[#8A6414] mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="font-display text-3xl sm:text-4xl font-black text-[#1F2A24]">
              <AnimatedNumber value={stats.adopted} />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-[#4D5E53] uppercase mt-1 group-hover:text-[#8A6414] transition-colors">
              ADOPTED ({stats.adoptable} OPEN)
            </span>
          </a>

          <div className="flex flex-col items-center justify-center text-center p-2 pt-4 sm:pt-2 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-full bg-[#F7ECD2] flex items-center justify-center text-[#C8963E] mb-1.5 shadow-2xs">
              <Star className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="font-display text-3xl sm:text-4xl font-black text-[#8A6414]">
              <AnimatedNumber value={stats.avgScore} />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-[#8A6414] uppercase mt-1">AVERAGE SCORE</span>
          </div>
        </div>
      </section>

      {/* Revival Radar with 140px Graphic & 6s Sweep */}
      {radar && (
        <section className="max-w-6xl mx-auto px-4 mb-8">
          <div className="bg-white border border-[#E5DECD] rounded-[24px] p-6 sm:p-8 card-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* 140px Radar Graphic */}
                <div className="relative w-[140px] h-[140px] rounded-full bg-[#FAF6EE] border border-[#E5DECD] flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  <div className="absolute inset-2 rounded-full border border-[#A7D7C5]/50" />
                  <div className="absolute inset-5 rounded-full border border-[#A7D7C5]/40" />
                  <div className="absolute inset-8 rounded-full border border-[#A7D7C5]/30" />
                  <div className="absolute inset-11 rounded-full border border-[#A7D7C5]/20" />
                  <div
                    className="absolute inset-0 radar-sweep-slow pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, rgba(22, 160, 107, 0.15) 300deg, rgba(22, 160, 107, 0.45) 360deg)',
                    }}
                  />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#C8963E] pulse-gold relative z-10" />
                </div>

                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1F2A24]">
                    Revival Radar
                  </h2>
                  <p className="text-sm font-semibold text-[#1F2A24] mt-0.5">
                    {radar.title} — highest chance of revival
                  </p>
                  <div className="font-display text-3xl sm:text-5xl font-black text-[#C8963E] leading-tight mt-1.5">
                    {resurrectionScore(radar)}{' '}
                    <span className="text-base font-sans font-normal text-[#4D5E53]">/ 100</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4D5E53] mt-1.5 max-w-xl leading-relaxed">
                    Idea strength {radar.ideaStrength} · {radar.completeness}% built · dormant {radar.monthsDormant} months — the strongest revival candidate in the yard.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedId(radar.id)}
                className="bg-[#16A06B] hover:bg-[#128256] text-white text-sm font-bold px-7 py-3 rounded-full shrink-0 shadow-xs cursor-pointer self-start md:self-center transition-all"
              >
                Open autopsy
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Adopt-a-Grave Section */}
      <AdoptAGraveSection
        projects={projects}
        onOpenAutopsy={(p) => setSelectedId(p.id)}
        onStartAdopt={(p) => setAdoptProject(p)}
        onMarkFirstAdoptable={handleMarkFirstAdoptable}
      />

      {/* Tag Chips Row */}
      <section className="max-w-6xl mx-auto px-4 mt-6">
        <TagFilterBar
          tags={tagList}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          projectsCount={projects.length}
        />
      </section>

      {/* Search, Sort & Filter Row */}
      <section className="max-w-6xl mx-auto px-4 mt-3 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-white border border-[#E5DECD] rounded-full px-4 py-2.5 text-sm text-[#1F2A24] placeholder-[#4D5E53] pr-12 card-shadow"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="text-[10px] bg-[#F3EEE2] border border-[#E5DECD] px-1.5 py-0.5 rounded text-[#4D5E53] font-mono">
              /
            </kbd>
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-[#E5DECD] rounded-full px-4 py-2.5 text-sm text-[#1F2A24] cursor-pointer card-shadow"
        >
          {['All', 'Dormant', 'Resurrected', 'Revived', 'Adopted', 'Archived', 'Adoptable'].map((s) => (
            <option key={s} value={s}>{s === 'Revived' ? 'Revived ✓' : s}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white border border-[#E5DECD] rounded-full px-4 py-2.5 text-sm text-[#1F2A24] cursor-pointer card-shadow"
        >
          <option value="score">Sort: Highest score</option>
          <option value="recent">Sort: Recently buried</option>
          <option value="dormant">Sort: Longest dormant</option>
        </select>
      </section>

      {/* Main Tombstone Cards Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-12">
        {visible.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-[#E5DECD] rounded-[24px] card-shadow p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#F7ECD2] flex items-center justify-center mx-auto text-3xl mb-4">
              🪦
            </div>
            <h2 className="font-display text-2xl font-bold text-[#1F2A24]">
              {projects.length === 0 ? 'Quiet for now' : 'No graves match'}
            </h2>
            <p className="text-[#4D5E53] text-sm mt-2 leading-relaxed">
              {projects.length === 0
                ? 'No graves yet in the cemetery. Bury your first unfinished build and give it a chance to rise again.'
                : 'No projects match your search, tag, or status filter. Clear all filters to explore all graves.'}
            </p>
            <div className="flex justify-center gap-2 mt-5">
              {(query || statusFilter !== 'All' || selectedTag !== 'All') && (
                <button
                  onClick={() => {
                    setQuery('')
                    setStatusFilter('All')
                    setSelectedTag('All')
                  }}
                  className="border border-[#E5DECD] bg-white px-4 py-2 rounded-full text-xs font-semibold text-[#4D5E53] hover:text-[#1F2A24] cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
              <button
                onClick={() => setShowBury(true)}
                className="bg-[#16A06B] hover:bg-[#128256] text-white font-bold px-5 py-2.5 rounded-full text-xs cursor-pointer shadow-xs transition-all"
              >
                + Bury a project
              </button>
            </div>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 auto-rows-fr">
            <AnimatePresence>
              {visible.map((p) => (
                <TombstoneCard key={p.id} project={p} onOpen={(proj) => setSelectedId(proj.id)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Graveyard Insights Section */}
      <GraveyardInsights projects={projects} onSelectProject={(id) => setSelectedId(id)} />

      {/* Info Sections */}
      <InfoSections onBury={() => setShowBury(true)} />

      {/* Activity Feed */}
      <ActivityFeed projects={projects} onSelectProject={(id) => setSelectedId(id)} />

      {/* Footer */}
      <footer className="border-t border-[#E5DECD] mt-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <div className="flex items-center justify-center gap-2 font-display font-black text-lg text-[#1F2A24]">
            <span>🪦</span>
            <span>The Project Graveyard</span>
          </div>
          <p className="text-xs text-[#4D5E53] mt-2 leading-relaxed">
            Frontend-only by design — no account, no backend, your graveyard lives in your browser.<br />
            Built by Manthan Rajpurohit · Team Straw hat pirate · Baloon National Hackathon 2026, Round 2.
          </p>
          <p className="font-display italic text-sm text-[#4D5E53] mt-3">
            Honouring past code so good ideas never stay buried.
          </p>

          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={promptResetDemo}
              className="text-xs text-[#4D5E53] hover:text-[#1F2A24] underline cursor-pointer"
            >
              Reset demo graveyard
            </button>
          </div>
        </div>
      </footer>

      {/* Dialog Modals */}
      <AnimatePresence>
        {selected && (
          <AutopsyView
            project={selected}
            onClose={() => setSelectedId(null)}
            onFate={handleFate}
            onToggleAdoptable={handleToggleAdoptable}
            onRequestAdopt={(p) => setAdoptProject(p)}
            onDeleteRequest={promptDelete}
            onUpdatePlan={handleUpdatePlan}
            onGeneratePlan={handleGeneratePlan}
            onNotify={notify}
          />
        )}
        {showBury && (
          <BuryForm
            onClose={() => setShowBury(false)}
            onSave={handleSave}
            onNotify={notify}
          />
        )}
        {adoptProject && (
          <AdoptModal
            project={adoptProject}
            isOpen={Boolean(adoptProject)}
            onClose={() => setAdoptProject(null)}
            onConfirm={handleAdopt}
          />
        )}
      </AnimatePresence>

      {/* Styled In-App Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText={confirmDialog.confirmText}
            confirmStyle={confirmDialog.confirmStyle}
            onConfirm={confirmDialog.onConfirm}
            onCancel={confirmDialog.onCancel}
          />
        )}
      </AnimatePresence>

      {/* Fixed Bottom-Center Toasts (Max 2 visible, z-50 above sticky header) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-[#FAF6EE] border border-[#E5DECD] text-[#1F2A24] px-5 py-3 rounded-full card-shadow flex items-center gap-2.5 text-xs sm:text-sm font-medium shadow-lg pointer-events-auto"
            >
              <div className="w-5 h-5 rounded-full bg-[#16A06B] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
