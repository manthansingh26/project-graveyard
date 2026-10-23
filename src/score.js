// Resurrection Score — pure logic, unit-tested in score.test.js.
// Formula (also shown in the Autopsy UI and the README):
//   Score = 50% Idea Strength + 30% Completeness + 20% Dormancy Bonus
//   Dormancy Bonus = 10 points per month away, capped at 100 (10+ months).
// Rationale: a strong idea that is mostly built deserves revival; distance
// gives the builder fresh eyes, so dormancy adds a bounded bonus instead of
// only punishing the project for being old.

export function dormancyScore(months) {
  const m = Number.isFinite(months) ? months : 0
  return Math.min(Math.max(m, 0) * 10, 100)
}

export function resurrectionScore(p) {
  return Math.round(p.ideaStrength * 0.5 + p.completeness * 0.3 + dormancyScore(p.monthsDormant) * 0.2)
}

export function scoreBreakdown(p) {
  return [
    { label: 'Idea strength', raw: p.ideaStrength, weight: '50%', points: Math.round(p.ideaStrength * 0.5) },
    { label: 'Completeness', raw: p.completeness, weight: '30%', points: Math.round(p.completeness * 0.3) },
    { label: 'Dormancy bonus', raw: dormancyScore(p.monthsDormant), weight: '20%', points: Math.round(dormancyScore(p.monthsDormant) * 0.2) },
  ]
}
