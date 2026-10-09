/**
 * Demo məlumatı yaradır (münsiflər və test üçün). Hamısı süni məlumatdır.
 *   npm run seed:demo
 * Tələb olunur (.env): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * Opsional: SUPABASE_SERVICE_ROLE_KEY — varsa, hesablar admin API ilə yaradılır və
 * müəllimlərə "təsdiqlənib" nişanı verilir. Yoxdursa, adi qeydiyyat istifadə olunur
 * (Supabase-də "Confirm email" söndürülmüş olmalıdır).
 * Təkrar işə salmaq təhlükəsizdir (mövcud hesablar və uşaqlar yenidən yaradılmır).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireEnv } from './env'

// Test hesabları — yalnız demo üçün, README-də də göstərilib
export const DEMO_PASSWORD = 'Learnly-Demo-2026'
export const DEMO_PARENT = 'parent.demo@learnly.test'
export const DEMO_TEACHER = 'teacher.demo@learnly.test'

const env = requireEnv('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY')
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const admin = SERVICE_KEY ? createClient(env.VITE_SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } }) : null

interface TeacherSeed {
  email: string
  full_name: string
  verified: boolean
  profile: Record<string, unknown>
}

const TEACHERS: TeacherSeed[] = [
  {
    email: DEMO_TEACHER,
    full_name: 'Leyla Məmmədova',
    verified: true,
    profile: {
      specializations: ['speech_therapist', 'special_educator'], experience_years: 9, city: 'Bakı', district: 'Nəsimi',
      formats: ['in_person', 'online'], languages: ['az', 'ru'], price_min: 30, price_max: 45, age_min: 3, age_max: 10,
      bio: 'Autizm spektrində olan uşaqlarla 9 ildir işləyirəm. Vizual dəstək və alternativ ünsiyyət (PECS) üzrə təcrübəm var.',
    },
  },
  {
    email: 'teacher2.demo@learnly.test',
    full_name: 'Rəşad Əliyev',
    verified: true,
    profile: {
      specializations: ['aba'], experience_years: 6, city: 'Bakı', district: 'Yasamal',
      formats: ['home_visit', 'in_person'], languages: ['az', 'en'], price_min: 40, price_max: 60, age_min: 2, age_max: 8,
      bio: 'Sertifikatlı ABA terapevt. Gündəlik bacarıqlar və davranış planı üzrə ailələrlə birgə işləyirəm.',
    },
  },
  {
    email: 'teacher3.demo@learnly.test',
    full_name: 'Günay Həsənova',
    verified: false,
    profile: {
      specializations: ['psychologist'], experience_years: 4, city: 'Sumqayıt', district: null,
      formats: ['online'], languages: ['az', 'tr'], price_min: 25, price_max: 35, age_min: 4, age_max: 14,
      bio: 'Uşaq psixoloqu. Emosiyaları tanıma və sosial bacarıqlar üzrə qrup və fərdi seanslar.',
    },
  },
  {
    email: 'teacher4.demo@learnly.test',
    full_name: 'Nigar Quliyeva',
    verified: true,
    profile: {
      specializations: ['ot', 'defectologist'], experience_years: 12, city: 'Gəncə', district: null,
      formats: ['in_person'], languages: ['az', 'ru'], price_min: null, price_max: null, age_min: 2, age_max: 12,
      bio: 'Erqoterapevt və defektoloq. Sensor inteqrasiya və incə motorika üzrə ixtisaslaşmışam.',
    },
  },
]

const CHILDREN = [
  {
    row: {
      first_name: 'Aylin', birth_date: '2020-03-14', gender: 'female', diagnosis_status: 'confirmed', support_level: 2,
      diagnosis_date: '2023-02-01', diagnosed_by: 'Uşaq nevroloqu', icd_code: 'F84.0', conditions_reviewed: true, health_reviewed: true,
      allergies: 'Fıstıq', medications: 'Yoxdur', communication_level: 'limited', uses_aac: true,
      sensory: { sound: 'high', light: 'medium', touch: 'low' }, interests: ['heyvanlar', 'rəsm', 'musiqi'], current_therapies: ['speech', 'aba'],
    },
    conditions: [
      { condition_code: 'speech_delay', status: 'confirmed', note: 'Loqopedlə həftədə 2 dəfə' },
      { condition_code: 'sensory_processing', status: 'suspected', note: 'Səs-küyə həssasdır' },
    ],
    opinion: {
      opinion_date: '2026-06-15', doctor_name: 'Dr. (süni nümunə)', specialty: 'neurologist', institution: 'Uşaq klinikası (nümunə)',
      diagnosis_text: 'Autizm spektri pozuntusu, səviyyə 2',
      opinion_text: 'Nitq inkişafında gecikmə, sosial qarşılıqlı əlaqədə çətinlik. Vizual dəstəyə yaxşı reaksiya verir. Səs-küylü mühitdə narahatlıq artır.',
      recommendations: 'Vizual cədvəllərdən istifadə; qısa və təkrarlanan tapşırıqlar; sakit mühit; loqoped seanslarının davam etdirilməsi.',
      next_visit_date: '2026-12-15',
    },
  },
  {
    row: {
      first_name: 'Murad', birth_date: '2018-09-02', gender: 'male', diagnosis_status: 'confirmed', support_level: 1,
      diagnosis_date: '2022-05-10', diagnosed_by: 'Uşaq psixiatrı', icd_code: 'F84.5', conditions_reviewed: true, health_reviewed: true,
      chronic_conditions: null, allergies: null, medications: null, communication_level: 'verbal', uses_aac: false,
      sensory: { sound: 'medium', light: 'high' }, interests: ['maşınlar', 'qatarlar', 'lego'], current_therapies: ['aba', 'sport'],
    },
    conditions: [
      { condition_code: 'adhd', status: 'confirmed', note: 'Diqqəti tez yayınır' },
      { condition_code: 'sleep', status: 'suspected', note: 'Gec yuxuya gedir' },
    ],
    opinion: {
      opinion_date: '2026-04-20', doctor_name: 'Dr. (süni nümunə)', specialty: 'psychiatrist', institution: 'Psixi sağlamlıq mərkəzi (nümunə)',
      diagnosis_text: 'Autizm spektri pozuntusu (səviyyə 1), ADHD',
      opinion_text: 'Nitqi yaşına uyğundur, sosial ünsiyyətdə çətinliklər var. Qısa müddətli tapşırıqlarda daha uğurludur. Parlaq işığa həssasdır.',
      recommendations: 'Tapşırıqları 5–10 dəqiqəlik hissələrə bölmək; fiziki fəallıq; rutinin vizual göstərilməsi.',
      next_visit_date: '2026-10-20',
    },
  },
]

function anon() {
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
}

/** Hesabı tapır və ya yaradır, sonra həmin istifadəçi ilə daxil olmuş client qaytarır. */
async function account(email: string, meta: Record<string, unknown>): Promise<{ id: string; c: SupabaseClient }> {
  const c = anon()
  const first = await c.auth.signInWithPassword({ email, password: DEMO_PASSWORD })
  if (first.data.user) return { id: first.data.user.id, c }

  if (admin) {
    const { error } = await admin.auth.admin.createUser({ email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: meta })
    if (error) throw new Error(`${email}: ${error.message}`)
  } else {
    const { data, error } = await c.auth.signUp({ email, password: DEMO_PASSWORD, options: { data: meta } })
    if (error) throw new Error(`${email} qeydiyyat: ${error.message}`)
    if (!data.session) {
      throw new Error(`${email}: e-poçt təsdiqi tələb olunur. Supabase → Authentication → Sign In / Providers → Email → "Confirm email" seçimini söndürün və yenidən işə salın.`)
    }
    return { id: data.user!.id, c }
  }
  const second = await c.auth.signInWithPassword({ email, password: DEMO_PASSWORD })
  if (second.error || !second.data.user) throw new Error(`${email} giriş: ${second.error?.message}`)
  return { id: second.data.user.id, c }
}

function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`)
  return res.data
}

async function main() {
  console.log(admin ? '🔑 Rejim: admin (service key)' : '🌐 Rejim: adi qeydiyyat (publishable key)')

  console.log('\n👩‍🏫 Müəllimlər…')
  const teacherIds: Record<string, string> = {}
  const teacherClients: Record<string, SupabaseClient> = {}
  for (const tch of TEACHERS) {
    const { id, c } = await account(tch.email, { role: 'teacher', full_name: tch.full_name, city: tch.profile.city })
    teacherIds[tch.email] = id
    teacherClients[tch.email] = c
    must(await c.from('teacher_profiles').update({ display_name: tch.full_name, ...tch.profile, is_listed: true }).eq('id', id), `${tch.full_name} profil`)
    if (admin) must(await admin.from('teacher_profiles').update({ is_verified: tch.verified }).eq('id', id), 'is_verified')
    console.log(`   ✓ ${tch.full_name}`)
  }

  console.log('\n👨‍👩‍👧 Demo valideyn…')
  const parent = await account(DEMO_PARENT, { role: 'parent', full_name: 'Demo Valideyn', city: 'Bakı', parent_relation: 'mother', phone: '+994 50 000 00 00' })
  const childIds: Record<string, string> = {}
  for (const ch of CHILDREN) {
    const existing = must(await parent.c.from('children').select('id').eq('first_name', ch.row.first_name).maybeSingle(), 'uşaq axtarışı') as { id: string } | null
    let id = existing?.id
    if (!id) {
      const created = must(await parent.c.from('children').insert({ parent_id: parent.id, ...ch.row }).select('id').single(), `${ch.row.first_name}`) as { id: string }
      id = created.id
      must(await parent.c.from('child_conditions').insert(ch.conditions.map((x) => ({ child_id: id, ...x }))), 'vəziyyətlər')
      must(await parent.c.from('medical_opinions').insert({ child_id: id, ...ch.opinion }), 'həkim rəyi')
      console.log(`   ✓ ${ch.row.first_name} (süni profil)`)
    } else {
      console.log(`   • ${ch.row.first_name} artıq mövcuddur`)
    }
    childIds[ch.row.first_name] = id
    const { count } = await parent.c.from('activity_sessions').select('id', { count: 'exact', head: true }).eq('child_id', id)
    if (!count) {
      const n = must(await parent.c.rpc('seed_demo_history', { p_child: id, p_days: 14 }), 'demo tarixçə')
      console.log(`   ✓ ${ch.row.first_name}: ${n} demo dərs (14 gün) + müşahidələr`)
    }
  }
  must(await parent.c.rpc('set_child_pin', { p_pin: '1234' }), 'PIN')

  console.log('\n🤝 Müəllim istəkləri…')
  const { data: reqs } = await parent.c.from('teacher_requests').select('id, child_id, teacher_id, status')
  const has = (child: string, teacher: string) =>
    (reqs ?? []).some((r) => r.child_id === childIds[child] && r.teacher_id === teacherIds[teacher] && ['pending', 'accepted'].includes(r.status))

  if (!has('Aylin', DEMO_TEACHER)) {
    must(
      await parent.c.rpc('send_request', {
        p_child: childIds.Aylin,
        p_teacher: teacherIds[DEMO_TEACHER],
        p_message: 'Salam! Aylin üçün həftədə 2 dəfə loqoped seansı axtarırıq. Səs-küyə həssasdır, sakit mühit vacibdir.',
        p_consent: true,
      }),
      'istək (Aylin → Leyla)',
    )
    console.log('   ✓ Aylin → Leyla Məmmədova (gözləyir)')
  }
  const aba = 'teacher2.demo@learnly.test'
  if (!has('Murad', aba)) {
    const r = must(
      await parent.c.rpc('send_request', {
        p_child: childIds.Murad,
        p_teacher: teacherIds[aba],
        p_message: 'Murad üçün ev şəraitində ABA terapiyası istəyirik.',
        p_consent: true,
      }),
      'istək (Murad → Rəşad)',
    ) as { id: string }
    must(await teacherClients[aba].rpc('respond_to_request', { p_request: r.id, p_accept: true }), 'qəbul')
    console.log('   ✓ Murad → Rəşad Əliyev (qəbul olunub)')
  }

  console.log('\n✅ Hazırdır. Hesablar: README.md → "Demo accounts"')
  if (!admin) {
    console.log('\nℹ️  "Təsdiqlənib" nişanı yalnız admin verə bilər. İstəsəniz, Supabase SQL Editor-də işə salın:')
    console.log(`   update public.teacher_profiles set is_verified = true where display_name in (${TEACHERS.filter((t) => t.verified).map((t) => `'${t.full_name}'`).join(', ')});`)
  }
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e)
  process.exit(1)
})
