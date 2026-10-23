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

test('breakdown points add up to the total for all seed projects and random inputs', () => {
  const seeds = [
    { ideaStrength: 92, completeness: 80, monthsDormant: 6, expected: 82 },
    { ideaStrength: 92, completeness: 85, monthsDormant: 7, expected: 86 },
    { ideaStrength: 78, completeness: 55, monthsDormant: 14, expected: 76 },
  ]
  seeds.forEach((s) => {
    const breakdown = scoreBreakdown(s)
    const sum = breakdown.reduce((a, b) => a + b.points, 0)
    assert.equal(sum, s.expected)
    assert.equal(sum, resurrectionScore(s))
  })

  // Test 100 variations to ensure rounding never deviates by 1 point
  for (let idea = 10; idea <= 100; idea += 10) {
    for (let comp = 10; comp <= 100; comp += 15) {
      for (let dorm = 0; dorm <= 20; dorm += 3) {
        const p = { ideaStrength: idea, completeness: comp, monthsDormant: dorm }
        const sum = scoreBreakdown(p).reduce((a, b) => a + b.points, 0)
        assert.equal(sum, resurrectionScore(p))
      }
    }
  }
})

test('breakdown generates required readable calculation strings', () => {
  const shader = { ideaStrength: 92, completeness: 85, monthsDormant: 7 }
  const breakdown = scoreBreakdown(shader)
  assert.equal(breakdown[0].mathText, 'Idea strength 92 × 50% = +46')
  assert.equal(breakdown[1].mathText, 'Completeness 85 × 30% = +26')
  assert.equal(breakdown[2].mathText, 'Dormancy 7 mo × 10 = 70 × 20% = +14')
})
