import { supabase } from './supabase'
import type { AiReport, Locale } from './types'
import {
  buildCompactInput,
  buildFallbackReport,
  specialistFlag,
  type RawData,
} from '../../supabase/functions/ai-report/report'

/**
 * AI funksiyası əlçatan olmadıqda (deploy edilməyib, şəbəkə xətası) eyni məntiqlə
 * brauzerdə rəqəmlərə əsaslanan hesabat qurur. AI çağırılmır, heç nə yadda saxlanmır.
 */
export async function buildLocalFallbackReport(childId: string, lang: Locale): Promise<AiReport> {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const [child, conditions, stats, observations, opinion, lessons] = await Promise.all([
    supabase.from('children').select('*').eq('id', childId).single(),
    supabase.from('child_conditions').select('condition_code, status').eq('child_id', childId),
    supabase.from('child_skill_stats').select('*').eq('child_id', childId),
    supabase.from('observations').select('observed_on, mood, sleep, meltdown, meltdown_note, free_text').eq('child_id', childId).gte('observed_on', weekAgo),
    supabase.from('medical_opinions').select('recommendations').eq('child_id', childId).order('opinion_date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('lessons').select('slug, skill_code').eq('is_published', true).order('sort'),
  ])
  if (child.error) throw new Error(child.error.message)

  const raw: RawData = {
    child: child.data,
    conditions: conditions.data ?? [],
    stats: stats.data ?? [],
    observations: observations.data ?? [],
    latestRecommendations: opinion.data?.recommendations ?? null,
    lessons: lessons.data ?? [],
    today,
  }
  const input = buildCompactInput(raw)
  return {
    id: `local-${Date.now()}`,
    child_id: childId,
    period_start: input.period.from,
    period_end: input.period.to,
    output: { ...buildFallbackReport(input, lang), specialist_flag: specialistFlag(input) },
    status: 'fallback',
    failure_reason: 'function_unavailable',
    model: null,
    tokens_in: null,
    tokens_out: null,
    created_at: new Date().toISOString(),
  }
}
