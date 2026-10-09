/**
 * Məxfilik (RLS) və metriklərin real baza üzərində avtomatik yoxlanması.
 *   npm run test:rls
 * 3 müvəqqəti test istifadəçisi yaradır, yoxlayır və sonda silir.
 * Tələb olunur (.env): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireEnv } from './env'

const env = requireEnv('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY')
const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const PASSWORD = `Rls-${Math.random().toString(36).slice(2)}-Aa1`
const created: string[] = []
const results: { name: string; pass: boolean; detail?: string }[] = []

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail })
  console.log(`${pass ? '✅' : '❌'} ${name}${detail && !pass ? `  → ${detail}` : ''}`)
}

async function user(role: 'parent' | 'teacher', label: string): Promise<{ id: string; c: SupabaseClient }> {
  const email = `rls-${label}-${Date.now()}@learnly.test`
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { role, full_name: `RLS ${label}` },
  })
  if (error || !data.user) throw new Error(error?.message)
  created.push(data.user.id)
  const c = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { error: e2 } = await c.auth.signInWithPassword({ email, password: PASSWORD })
  if (e2) throw new Error(e2.message)
  return { id: data.user.id, c }
}

async function visibleChildren(c: SupabaseClient, childId: string) {
  const { data } = await c.from('children').select('id').eq('id', childId)
  return data?.length ?? 0
}

async function main() {
  const A = await user('parent', 'a')
  const B = await user('parent', 'b')
  const T = await user('teacher', 't')

  // --- Rollar ---
  const esc = await A.c.from('profiles').update({ role: 'teacher' }).eq('id', A.id)
  check('Valideyn öz rolunu dəyişə bilmir', Boolean(esc.error), esc.error?.message)

  const adminMeta = await admin.auth.admin.createUser({
    email: `rls-admin-${Date.now()}@learnly.test`, password: PASSWORD, email_confirm: true, user_metadata: { role: 'admin' },
  })
  if (adminMeta.data.user) {
    created.push(adminMeta.data.user.id)
    const { data: p } = await admin.from('profiles').select('role').eq('id', adminMeta.data.user.id).single()
    check('Qeydiyyatda "admin" rolu qəbul olunmur (parent olur)', p?.role === 'parent', p?.role)
  }

  const tChild = await T.c.from('children').insert({ parent_id: T.id, first_name: 'X', birth_date: '2020-01-01', diagnosis_status: 'confirmed' })
  check('Müəllim uşaq profili yarada bilmir', Boolean(tChild.error))

  const verify = await T.c.from('teacher_profiles').update({ is_verified: true }).eq('id', T.id)
  check('Müəllim özünə "təsdiqlənib" nişanı verə bilmir', Boolean(verify.error), verify.error?.message)

  // --- Uşaq və tibbi məlumat ---
  const { data: child, error: ce } = await A.c
    .from('children')
    .insert({ parent_id: A.id, first_name: 'Test', birth_date: '2020-01-01', diagnosis_status: 'confirmed', medications: 'nümunə' })
    .select('id')
    .single()
  if (ce || !child) throw new Error(`uşaq yaradılmadı: ${ce?.message}`)
  const childId = child.id as string
  await A.c.from('medical_opinions').insert({ child_id: childId, opinion_date: '2026-01-01', opinion_text: 'Süni rəy' })

  check('Başqa valideyn uşağı görmür', (await visibleChildren(B.c, childId)) === 0)
  const bUpd = await B.c.from('children').update({ first_name: 'Hacked' }).eq('id', childId).select('id')
  check('Başqa valideyn uşağı dəyişə bilmir', (bUpd.data?.length ?? 0) === 0)
  check('Müəllim istəkdən əvvəl uşağı görmür', (await visibleChildren(T.c, childId)) === 0)
  const tOp = await T.c.from('medical_opinions').select('id').eq('child_id', childId)
  check('Müəllim istəkdən əvvəl həkim rəyini görmür', (tOp.data?.length ?? 0) === 0)

  // --- Metriklər ---
  const { data: sess } = await A.c.from('activity_sessions').insert({ child_id: childId, lesson_slug: 'hand-washing' }).select('id').single()
  const sid = sess!.id as string
  const ev = (step_id: string, attempt_no: number, is_correct: boolean, response_ms: number, hint_used = false) => ({
    session_id: sid, step_id, attempt_no, is_correct, response_ms, hint_used,
  })
  await A.c.from('answer_events').insert([
    ev('q1', 1, true, 3000), // ilk cəhddə düzgün
    ev('q2', 1, false, 4000), ev('q2', 2, false, 4000), ev('q2', 3, true, 4000), // 3 cəhd → ilişmə, həll edilib
    ev('q3', 1, true, 5000, true), // ipucu ilə → ilk cəhd sayılmır
    ev('q4', 1, false, 9000), ev('q4', 2, false, 9000), ev('q4', 3, false, 9000), // həll edilməyib, ilişmə
  ])
  const bEv = await B.c.from('answer_events').insert(ev('q9', 1, true, 1000))
  check('Başqa valideyn yad sessiyaya cavab yaza bilmir', Boolean(bEv.error))

  const { data: sum, error: se } = await A.c.rpc('complete_session', { p_session_id: sid })
  check('complete_session işləyir', !se && Boolean(sum), se?.message)
  if (sum) {
    check('accuracy = 1/4 (yalnız ilk cəhddə, ipucusuz)', Number(sum.accuracy) === 0.25, String(sum.accuracy))
    check('solved_rate = 3/4', Number(sum.solved_rate) === 0.75, String(sum.solved_rate))
    check('stuck_count = 2 (≥3 cəhd və ya >20 san.)', sum.stuck_count === 2, String(sum.stuck_count))
    check('hints_used = 1', sum.hints_used === 1, String(sum.hints_used))
  }
  const late = await A.c.from('answer_events').insert(ev('q5', 1, true, 1000))
  check('Bitmiş sessiyaya cavab əlavə etmək olmur', Boolean(late.error))
  const fake = await A.c.from('session_summaries').insert({
    session_id: sid, child_id: childId, lesson_slug: 'hand-washing', skill_code: 'hygiene', step_count: 4,
    accuracy: 1, solved_rate: 1, avg_response_ms: 1, stuck_count: 0, hints_used: 0, duration_s: 1,
  })
  check('Client nəticəni saxtalaşdıra bilmir (session_summaries)', Boolean(fake.error))

  // --- İstək axını ---
  const direct = await T.c.from('teacher_requests').insert({ parent_id: A.id, child_id: childId, teacher_id: T.id, consent_given: true })
  check('İstəyi birbaşa insert etmək olmur', Boolean(direct.error))
  const noConsent = await A.c.rpc('send_request', { p_child: childId, p_teacher: T.id, p_message: '', p_consent: false })
  check('Razılıq olmadan istək göndərilmir', noConsent.error?.message.includes('consent_required') ?? false, noConsent.error?.message)
  const foreign = await B.c.rpc('send_request', { p_child: childId, p_teacher: T.id, p_message: '', p_consent: true })
  check('Başqasının uşağı üçün istək göndərmək olmur', Boolean(foreign.error))

  const r1 = await A.c.rpc('send_request', { p_child: childId, p_teacher: T.id, p_message: 'Salam', p_consent: true })
  check('Razılıqla istək göndərilir', !r1.error, r1.error?.message)
  check('Müəllim pending istəkdə uşağı görür', (await visibleChildren(T.c, childId)) === 1)
  const tOp2 = await T.c.from('medical_opinions').select('id').eq('child_id', childId)
  check('Müəllim pending istəkdə həkim rəyini görür', (tOp2.data?.length ?? 0) === 1)
  const tEv = await T.c.from('answer_events').select('id').eq('session_id', sid)
  check('Müəllim xam cavabları görmür', (tEv.data?.length ?? 0) === 0)
  const tSum = await T.c.from('session_summaries').select('session_id').eq('child_id', childId)
  check('Müəllim xülasə statistikasını görür', (tSum.data?.length ?? 0) === 1)
  const tUpd = await T.c.from('children').update({ first_name: 'Changed' }).eq('id', childId).select('id')
  check('Müəllim uşaq profilini dəyişə bilmir', (tUpd.data?.length ?? 0) === 0)
  const dup = await A.c.rpc('send_request', { p_child: childId, p_teacher: T.id, p_message: '', p_consent: true })
  check('Eyni müəllimə ikinci aktiv istək olmur', Boolean(dup.error))

  const rej = await T.c.rpc('respond_to_request', { p_request: r1.data.id, p_accept: false })
  check('Müəllim rədd edə bilir', !rej.error, rej.error?.message)
  check('Rəddən sonra giriş avtomatik bağlanır', (await visibleChildren(T.c, childId)) === 0)

  const r2 = await A.c.rpc('send_request', { p_child: childId, p_teacher: T.id, p_message: '', p_consent: true })
  await T.c.rpc('respond_to_request', { p_request: r2.data?.id, p_accept: true })
  check('Qəbuldan sonra müəllim uşağı görür', (await visibleChildren(T.c, childId)) === 1)
  const { data: parentRow } = await T.c.from('profiles').select('id').eq('id', A.id)
  check('Qəbul olunmuş müəllim valideynin əlaqə məlumatını görür', (parentRow?.length ?? 0) === 1)
  const { data: bRow } = await T.c.from('profiles').select('id').eq('id', B.id)
  check('Müəllim əlaqəsi olmayan valideyni görmür', (bRow?.length ?? 0) === 0)
  const end = await A.c.rpc('cancel_request', { p_request: r2.data?.id })
  check('Valideyn əməkdaşlığı bitirə bilir', end.data?.status === 'ended', end.error?.message)
  check('Bitirdikdən sonra giriş avtomatik bağlanır', (await visibleChildren(T.c, childId)) === 0)

  // --- PIN ---
  await A.c.rpc('set_child_pin', { p_pin: '4321' })
  const ok = await A.c.rpc('verify_child_pin', { p_pin: '4321' })
  const bad = await A.c.rpc('verify_child_pin', { p_pin: '0000' })
  check('PIN yoxlaması', ok.data === true && bad.data === false)
  const pinRead = await A.c.from('parent_settings').select('*')
  check('PIN hash-i birbaşa oxunmur', Boolean(pinRead.error) || (pinRead.data?.length ?? 0) === 0)
}

main()
  .catch((e) => check('Skript xətasız işlədi', false, e instanceof Error ? e.message : String(e)))
  .finally(async () => {
    for (const id of created) await admin.auth.admin.deleteUser(id)
    const failed = results.filter((r) => !r.pass)
    console.log(`\n${results.length - failed.length}/${results.length} yoxlama keçdi`)
    process.exit(failed.length ? 1 : 0)
  })
