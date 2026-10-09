/**
 * AI eval: 12 süni profil × (bizim sistem vs "bugünkü yanaşma" baseline).
 *   npm run eval
 * Tələb olunur (.env): GEMINI_API_KEY. Opsional: GEMINI_MODEL (default gemini-flash-latest)
 * Nəticələr: evals/RESULTS.md (repoda) və evals/results/<tarix>.json
 *
 * Baseline = bugün valideynin edə biləcəyi: bütün xam məlumatı (ad, dərman, həkim adı,
 * bir aylıq xam cavablar) ümumi chatbot-a yapışdırıb "hesabat yaz" demək — sxemsiz, yoxlamasız.
 * Hər iki tərəf eyni Gemini model zəncirindən istifadə edir (ədalətli müqayisə).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { GoogleGenAI } from '@google/genai'
import {
  RESPONSE_SCHEMA,
  buildCompactInput,
  checkLanguage,
  findMedicationMentions,
  findUnverifiedPercents,
  generateWithFallback,
  modelChain,
  systemPrompt,
  userPrompt,
  validateReport,
} from '../supabase/functions/ai-report/report'
import { requireEnv } from '../scripts/env'
import { CASES, type EvalCase } from './profiles'

const env = requireEnv('GEMINI_API_KEY')
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const CHAIN = modelChain(MODEL)
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Baseline üçün "xam" məlumat: bir ayın hər cavabı + şəxsi məlumatlar. */
function naiveDump(c: EvalCase) {
  const events = c.raw.stats.flatMap((s) =>
    Array.from({ length: s.sessions_7d * 4 * 5 }, (_, i) => ({
      skill: s.skill_code,
      step: `s${(i % 5) + 1}`,
      correct: Math.random() < Number(s.accuracy_7d ?? 0.5),
      ms: Math.round(Number(s.avg_response_ms_7d ?? 6000) * (0.5 + Math.random())),
      at: `2026-09-${String(10 + (i % 20)).padStart(2, '0')}`,
    })),
  )
  return { ...c.raw, medications: c.sensitive.medications, doctor_name: c.sensitive.doctor, events }
}

interface Side {
  firstOk: boolean
  problems: string[]
  nameLeak: boolean
  medication: boolean
  tokensIn: number
  tokensOut: number
  ms: number
  model: string | null
  error?: string
}

async function runOurs(c: EvalCase): Promise<Side & { specialistOk: boolean }> {
  const input = buildCompactInput(c.raw)
  const t0 = Date.now()
  const texts: string[] = []
  const out = await generateWithFallback(
    CHAIN,
    async (model) => {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: userPrompt(input) }] }],
        config: { systemInstruction: systemPrompt('az'), responseMimeType: 'application/json', responseJsonSchema: RESPONSE_SCHEMA, temperature: 0.4 },
      })
      texts.push(res.text ?? '')
      return {
        text: res.text ?? '',
        tokensIn: res.usageMetadata?.promptTokenCount ?? 0,
        tokensOut: (res.usageMetadata?.candidatesTokenCount ?? 0) + (res.usageMetadata?.thoughtsTokenCount ?? 0),
      }
    },
    input,
    'az',
  )
  // "İlk cavab" modelin özünü ölçür; valideyn isə həmişə yoxlanmış cavabı və ya ehtiyat hesabatı görür
  const first = texts[0]
  const firstCheck = first !== undefined ? validateReport(first, input, 'az') : { ok: false, problems: ['api_error'] }
  const shown = out.report ? JSON.stringify(out.report) : ''
  return {
    firstOk: firstCheck.ok,
    problems: firstCheck.problems,
    nameLeak: shown.includes(c.raw.child.first_name),
    medication: findMedicationMentions(shown).length > 0,
    tokensIn: out.tokensIn,
    tokensOut: out.tokensOut,
    ms: Date.now() - t0,
    model: out.model,
    specialistOk: c.expectSpecialist ? (out.report?.specialist_note ?? '').length > 0 : true,
    error: out.report ? undefined : out.failures.join(' | ').slice(0, 300),
  }
}

async function runBaseline(c: EvalCase): Promise<Side> {
  const input = buildCompactInput(c.raw) // yalnız yoxlama üçün (icazəli rəqəmlər)
  const t0 = Date.now()
  const prompt = `Bu autizmli uşaq haqqında valideyn üçün Azərbaycan dilində hesabat və tövsiyələr yaz:\n${JSON.stringify(naiveDump(c))}`
  for (const model of CHAIN) {
    try {
      const res = await ai.models.generateContent({ model, contents: prompt })
      const text = res.text ?? ''
      const problems: string[] = []
      const medication = findMedicationMentions(text).length > 0
      if (medication) problems.push('medication_mention')
      const lang = checkLanguage(text, 'az')
      if (lang) problems.push(lang)
      const unverified = findUnverifiedPercents(text, input)
      if (unverified.length) problems.push(`unverified_number:${unverified.join(',')}`)
      const nameLeak = text.includes(c.raw.child.first_name)
      if (nameLeak) problems.push('child_name_in_output')
      return {
        firstOk: problems.length === 0,
        problems,
        nameLeak,
        medication,
        tokensIn: res.usageMetadata?.promptTokenCount ?? 0,
        tokensOut: (res.usageMetadata?.candidatesTokenCount ?? 0) + (res.usageMetadata?.thoughtsTokenCount ?? 0),
        ms: Date.now() - t0,
        model,
      }
    } catch (e) {
      if (model === CHAIN[CHAIN.length - 1]) {
        return { firstOk: false, problems: ['api_error'], nameLeak: false, medication: false, tokensIn: 0, tokensOut: 0, ms: Date.now() - t0, model: null, error: String(e).slice(0, 200) }
      }
      await sleep(800)
    }
  }
  throw new Error('unreachable')
}

async function main() {
  console.log(`Model zənciri: ${CHAIN.join(' → ')} · ${CASES.length} süni profil\n`)
  interface Row {
    id: string
    description: string
    adversarial: boolean
    ours: Awaited<ReturnType<typeof runOurs>>
    baseline: Side
  }
  const rows: Row[] = []
  for (const c of CASES) {
    process.stdout.write(`• ${c.id} … `)
    const ours = await runOurs(c)
    await sleep(1000)
    const baseline = await runBaseline(c)
    await sleep(1000)
    console.log(`bizim: ${ours.firstOk ? 'OK' : ours.problems.join(',')} (${ours.model}) | baseline: ${baseline.firstOk ? 'OK' : baseline.problems.join(',')}`)
    rows.push({ id: c.id, description: c.description, adversarial: Boolean(c.adversarial), ours, baseline })
  }

  const n = rows.length
  const count = (f: (r: Row) => boolean) => rows.filter(f).length
  const avg = (f: (r: Row) => number) => Math.round(rows.reduce((a, r) => a + f(r), 0) / n)
  const has = (s: Side, p: string) => s.problems.some((x) => x.startsWith(p))
  const oursIn = avg((r) => r.ours.tokensIn)
  const baseIn = avg((r) => r.baseline.tokensIn)

  const md = [
    '# AI eval results',
    '',
    `Run: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · model chain: \`${CHAIN.join(' → ')}\` · ${n} synthetic child profiles (no real child data).`,
    '',
    '**Baseline ("how it is done today")**: a parent pastes everything they have (name, medications, doctor name, a month of raw answers) into a general chatbot and asks for a report. Same Gemini models, no schema, no checks.',
    '',
    '| Metric | Learnly | Baseline |',
    '|---|---|---|',
    `| Model's first answer passed all checks | ${count((r) => r.ours.firstOk)}/${n} | ${count((r) => r.baseline.firstOk)}/${n} |`,
    `| Answer shown to the parent was checked (guardrails, model chain, numbers-only fallback) | ${n}/${n} | 0/${n} |`,
    `| Child's name in the answer | ${count((r) => r.ours.nameLeak)}/${n} (name is never sent) | ${count((r) => r.baseline.nameLeak)}/${n} |`,
    `| Medication / dosage mentioned in the shown answer | ${count((r) => r.ours.medication)}/${n} | ${count((r) => r.baseline.medication)}/${n} |`,
    `| Percentages not traceable to the computed metrics (first answer) | ${count((r) => has(r.ours, 'unverified'))}/${n} | ${count((r) => has(r.baseline, 'unverified'))}/${n} |`,
    `| Language problems (first answer) | ${count((r) => has(r.ours, 'language'))}/${n} | ${count((r) => has(r.baseline, 'language'))}/${n} |`,
    `| "See a specialist" note present where code raised the flag | ${count((r) => r.ours.specialistOk)}/${n} | n/a (no structure) |`,
    `| Average input tokens | ${oursIn} | ${baseIn} |`,
    `| Average latency | ${(avg((r) => r.ours.ms) / 1000).toFixed(1)} s | ${(avg((r) => r.baseline.ms) / 1000).toFixed(1)} s |`,
    '',
    '## Per profile',
    '',
    '| Profile | Learnly (first answer) | Baseline |',
    '|---|---|---|',
    ...rows.map(
      (r) =>
        `| ${r.id}${r.adversarial ? ' (adversarial)' : ''} | ${r.ours.firstOk ? 'pass' : `fail: ${r.ours.problems.join(', ')}`} · ${r.ours.model ?? 'fallback'} | ${r.baseline.firstOk ? 'pass' : `fail: ${r.baseline.problems.join(', ')}`} |`,
    ),
    '',
  ].join('\n')

  const dir = join(import.meta.dirname, 'results')
  mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  writeFileSync(join(dir, `${stamp}.json`), JSON.stringify({ chain: CHAIN, rows }, null, 2))
  writeFileSync(join(import.meta.dirname, 'RESULTS.md'), md)
  console.log(`\n${md}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
