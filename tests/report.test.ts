import { describe, expect, it } from 'vitest'
import {
  RESPONSE_SCHEMA,
  buildCompactInput,
  buildFallbackReport,
  checkLanguage,
  findMedicationMentions,
  findUnverifiedPercents,
  redactName,
  specialistFlag,
  userPrompt,
  validateReport,
  type Lang,
} from '../supabase/functions/ai-report/report'
import { GOOD_AZ_REPORT, makeRaw } from './fixtures'

describe('buildCompactInput — məlumat minimallaşdırması', () => {
  const input = buildCompactInput(makeRaw())
  const serialized = JSON.stringify(input)

  it('uşağın adını, doğum tarixini və dərmanları göndərmir', () => {
    expect(serialized).not.toContain('Murad')
    expect(serialized).not.toContain('2020-05-10')
    expect(serialized).not.toMatch(/medication/i)
    expect(input.child.age).toBe(6)
  })

  it('adı sərbəst mətndən [uşaq] ilə əvəz edir', () => {
    expect(input.observations.notes.some((n) => n.includes('[uşaq]'))).toBe(true)
    expect(input.latest_doctor_recommendations).toContain('[uşaq]')
  })

  it('yalnız son 7 günün müşahidələrini götürür', () => {
    expect(input.observations.days).toBe(2)
    expect(input.observations.meltdowns).toBe(1)
    expect(serialized).not.toContain('Köhnə qeyd')
  })

  it('sessiyası olmayan bacarıqları çıxarır və rəqəmləri yuvarlaqlaşdırır', () => {
    expect(input.skills.map((s) => s.skill)).toEqual(['hygiene', 'safety', 'emotions'])
    expect(input.skills[0]).toMatchObject({ accuracy: 0.82, accuracy_prev: 0.65, avg_response_s: 6.1 })
  })

  it('kompakt giriş kiçikdir (token qənaəti)', () => {
    expect(userPrompt(input).length).toBeLessThan(2500)
  })

  it('qeydləri 5 ədəd və 300 simvolla məhdudlaşdırır', () => {
    const many = makeRaw({
      observations: Array.from({ length: 7 }, (_, i) => ({
        observed_on: `2026-10-0${i + 3}`,
        mood: 'good',
        sleep: 'ok',
        meltdown: false,
        meltdown_note: null,
        free_text: 'a'.repeat(1000),
      })),
    })
    const out = buildCompactInput(many)
    expect(out.observations.notes).toHaveLength(5)
    expect(out.observations.notes.every((n) => n.length <= 300)).toBe(true)
  })
})

describe('specialistFlag — qərarı kod verir', () => {
  it('20 faiz bənddən çox geriləmədə bayraq qaldırır', () => {
    const f = specialistFlag(buildCompactInput(makeRaw()))
    expect(f.needed).toBe(true)
    expect(f.reasons).toContain('skill_regression')
  })

  it('həftədə ≥3 krizisdə bayraq qaldırır', () => {
    const raw = makeRaw({
      stats: [],
      observations: ['2026-10-09', '2026-10-08', '2026-10-07'].map((d) => ({
        observed_on: d, mood: 'bad', sleep: 'ok', meltdown: true, meltdown_note: null, free_text: null,
      })),
    })
    expect(specialistFlag(buildCompactInput(raw)).reasons).toEqual(['frequent_meltdowns'])
  })

  it('normal vəziyyətdə bayraq yoxdur', () => {
    const raw = makeRaw({
      stats: [{ skill_code: 'hygiene', sessions_7d: 3, accuracy_7d: 0.7, accuracy_prev_7d: 0.6, avg_response_ms_7d: 5000, stuck_rate_7d: 0.1, trend: 'flat' }],
      observations: [],
    })
    expect(specialistFlag(buildCompactInput(raw)).needed).toBe(false)
  })
})

describe('validateReport — guardrail-lar', () => {
  const input = buildCompactInput(makeRaw())

  it('qaydalara uyğun cavabı qəbul edir', () => {
    const r = validateReport(JSON.stringify(GOOD_AZ_REPORT), input, 'az')
    expect(r.problems).toEqual([])
    expect(r.ok).toBe(true)
  })

  it('pozulmuş JSON-u rədd edir', () => {
    expect(validateReport('{not json', input, 'az').problems).toEqual(['invalid_json'])
  })

  it('dərman məsləhətini tutur', () => {
    const bad = { ...GOOD_AZ_REPORT, summary: `${GOOD_AZ_REPORT.summary} Gecələr 3 mg melatonin verin.` }
    const r = validateReport(bad, input, 'az')
    expect(r.ok).toBe(false)
    expect(r.problems).toContain('medication_mention')
  })

  it('uydurulmuş faizi tutur', () => {
    const bad = { ...GOOD_AZ_REPORT, summary: `${GOOD_AZ_REPORT.summary} Ümumi uğur 95% təşkil edir.` }
    const r = validateReport(bad, input, 'az')
    expect(r.problems.some((p) => p.startsWith('unverified_number'))).toBe(true)
  })

  it('rus dilinə keçidi tutur', () => {
    const bad = { ...GOOD_AZ_REPORT, summary: 'На этой неделе ребёнок хорошо справлялся с гигиеной, точность выросла.' }
    expect(validateReport(bad, input, 'az').problems).toContain('language_cyrillic_mixed')
  })

  it('siyahıda olmayan dərsləri silir, amma səhv saymır', () => {
    const r = validateReport({ ...GOOD_AZ_REPORT, next_lessons: ['road-crossing', 'invented-lesson'] }, input, 'az')
    expect(r.ok).toBe(true)
    expect(r.report?.next_lessons).toEqual(['road-crossing'])
  })

  it('naməlum bacarıq kodunu rədd edir', () => {
    const bad = { ...GOOD_AZ_REPORT, strengths: [{ skill: 'Gigiyena', evidence: 'x' }] }
    expect(validateReport(bad, input, 'az').problems).toContain('bad_strength_item')
  })
})

describe('buildFallbackReport — AI-siz ehtiyat hesabat', () => {
  const input = buildCompactInput(makeRaw())

  it.each<Lang>(['az', 'en', 'ru'])('öz guardrail-larımızdan keçir (%s)', (lang) => {
    const report = buildFallbackReport(input, lang)
    const r = validateReport(report, input, lang)
    expect(r.problems).toEqual([])
  })

  it('geriləyən bacarığı diqqət sahəsinə qoyur və mütəxəssis qeydini əlavə edir', () => {
    const report = buildFallbackReport(input, 'az')
    expect(report.attention_areas.map((a) => a.skill)).toContain('safety')
    expect(report.strengths.map((s) => s.skill)).toContain('hygiene')
    expect(report.specialist_note).not.toBe('')
    expect(report.home_activities).toHaveLength(3)
  })

  it('məlumat olmadıqda dürüst xəbər verir', () => {
    const empty = buildCompactInput(makeRaw({ stats: [], observations: [] }))
    const report = buildFallbackReport(empty, 'az')
    expect(report.summary).toContain('dərs keçilməyib')
    expect(validateReport(report, empty, 'az').ok).toBe(true)
  })
})

describe('köməkçi yoxlamalar', () => {
  it('checkLanguage', () => {
    expect(checkLanguage('Bu həftə uşağınız gigiyena dərslərində çox yaxşı nəticə göstərdi və irəliləyiş əldə etdi.', 'az')).toBeNull()
    expect(checkLanguage('This week your child did very well in hygiene lessons and made clear progress overall.', 'az')).toBe('language_not_azerbaijani')
    expect(checkLanguage('На этой неделе ребёнок хорошо справлялся с уроками гигиены.', 'ru')).toBeNull()
  })

  it('findMedicationMentions', () => {
    expect(findMedicationMentions('Gündə bir həb verin')).not.toHaveLength(0)
    expect(findMedicationMentions('Svetofor oyunu oynayın')).toHaveLength(0)
  })

  it('findUnverifiedPercents həm "82%", həm "%82" formatını tanıyır', () => {
    const input = buildCompactInput(makeRaw())
    expect(findUnverifiedPercents('Nəticə 82% və %65 oldu', input)).toEqual([])
    expect(findUnverifiedPercents('Nəticə %99 oldu', input)).toEqual([99])
  })

  it('redactName regex simvollarından qorunur', () => {
    expect(redactName('Ali (A.) gəldi', 'Ali (A.)')).toBe('[uşaq] gəldi')
  })

  it('cavab sxemi 3 ev fəaliyyəti tələb edir', () => {
    expect(RESPONSE_SCHEMA.properties.home_activities.minItems).toBe(3)
  })
})
