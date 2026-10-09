// Supabase Edge Function: ai-report
// Valideynin uşağı üçün AI rəyi hazırlayır.
// Axın: JWT yoxlanılır → uşağın sahibi yoxlanılır → hazır metriklər oxunur →
// kompakt JSON → Gemini → guardrail yoxlaması → (uğursuz olarsa) AI-siz ehtiyat hesabat → ai_reports.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   GEMINI_API_KEY      (məcburi)
//   GEMINI_MODEL        (opsional, default: gemini-flash-latest)
//   MAX_REPORTS_PER_DAY (opsional, default: 20)

import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenAI } from 'npm:@google/genai@2'
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
} from './report.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** SUPABASE_*_KEYS mühit dəyişənləri JSON obyektidir ({"default": "sb_..."}); ilk dəyəri götürür. */
function firstKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  try {
    const v = Object.values(JSON.parse(raw) as Record<string, unknown>)[0]
    return typeof v === 'string' ? v : undefined
  } catch {
    return raw.startsWith('sb_') ? raw : undefined
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    // Köhnə (anon/service_role) və yeni (sb_publishable/sb_secret) açarların hər ikisi dəstəklənir
    const ANON_KEY =
      Deno.env.get('SUPABASE_ANON_KEY') || firstKey(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')) || req.headers.get('apikey') || ''
    const SERVICE_KEY =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || firstKey(Deno.env.get('SUPABASE_SECRET_KEYS')) || Deno.env.get('SB_SECRET_KEY') || ''
    if (!ANON_KEY || !SERVICE_KEY) return json({ error: 'server_keys_missing' }, 500)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-flash-latest'
    const MAX_PER_DAY = Number(Deno.env.get('MAX_REPORTS_PER_DAY') || 20)

    // İstifadəçinin öz JWT-si ilə müştəri: bütün oxumalar RLS-dən keçir
    const authHeader = req.headers.get('Authorization') ?? ''
    const db = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: userData } = await db.auth.getUser()
    const user = userData.user
    if (!user) return json({ error: 'unauthorized' }, 401)

    const body = (await req.json().catch(() => ({}))) as { child_id?: string }
    const childId = body.child_id
    if (!childId) return json({ error: 'child_id_required' }, 400)

    const { data: child } = await db.from('children').select('*').eq('id', childId).maybeSingle()
    // Rəyi yalnız valideyn yarada bilər (müəllim yalnız oxuyur)
    if (!child || child.parent_id !== user.id) return json({ error: 'forbidden' }, 403)

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)
    const since = new Date(Date.now() - 86400000).toISOString()
    const { count } = await admin.from('ai_reports').select('id', { count: 'exact', head: true }).eq('child_id', childId).gte('created_at', since)
    if ((count ?? 0) >= MAX_PER_DAY) return json({ error: 'daily_limit_reached' }, 429)

    await db.rpc('refresh_child_stats', { p_child: childId })

    const today = new Date().toISOString().slice(0, 10)
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
    const [profile, conditions, stats, observations, opinion, lessons] = await Promise.all([
      db.from('profiles').select('locale').eq('id', user.id).maybeSingle(),
      db.from('child_conditions').select('condition_code, status').eq('child_id', childId),
      db.from('child_skill_stats').select('*').eq('child_id', childId),
      db.from('observations').select('observed_on, mood, sleep, meltdown, meltdown_note, free_text').eq('child_id', childId).gte('observed_on', weekAgo).order('observed_on', { ascending: false }),
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
    if (!GEMINI_API_KEY) {
      failure = 'gemini_api_key_missing'
    } else {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
      const fallbacks = (Deno.env.get('GEMINI_FALLBACK_MODELS') || 'gemini-flash-lite-latest,gemini-2.5-flash').split(',').map((m) => m.trim())
      outcome = await generateWithFallback(
        modelChain(MODEL, fallbacks),
        async (model) => {
          const res = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: userPrompt(input) }] }],
            config: {
              systemInstruction: systemPrompt(lang),
              responseMimeType: 'application/json',
              responseJsonSchema: RESPONSE_SCHEMA,
              temperature: 0.4,
            },
          })
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
    if (error) throw error

    return json(saved)
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'internal_error' }, 500)
  }
})
