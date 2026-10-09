import type { RawData } from '../supabase/functions/ai-report/report'

/** Test və eval üçün süni (uydurma) uşaq məlumatı. Real şəxsə aid deyil. */
export function makeRaw(overrides: Partial<RawData> = {}): RawData {
  return {
    child: {
      first_name: 'Murad',
      birth_date: '2020-05-10',
      diagnosis_status: 'confirmed',
      support_level: 2,
      communication_level: 'limited',
      uses_aac: true,
      sensory: { sound: 'high', light: 'medium' },
      interests: ['maşınlar', 'qatarlar'],
    },
    conditions: [
      { condition_code: 'adhd', status: 'confirmed' },
      { condition_code: 'speech_delay', status: 'suspected' },
    ],
    stats: [
      { skill_code: 'hygiene', sessions_7d: 5, accuracy_7d: '0.82', accuracy_prev_7d: '0.65', avg_response_ms_7d: 6100, stuck_rate_7d: '0.10', trend: 'up' },
      { skill_code: 'safety', sessions_7d: 4, accuracy_7d: '0.55', accuracy_prev_7d: '0.80', avg_response_ms_7d: 7400, stuck_rate_7d: '0.25', trend: 'down' },
      { skill_code: 'emotions', sessions_7d: 3, accuracy_7d: '0.50', accuracy_prev_7d: '0.52', avg_response_ms_7d: 17800, stuck_rate_7d: '0.45', trend: 'flat' },
      { skill_code: 'cognitive', sessions_7d: 0, accuracy_7d: null, accuracy_prev_7d: '0.70', avg_response_ms_7d: null, stuck_rate_7d: null, trend: 'flat' },
    ],
    observations: [
      { observed_on: '2026-10-09', mood: 'good', sleep: 'ok', meltdown: false, meltdown_note: null, free_text: 'Murad bu gün əllərini özü yudu.' },
      { observed_on: '2026-10-08', mood: 'bad', sleep: 'bad', meltdown: true, meltdown_note: 'Mağazada səs-küydən krizis oldu.', free_text: null },
      { observed_on: '2026-10-01', mood: 'good', sleep: 'good', meltdown: false, meltdown_note: null, free_text: 'Köhnə qeyd (dövrdən kənar).' },
    ],
    latestRecommendations: 'Vizual cədvəl istifadə edin. Murad üçün sakit mühit yaradın.',
    lessons: [
      { slug: 'hand-washing', skill_code: 'hygiene' },
      { slug: 'road-crossing', skill_code: 'safety' },
      { slug: 'emotions', skill_code: 'emotions' },
      { slug: 'daily-routine', skill_code: 'cognitive' },
      { slug: 'odd-one-out', skill_code: 'cognitive' },
    ],
    today: '2026-10-09',
    ...overrides,
  }
}

/** Qaydalara uyğun, düzgün Azərbaycan dilində nümunə model cavabı. */
export const GOOD_AZ_REPORT = {
  summary:
    'Bu həftə gigiyena bacarığında nəzərəçarpan irəliləyiş var: düzgünlük 65%-dən 82%-ə qalxıb. Təhlükəsizlik dərslərində isə nəticə 80%-dən 55%-ə düşüb, buna diqqət yetirmək lazımdır.',
  strengths: [{ skill: 'hygiene', evidence: 'Düzgünlük 82%, əvvəlki həftə 65% idi.' }],
  attention_areas: [
    { skill: 'safety', evidence: 'Düzgünlük 55%-ə enib.', why_it_matters: 'Yolu təhlükəsiz keçmək gündəlik həyat üçün vacibdir.' },
    { skill: 'emotions', evidence: 'Addımların 45%-də ilişmə olub.', why_it_matters: 'Hissləri tanımaq ünsiyyəti asanlaşdırır.' },
  ],
  home_activities: [
    { title: 'Svetofor oyunu', steps: ['Qırmızı və yaşıl kartla oynayın.', 'Gəzintidə svetofora baxın.'], duration_min: 10, related_skill: 'safety' },
    { title: 'Hisslər güzgüsü', steps: ['Güzgü qarşısında üz ifadələri edin.'], duration_min: 5, related_skill: 'emotions' },
    { title: 'Maşınlarla ardıcıllıq', steps: ['Oyuncaq maşınlarla gündəlik addımları düzün.'], duration_min: 10, related_skill: 'cognitive' },
  ],
  next_lessons: ['road-crossing', 'emotions'],
  specialist_note: 'Təhlükəsizlik bacarığındakı dəyişikliyi mütəxəssisinizlə müzakirə etməyiniz faydalı olar.',
}
