// AI rəyi — server tərəfi (Vercel Function /api/ai-report və lokal Vite dev server).
// Gemini açarı və service key yalnız serverdə oxunur, brauzerə heç vaxt düşmür.
// Axın: JWT yoxlanılır → uşağın sahibi yoxlanılır → hazır metriklər oxunur →
// kompakt JSON → Gemini → guardrail yoxlaması → (uğursuz olarsa) AI-siz ehtiyat hesabat → ai_reports.

import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import {
  RESPONSE_SCHEMA,
  buildCompactInput,
  buildFallbackReport,
  generateWithFallback,
  modelChain,
  specialistFlag,
  systemPrompt,
  userPrompt,
  type Lang,
  type RawData,
} from '../supabase/functions/ai-report/report.js'

export interface AiEnv {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  GEMINI_API_KEY: string
  GEMINI_MODEL: string
  GEMINI_FALLBACK_MODELS: string[]
  MAX_REPORTS_PER_DAY: number
}

export function envFrom(src: Record<string, string | undefined>): AiEnv {
  return {
    SUPABASE_URL: src.SUPABASE_URL || src.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: src.SUPABASE_ANON_KEY || src.VITE_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: src.SUPABASE_SERVICE_ROLE_KEY || '',
    GEMINI_API_KEY: src.GEMINI_API_KEY || '',
    GEMINI_MODEL: src.GEMINI_MODEL || 'gemini-flash-latest',
    GEMINI_FALLBACK_MODELS: (src.GEMINI_FALLBACK_MODELS || 'gemini-flash-lite-latest,gemini-2.5-flash').split(',').map((m) => m.trim()).filter(Boolean),
    MAX_REPORTS_PER_DAY: Number(src.MAX_REPORTS_PER_DAY || 20),
  }
}

type Result = { status: number; json: unknown }

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${ms} ms`)), ms)
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    )
  })
}
const fail = (status: number, error: string): Result => ({ status, json: { error } })

export async function handleAiReport(authHeader: string | null | undefined, body: unknown, env: AiEnv): Promise<Result> {
  // Hansı açarın çatmadığını adı ilə qaytarır (dəyərlər heç vaxt qaytarılmır)
  const missing = (['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const).filter((k) => !env[k])
  if (missing.length) return fail(500, `server_keys_missing: ${missing.join(', ')}`)
  if (!authHeader?.startsWith('Bearer ')) return fail(401, 'unauthorized')

  // İstifadəçinin öz JWT-si ilə client: bütün oxumalar RLS-dən keçir
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData } = await db.auth.getUser(authHeader.slice(7))
  const user = userData.user
  if (!user) return fail(401, 'unauthorized')

  const childId = (body as { child_id?: string } | null)?.child_id
  if (!childId) return fail(400, 'child_id_required')

  const { data: child } = await db.from('children').select('*').eq('id', childId).maybeSingle()
  // Rəyi yalnız valideyn yarada bilər (müəllim yalnız oxuyur)
  if (!child || child.parent_id !== user.id) return fail(403, 'forbidden')

  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const since = new Date(Date.now() - 86400000).toISOString()
  const { count } = await admin.from('ai_reports').select('id', { count: 'exact', head: true }).eq('child_id', childId).gte('created_at', since)
  if ((count ?? 0) >= env.MAX_REPORTS_PER_DAY) return fail(429, 'daily_limit_reached')

  await db.rpc('refresh_child_stats', { p_child: childId })

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const [profile, conditions, stats, observations, opinion, lessons] = await Promise.all([
    db.from('profiles').select('locale').eq('id', user.id).maybeSingle(),
    db.from('child_conditions').select('condition_code, status').eq('child_id', childId),
    db.from('child_skill_stats').select('*').eq('child_id', childId),
    db.from('observations').select('observed_on, mood, sleep, meltdown, meltdown_note, free_text').eq('child_id', childId).gte('observed_on', weekAgo),
    db.from('medical_opinions').select('recommendations').eq('child_id', childId).order('opinion_date', { ascending: false }).limit(1).maybeSingle(),
    db.from('lessons').select('slug, skill_code').eq('is_published', true).order('sort'),
  ])

  const loc = profile.data?.locale
  const lang: Lang = loc === 'en' || loc === 'ru' ? loc : 'az'
  const raw: RawData = {
    child,
    conditions: conditions.data ?? [],
    stats: stats.data ?? [],
    observations: observations.data ?? [],
    latestRecommendations: opinion.data?.recommendations ?? null,
    lessons: lessons.data ?? [],
    today,
  }
  const input = buildCompactInput(raw)
  const flag = specialistFlag(input)

  let failure: string | null = null
  let outcome: Awaited<ReturnType<typeof generateWithFallback>> | null = null
  if (!env.GEMINI_API_KEY) {
    failure = 'gemini_api_key_missing'
  } else {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
    // Zaman büdcəsi: hər çağırış ≤20 s, ümumi ≤40 s — sonra ehtiyat hesabat (504 olmasın)
    const deadline = Date.now() + 40_000
    outcome = await generateWithFallback(
      modelChain(env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODELS),
      async (model) => {
        const left = deadline - Date.now()
        if (left < 4_000) throw new Error('time_budget_exceeded')
        const res = await withTimeout(ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: userPrompt(input) }] }],
          config: {
            systemInstruction: systemPrompt(lang),
            responseMimeType: 'application/json',
            responseJsonSchema: RESPONSE_SCHEMA,
            temperature: 0.4,
          },
        }), Math.min(20_000, left))
        return {
          text: res.text ?? '',
          tokensIn: res.usageMetadata?.promptTokenCount ?? 0,
          tokensOut: (res.usageMetadata?.candidatesTokenCount ?? 0) + (res.usageMetadata?.thoughtsTokenCount ?? 0),
        }
      },
      input,
      lang,
    )
    if (outcome.failures.length) failure = outcome.failures.join(' | ').slice(0, 1000)
  }

  const output = outcome?.report ?? buildFallbackReport(input, lang)
  const status: 'ok' | 'fallback' = outcome?.report ? 'ok' : 'fallback'

  const { data: saved, error } = await admin
    .from('ai_reports')
    .insert({
      child_id: childId,
      period_start: input.period.from,
      period_end: input.period.to,
      input_snapshot: input,
      output: { ...output, specialist_flag: flag },
      status,
      failure_reason: failure,
      model: outcome?.model ?? null,
      tokens_in: outcome?.tokensIn || null,
      tokens_out: outcome?.tokensOut || null,
    })
    .select('*')
    .single()
  if (error) return fail(500, error.message)
  return { status: 200, json: saved }
}
