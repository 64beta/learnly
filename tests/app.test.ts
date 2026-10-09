import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LESSONS, gradedStepCount } from '../src/content/lessons'
import { computeCompleteness } from '../src/lib/completeness'
import { ageInYears } from '../src/lib/format'
import { dailyAccuracy } from '../src/features/child/dailyAccuracy'
import { correctPrefix } from '../src/features/play/logic'
import { EMPTY_FILTERS, filterTeachers } from '../src/features/teacher/filterTeachers'
import { az } from '../src/i18n/az'
import { en } from '../src/i18n/en'
import { ru } from '../src/i18n/ru'
import type { SessionSummary, TeacherProfile } from '../src/lib/types'

describe('dərs kontenti', () => {
  const seed = readFileSync(join(__dirname, '..', 'supabase', 'seed.sql'), 'utf8')

  it.each(LESSONS.map((l) => [l.slug, l] as const))('%s: step_count DB seed ilə eynidir', (slug, lesson) => {
    const m = seed.match(new RegExp(`\\('${slug}',\\s*'(\\w+)',\\s*'(\\w+)',\\s*\\d+,\\s*\\d+,\\s*\\d+,\\s*'[^']*',\\s*(\\d+)`))
    expect(m, `seed.sql-də ${slug} tapılmadı`).not.toBeNull()
    expect(m![1]).toBe(lesson.skill)
    expect(m![2]).toBe(lesson.kind)
    expect(Number(m![3])).toBe(gradedStepCount(lesson))
  })

  it('hər sualın düzgün cavabı variantlar arasındadır, addım id-ləri unikaldır', () => {
    for (const l of LESSONS) {
      const ids = l.steps.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const s of l.steps) {
        if (s.type === 'choice') expect(s.options.map((o) => o.id)).toContain(s.correct)
        if (s.type === 'order') expect(s.items.length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})

describe('profil doluluğu', () => {
  const base = {
    first_name: 'A',
    birth_date: '2020-01-01',
    gender: null,
    diagnosis_status: 'confirmed' as const,
    support_level: null,
    conditions_reviewed: false,
    health_reviewed: false,
    communication_level: null,
    sensory: {},
    interests: [],
  }

  it('yalnız məcburi sahələrlə 0% olur', () => {
    expect(computeCompleteness(base, 0).percent).toBe(0)
  })

  it('"yoxdur" cavabı da doldurulmuş sayılır (reviewed bayraqları)', () => {
    const c = computeCompleteness({ ...base, conditions_reviewed: true, health_reviewed: true }, 0)
    expect(c.done).toEqual(['conditions', 'health'])
  })

  it('hamısı doludursa 100%', () => {
    const c = computeCompleteness(
      { ...base, gender: 'male', support_level: 2, conditions_reviewed: true, health_reviewed: true, communication_level: 'verbal', sensory: { sound: 'high' }, interests: ['x'] },
      1,
    )
    expect(c.percent).toBe(100)
    expect(c.missing).toEqual([])
  })

  it('şübhə statusunda səviyyə tələb olunmur', () => {
    expect(computeCompleteness({ ...base, diagnosis_status: 'suspected' }, 0).done).toContain('diagnosis')
  })
})

describe('köməkçi funksiyalar', () => {
  it('ageInYears ad günündən əvvəl/sonra', () => {
    expect(ageInYears('2020-10-10', new Date('2026-10-09'))).toBe(5)
    expect(ageInYears('2020-10-09', new Date('2026-10-09'))).toBe(6)
  })

  it('dailyAccuracy gün və bacarıq üzrə orta hesablayır', () => {
    const s = (day: string, skill: 'hygiene' | 'safety', accuracy: number) =>
      ({ completed_at: `${day}T10:00:00Z`, skill_code: skill, accuracy }) as SessionSummary
    const rows = dailyAccuracy([s('2026-10-02', 'hygiene', 0.5), s('2026-10-01', 'hygiene', 1), s('2026-10-02', 'hygiene', 1), s('2026-10-02', 'safety', 0.25)])
    expect(rows).toEqual([
      { day: '2026-10-01', hygiene: 100 },
      { day: '2026-10-02', hygiene: 75, safety: 25 },
    ])
  })

  it('correctPrefix', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }].map((x) => ({ ...x, icon: 'apple' as const, label: '' }))
    expect(correctPrefix([items[0], items[2]], items)).toBe(1)
    expect(correctPrefix(items, items)).toBe(3)
    expect(correctPrefix([], items)).toBe(0)
  })
})

describe('müəllim filtrləri', () => {
  const tp = (o: Partial<TeacherProfile>): TeacherProfile => ({
    id: Math.random().toString(),
    display_name: 'T',
    specializations: ['speech_therapist'],
    experience_years: 5,
    city: 'Bakı',
    district: 'Nəsimi',
    formats: ['online'],
    languages: ['az'],
    price_min: 30,
    price_max: 50,
    age_min: 2,
    age_max: 12,
    bio: null,
    is_verified: false,
    is_listed: true,
    ...o,
  })
  const list = [
    tp({ display_name: 'A' }),
    tp({ display_name: 'B', specializations: ['aba'], city: 'Gəncə', district: null, is_verified: true, price_min: 60 }),
    tp({ display_name: 'C', experience_years: 1, price_min: null, formats: ['home_visit'], languages: ['ru'] }),
  ]
  const names = (f: Partial<typeof EMPTY_FILTERS>) => filterTeachers(list, { ...EMPTY_FILTERS, ...f }).map((t) => t.display_name)

  it('ixtisas, şəhər (rayon da daxil), format, dil', () => {
    expect(names({ specialization: 'aba' })).toEqual(['B'])
    expect(names({ city: 'nəsimi' })).toEqual(['A', 'C'])
    expect(names({ format: 'home_visit' })).toEqual(['C'])
    expect(names({ language: 'ru' })).toEqual(['C'])
  })

  it('təcrübə, qiymət (qiyməti olmayan keçir), təsdiq', () => {
    expect(names({ minExperience: '3' })).toEqual(['A', 'B'])
    expect(names({ maxPrice: '40' })).toEqual(['A', 'C'])
    expect(names({ verifiedOnly: true })).toEqual(['B'])
  })
})

describe('tərcümələr', () => {
  const flatten = (o: object, prefix = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flatten(v as object, `${prefix}${k}.`) : [`${prefix}${k}`]))
  const azKeys = new Set(flatten(az))

  it('EN və RU lüğətlərində eyni açarlar var', () => {
    expect(flatten(en).sort()).toEqual([...azKeys].sort())
    expect(flatten(ru).sort()).toEqual([...azKeys].sort())
  })

  it('koddakı bütün statik t("...") açarları lüğətdə mövcuddur', () => {
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.tsx?$/.test(name)) files.push(p)
      }
    }
    walk(join(__dirname, '..', 'src'))
    const missing: string[] = []
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z]+(?:\.[a-zA-Z_]+)+)'/g)) {
        const key = m[1]
        // obyekt açarları (məs. 'child.tabs') yox, yalnız son dəyərlər
        if (!azKeys.has(key)) missing.push(`${f.split('src')[1]}: ${key}`)
      }
    }
    expect(missing).toEqual([])
  })
})
