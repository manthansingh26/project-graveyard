import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseGitHubRepo,
  monthsSince,
  timeAgo,
  getActivityEventType,
  calculatePlanProgress,
  buildRevivalPlan,
  calculateGraveyardInsights,
  mergeActivityFeed,
} from './utils.js'

test('parses full GitHub URLs and owner/repo shorthand', () => {
  assert.deepEqual(parseGitHubRepo('https://github.com/manthansingh26/newportfolio'), { owner: 'manthansingh26', repo: 'newportfolio' })
  assert.deepEqual(parseGitHubRepo('github.com/you/dead-repo.git'), { owner: 'you', repo: 'dead-repo' })
  assert.deepEqual(parseGitHubRepo('you/dead-repo'), { owner: 'you', repo: 'dead-repo' })
  assert.equal(parseGitHubRepo('not a repo'), null)
  assert.equal(parseGitHubRepo(''), null)
})

test('monthsSince counts whole months and never goes negative', () => {
  const now = new Date('2026-10-23T00:00:00Z').getTime()
  assert.equal(monthsSince('2026-04-23T00:00:00Z', now), 6)
  assert.equal(monthsSince('2027-01-01T00:00:00Z', now), 0)
  assert.equal(monthsSince('garbage', now), 0)
})

test('timeAgo calculates human readable relative time', () => {
  const now = new Date('2026-10-23T12:00:00Z').getTime()
  assert.equal(timeAgo('2026-10-23T11:59:30Z', now), 'just now')
  assert.equal(timeAgo('2026-10-23T10:00:00Z', now), '2h ago')
  assert.equal(timeAgo('2026-10-22T12:00:00Z', now), 'yesterday')
  assert.equal(timeAgo('2026-10-18T12:00:00Z', now), '5d ago')
  assert.equal(timeAgo('2026-07-23T12:00:00Z', now), '3mo ago')
})

test('getActivityEventType identifies activity events correctly', () => {
  assert.equal(getActivityEventType('Buried with a full autopsy.'), 'bury')
  assert.equal(getActivityEventType('Adopted by Alice — second life begins.'), 'adopt')
  assert.equal(getActivityEventType('Resurrected — fate chosen: Continue.'), 'fate')
  assert.equal(getActivityEventType('All revival tasks completed — project Revived ✓!'), 'revive')
})

test('calculatePlanProgress computes task count, percentage, and allDone state', () => {
  assert.deepEqual(calculatePlanProgress([]), { total: 0, completed: 0, percent: 0, allDone: false })
  assert.deepEqual(calculatePlanProgress(null), { total: 0, completed: 0, percent: 0, allDone: false })

  const tasks = [
    { id: '1', text: 'Task 1', done: true },
    { id: '2', text: 'Task 2', done: false },
    { id: '3', text: 'Ship', done: false },
  ]
  assert.deepEqual(calculatePlanProgress(tasks), { total: 3, completed: 1, percent: 33, allDone: false })

  tasks[1].done = true
  assert.deepEqual(calculatePlanProgress(tasks), { total: 3, completed: 2, percent: 67, allDone: false })

  tasks[2].done = true
  assert.deepEqual(calculatePlanProgress(tasks), { total: 3, completed: 3, percent: 100, allDone: true })
})

test('buildRevivalPlan builds checklist from unfinished items + final ship task', () => {
  const project = {
    unfinished: ['Audio timeline sync', 'Search export'],
  }
  const plan = buildRevivalPlan(project)
  assert.equal(plan.tasks.length, 3)
  assert.equal(plan.tasks[0].text, 'Audio timeline sync')
  assert.equal(plan.tasks[1].text, 'Search export')
  assert.equal(plan.tasks[2].text, 'Ship the revived version')
  assert.equal(plan.tasks.every((t) => t.done === false), true)

  const emptyProject = { unfinished: [] }
  const defaultPlan = buildRevivalPlan(emptyProject)
  assert.equal(defaultPlan.tasks.length, 2)
  assert.equal(defaultPlan.tasks[1].text, 'Ship the revived version')
})

test('calculateGraveyardInsights calculates accurate distribution and stats', () => {
  const empty = calculateGraveyardInsights([])
  assert.equal(empty.total, 0)
  assert.equal(empty.averageDormancy, 0)
  assert.equal(empty.oldestGrave, null)

  const mockProjects = [
    { id: 'p1', title: 'P1', ideaStrength: 92, completeness: 80, monthsDormant: 6, status: 'Dormant' },
    { id: 'p2', title: 'P2', ideaStrength: 92, completeness: 85, monthsDormant: 7, status: 'Resurrected' },
    { id: 'p3', title: 'P3', ideaStrength: 78, completeness: 55, monthsDormant: 14, status: 'Dormant' },
  ]

  const insights = calculateGraveyardInsights(mockProjects)
  assert.equal(insights.total, 3)
  assert.equal(insights.statusCounts.Dormant, 2)
  assert.equal(insights.statusCounts.Resurrected, 1)
  assert.equal(insights.scoreDistribution.high, 2)
  assert.equal(insights.scoreDistribution.mid, 1)
  assert.equal(insights.scoreDistribution.low, 0)
  assert.equal(insights.oldestGrave.title, 'P3')
  assert.equal(insights.averageDormancy, 9)
  assert.equal(insights.revivalReadyCount, 1)
})

test('mergeActivityFeed gathers all project logs in reverse-chronological order with event types', () => {
  const mockProjects = [
    {
      id: 'p1',
      title: 'P1',
      log: [
        { date: '2026-04-12', text: 'Buried with autopsy' },
        { date: '2026-04-15', text: 'Resurrected — fate: Continue' },
      ],
    },
    {
      id: 'p2',
      title: 'P2',
      log: [
        { date: '2026-05-01', text: 'Adopted by Bob' },
      ],
    },
  ]

  const feed = mergeActivityFeed(mockProjects)
  assert.equal(feed.length, 3)
  assert.equal(feed[0].date, '2026-05-01')
  assert.equal(feed[0].projectTitle, 'P2')
  assert.equal(feed[0].type, 'adopt')
  assert.equal(feed[1].date, '2026-04-15')
  assert.equal(feed[1].type, 'fate')
  assert.equal(feed[2].date, '2026-04-12')
  assert.equal(feed[2].type, 'bury')
})
