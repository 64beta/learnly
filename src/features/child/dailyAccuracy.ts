import type { SessionSummary, SkillCode } from '../../lib/types'

export type Row = { day: string } & Partial<Record<SkillCode, number>>

/** Hər gün və bacarıq üzrə orta düzgünlük (%). Saf funksiya — test olunur. */
export function dailyAccuracy(summaries: SessionSummary[]): Row[] {
  const buckets = new Map<string, Map<SkillCode, number[]>>()
  for (const s of summaries) {
    const day = s.completed_at.slice(0, 10)
    const perSkill = buckets.get(day) ?? new Map<SkillCode, number[]>()
    const list = perSkill.get(s.skill_code) ?? []
    list.push(Number(s.accuracy))
    perSkill.set(s.skill_code, list)
    buckets.set(day, perSkill)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, perSkill]) => {
      const row: Row = { day }
      for (const [skill, values] of perSkill) {
        row[skill] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100)
      }
      return row
    })
}
