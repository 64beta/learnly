import { supabase } from './supabase'
import type {
  AiReport,
  Child,
  ChildCondition,
  ChildWithRelations,
  LessonRow,
  Locale,
  MedicalOpinion,
  Observation,
  Profile,
  SessionSummary,
  SkillStats,
  TeacherProfile,
  TeacherRequest,
} from './types'

/** Supabase xətalarını atır ki, react-query onları tutsun. */
function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

// ---------- Uşaq ----------
const CHILD_SELECT = '*, child_conditions(*), medical_opinions(*)'

export async function listChildren(): Promise<ChildWithRelations[]> {
  const { data: auth } = await supabase.auth.getUser()
  const rows = check(
    await supabase.from('children').select(CHILD_SELECT).eq('parent_id', auth.user?.id ?? '').order('created_at'),
  )
  return (rows ?? []) as unknown as ChildWithRelations[]
}

export async function getChild(id: string): Promise<ChildWithRelations | null> {
  const row = check(await supabase.from('children').select(CHILD_SELECT).eq('id', id).maybeSingle())
  if (!row) return null
  const child = row as unknown as ChildWithRelations
  child.medical_opinions = [...(child.medical_opinions ?? [])].sort((a, b) => b.opinion_date.localeCompare(a.opinion_date))
  return child
}

export type ChildInput = Partial<Omit<Child, 'id' | 'parent_id' | 'created_at' | 'updated_at'>>

export async function createChild(input: ChildInput): Promise<Child> {
  return check(await supabase.from('children').insert(input).select('*').single()) as Child
}

export async function updateChild(id: string, input: ChildInput): Promise<Child> {
  return check(await supabase.from('children').update(input).eq('id', id).select('*').single()) as Child
}

export async function deleteChild(id: string) {
  check(await supabase.from('children').delete().eq('id', id))
}

export async function replaceConditions(childId: string, conditions: ChildCondition[]) {
  check(await supabase.from('child_conditions').delete().eq('child_id', childId))
  if (conditions.length) {
    check(
      await supabase.from('child_conditions').insert(
        conditions.map((c) => ({ child_id: childId, condition_code: c.condition_code, status: c.status, note: c.note || null })),
      ),
    )
  }
  check(await supabase.from('children').update({ conditions_reviewed: true }).eq('id', childId))
}

export type OpinionInput = Omit<MedicalOpinion, 'id' | 'created_at'>

export async function addOpinion(input: OpinionInput): Promise<MedicalOpinion> {
  return check(await supabase.from('medical_opinions').insert(input).select('*').single()) as MedicalOpinion
}

export async function deleteOpinion(id: string) {
  check(await supabase.from('medical_opinions').delete().eq('id', id))
}

// ---------- Müşahidələr ----------
export async function listObservations(childId: string, limit = 60): Promise<Observation[]> {
  return (check(
    await supabase.from('observations').select('*').eq('child_id', childId).order('observed_on', { ascending: false }).limit(limit),
  ) ?? []) as Observation[]
}

export type ObservationInput = Omit<Observation, 'id' | 'created_at' | 'is_demo'>

export async function upsertObservation(input: ObservationInput) {
  check(await supabase.from('observations').upsert(input, { onConflict: 'child_id,observed_on' }))
}

// ---------- Dərslər və izləmə ----------
export async function listLessonRows(): Promise<LessonRow[]> {
  return (check(await supabase.from('lessons').select('slug, skill_code, kind, level, step_count, sort').order('sort')) ?? []) as LessonRow[]
}

export async function startSession(childId: string, lessonSlug: string): Promise<string> {
  const row = check(
    await supabase.from('activity_sessions').insert({ child_id: childId, lesson_slug: lessonSlug }).select('id').single(),
  ) as { id: string }
  return row.id
}

export interface AnswerEventInput {
  session_id: string
  step_id: string
  attempt_no: number
  is_correct: boolean
  response_ms: number
  hint_used: boolean
}

export async function logAnswer(event: AnswerEventInput) {
  check(await supabase.from('answer_events').insert(event))
}

export async function completeSession(sessionId: string): Promise<SessionSummary | null> {
  return check(await supabase.rpc('complete_session', { p_session_id: sessionId })) as SessionSummary | null
}

export async function refreshChildStats(childId: string) {
  check(await supabase.rpc('refresh_child_stats', { p_child: childId }))
}

export async function getSkillStats(childId: string): Promise<SkillStats[]> {
  return (check(await supabase.from('child_skill_stats').select('*').eq('child_id', childId)) ?? []) as SkillStats[]
}

export async function listSummaries(childId: string, days = 14): Promise<SessionSummary[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  return (check(
    await supabase
      .from('session_summaries')
      .select('*')
      .eq('child_id', childId)
      .gte('completed_at', since)
      .order('completed_at', { ascending: false }),
  ) ?? []) as SessionSummary[]
}

export async function seedDemoHistory(childId: string): Promise<number> {
  return check(await supabase.rpc('seed_demo_history', { p_child: childId, p_days: 14 })) as number
}

export async function clearDemoHistory(childId: string) {
  check(await supabase.rpc('clear_demo_history', { p_child: childId }))
}

// ---------- AI ----------
export async function listReports(childId: string): Promise<AiReport[]> {
  return (check(
    await supabase.from('ai_reports').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(10),
  ) ?? []) as AiReport[]
}

export async function generateReport(childId: string): Promise<AiReport> {
  const { data: auth } = await supabase.auth.getSession()
  const token = auth.session?.access_token
  if (!token) throw new Error('forbidden')
  let res: Response
  try {
    // Saytın öz server funksiyası (Vercel /api və ya lokal Vite dev server)
    res = await fetch('/api/ai-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ child_id: childId }),
    })
  } catch {
    throw new Error('function_unavailable')
  }
  // Server funksiyası yoxdursa (məs. statik hostinq) — çağıran tərəf ehtiyat hesabata keçir
  if ([404, 405, 502, 503, 504].includes(res.status)) throw new Error('function_unavailable')
  const body = (await res.json().catch(() => null)) as (AiReport & { error?: string }) | null
  if (!res.ok || !body) throw new Error(body?.error ?? `HTTP ${res.status}`)
  return body
}

// ---------- PIN ----------
export async function hasChildPin(): Promise<boolean> {
  return Boolean(check(await supabase.rpc('has_child_pin')))
}

export async function setChildPin(pin: string) {
  check(await supabase.rpc('set_child_pin', { p_pin: pin }))
}

export async function verifyChildPin(pin: string): Promise<boolean> {
  return Boolean(check(await supabase.rpc('verify_child_pin', { p_pin: pin })))
}

// ---------- Profil ----------
export async function updateMyProfile(id: string, input: Partial<Pick<Profile, 'full_name' | 'phone' | 'city' | 'locale' | 'parent_relation'>>) {
  check(await supabase.from('profiles').update(input).eq('id', id))
}

export async function updateLocale(id: string, locale: Locale) {
  await updateMyProfile(id, { locale })
}

// ---------- Müəllimlər ----------
export async function listTeachers(): Promise<TeacherProfile[]> {
  return (check(
    await supabase.from('teacher_profiles').select('*').eq('is_listed', true).order('is_verified', { ascending: false }).order('experience_years', { ascending: false }),
  ) ?? []) as TeacherProfile[]
}

export async function getTeacherProfile(id: string): Promise<TeacherProfile | null> {
  return check(await supabase.from('teacher_profiles').select('*').eq('id', id).maybeSingle()) as TeacherProfile | null
}

export type TeacherProfileInput = Omit<TeacherProfile, 'id' | 'is_verified'>

export async function updateTeacherProfile(id: string, input: TeacherProfileInput) {
  check(await supabase.from('teacher_profiles').update(input).eq('id', id))
}

export async function sendRequest(childId: string, teacherId: string, message: string, consent: boolean) {
  return check(
    await supabase.rpc('send_request', { p_child: childId, p_teacher: teacherId, p_message: message, p_consent: consent }),
  ) as TeacherRequest
}

export async function cancelRequest(id: string) {
  return check(await supabase.rpc('cancel_request', { p_request: id })) as TeacherRequest
}

export async function respondToRequest(id: string, accept: boolean) {
  return check(await supabase.rpc('respond_to_request', { p_request: id, p_accept: accept })) as TeacherRequest
}

export interface ParentRequestRow extends TeacherRequest {
  children: { first_name: string } | null
  teacher: (Pick<TeacherProfile, 'display_name' | 'specializations' | 'city'> & { profile: { phone: string | null } | null }) | null
}

export async function listParentRequests(childId?: string): Promise<ParentRequestRow[]> {
  let q = supabase
    .from('teacher_requests')
    .select('*, children(first_name), teacher:teacher_profiles(display_name, specializations, city, profile:profiles(phone))')
    .order('created_at', { ascending: false })
  if (childId) q = q.eq('child_id', childId)
  else {
    const { data: auth } = await supabase.auth.getUser()
    q = q.eq('parent_id', auth.user?.id ?? '')
  }
  return (check(await q) ?? []) as unknown as ParentRequestRow[]
}

export interface TeacherRequestRow extends TeacherRequest {
  children: Pick<Child, 'first_name' | 'birth_date' | 'diagnosis_status' | 'support_level'> | null
  parent: Pick<Profile, 'full_name' | 'phone' | 'city' | 'parent_relation'> | null
}

const TEACHER_REQUEST_SELECT =
  '*, children(first_name, birth_date, diagnosis_status, support_level), parent:profiles!teacher_requests_parent_id_fkey(full_name, phone, city, parent_relation)'

export async function listTeacherRequests(): Promise<TeacherRequestRow[]> {
  const { data: auth } = await supabase.auth.getUser()
  return (check(
    await supabase.from('teacher_requests').select(TEACHER_REQUEST_SELECT).eq('teacher_id', auth.user?.id ?? '').order('created_at', { ascending: false }),
  ) ?? []) as unknown as TeacherRequestRow[]
}

export async function getTeacherRequest(id: string): Promise<TeacherRequestRow | null> {
  return check(await supabase.from('teacher_requests').select(TEACHER_REQUEST_SELECT).eq('id', id).maybeSingle()) as unknown as TeacherRequestRow | null
}
