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
  const total = resurrectionScore(p)
  const ideaPts = Math.round(p.ideaStrength * 0.5)
  const compPts = Math.round(p.completeness * 0.3)
  const dormPts = total - ideaPts - compPts
  const dScore = dormancyScore(p.monthsDormant)
  const months = Number.isFinite(p.monthsDormant) ? Math.max(0, p.monthsDormant) : 0

  return [
    {
      label: 'Idea strength',
      detail: `${p.ideaStrength} × 50%`,
      mathText: `Idea strength ${p.ideaStrength} × 50% = +${ideaPts}`,
      points: ideaPts,
      raw: p.ideaStrength,
    },
    {
      label: 'Completeness',
      detail: `${p.completeness} × 30%`,
      mathText: `Completeness ${p.completeness} × 30% = +${compPts}`,
      points: compPts,
      raw: p.completeness,
    },
    {
      label: 'Dormancy bonus',
      detail: `${months} mo × 10 = ${dScore} × 20%`,
      mathText: `Dormancy ${months} mo × 10 = ${dScore} × 20% = +${dormPts}`,
      points: dormPts,
      raw: dScore,
    },
  ]
}
