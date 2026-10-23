// Small pure helpers for the GitHub bury flow, revival plan, and insights.
import { resurrectionScore } from './score.js'

export function parseGitHubRepo(input) {
  const s = (input || '').trim().replace(/\.git$/, '').replace(/\/$/, '')
  const urlMatch = s.match(/github\.com\/([^/\s]+)\/([^/\s]+)/)
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] }
  const shortMatch = s.match(/^([^/\s]+)\/([^/\s]+)$/)
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] }
  return null
}

export function monthsSince(dateStr, nowMs = Date.now()) {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return 0
  return Math.max(0, Math.round((nowMs - then) / (1000 * 60 * 60 * 24 * 30.44)))
}

export function calculatePlanProgress(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { total: 0, completed: 0, percent: 0, allDone: false }
  }
  const total = tasks.length
  const completed = tasks.filter((t) => Boolean(t.done)).length
  const percent = Math.round((completed / total) * 100)
  const allDone = total > 0 && completed === total
  return { total, completed, percent, allDone }
}

export function buildRevivalPlan(project) {
  const unfinished = Array.isArray(project?.unfinished) ? project.unfinished.filter(Boolean) : []
  const tasks = unfinished.length > 0
    ? unfinished.map((item, idx) => ({ id: `task-${idx + 1}-${Date.now()}`, text: item, done: false }))
    : [{ id: `task-1-${Date.now()}`, text: 'Define first revival milestone', done: false }]
  tasks.push({ id: `task-ship-${Date.now()}`, text: 'Ship the revived version', done: false })
  return {
    createdAt: new Date().toISOString().slice(0, 10),
    tasks,
  }
}

export function calculateGraveyardInsights(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return {
      total: 0,
      statusCounts: { Dormant: 0, Resurrected: 0, Revived: 0, Adopted: 0, Archived: 0 },
      scoreDistribution: { low: 0, mid: 0, high: 0 },
      oldestGrave: null,
      averageDormancy: 0,
      revivalReadyCount: 0,
    }
  }

  const statusCounts = { Dormant: 0, Resurrected: 0, Revived: 0, Adopted: 0, Archived: 0 }
  const scoreDistribution = { low: 0, mid: 0, high: 0 }
  let totalDormancy = 0
  let oldest = null
  let revivalReadyCount = 0

  projects.forEach((p) => {
    const status = p.status || 'Dormant'
    if (Object.prototype.hasOwnProperty.call(statusCounts, status)) {
      statusCounts[status] += 1
    } else {
      statusCounts.Dormant += 1
    }

    const score = resurrectionScore(p)
    if (score >= 80) {
      scoreDistribution.high += 1
      if (status === 'Dormant') revivalReadyCount += 1
    } else if (score >= 60) {
      scoreDistribution.mid += 1
    } else {
      scoreDistribution.low += 1
    }

    const dormancy = Number(p.monthsDormant) || 0
    totalDormancy += dormancy

    if (!oldest || dormancy > (Number(oldest.monthsDormant) || 0)) {
      oldest = p
    }
  })

  const averageDormancy = projects.length > 0
    ? Math.round((totalDormancy / projects.length) * 10) / 10
    : 0

  return {
    total: projects.length,
    statusCounts,
    scoreDistribution,
    oldestGrave: oldest,
    averageDormancy,
    revivalReadyCount,
  }
}

export function mergeActivityFeed(projects) {
  if (!Array.isArray(projects)) return []
  const items = []
  projects.forEach((p) => {
    if (Array.isArray(p.log)) {
      p.log.forEach((l, idx) => {
        items.push({
          id: `${p.id}-${l.date || 'nodate'}-${idx}`,
          projectId: p.id,
          projectTitle: p.title,
          date: l.date || '',
          text: l.text || '',
        })
      })
    }
  })
  return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}
