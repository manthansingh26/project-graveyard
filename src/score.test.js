import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dormancyScore, resurrectionScore, scoreBreakdown } from './score.js'

// The 3 seed projects must reproduce the scores printed in the Round 1 deck.
test('seed scores match the Round 1 PPT', () => {
  assert.equal(resurrectionScore({ ideaStrength: 92, completeness: 80, monthsDormant: 6 }), 82) // PulseNote
  assert.equal(resurrectionScore({ ideaStrength: 92, completeness: 85, monthsDormant: 7 }), 86) // ShaderCanvas Studio
  assert.equal(resurrectionScore({ ideaStrength: 78, completeness: 55, monthsDormant: 14 }), 76) // DevPulse CLI
})

test('dormancy bonus is capped and never negative', () => {
  assert.equal(dormancyScore(0), 0)
  assert.equal(dormancyScore(10), 100)
  assert.equal(dormancyScore(99), 100)
  assert.equal(dormancyScore(-5), 0)
})

test('score stays inside 0-100 at the extremes', () => {
  assert.equal(resurrectionScore({ ideaStrength: 0, completeness: 0, monthsDormant: 0 }), 0)
  assert.equal(resurrectionScore({ ideaStrength: 100, completeness: 100, monthsDormant: 30 }), 100)
})

test('breakdown points add up to the total', () => {
  const p = { ideaStrength: 92, completeness: 80, monthsDormant: 6 }
  const sum = scoreBreakdown(p).reduce((a, b) => a + b.points, 0)
  assert.equal(sum, resurrectionScore(p))
})
