export type Role = 'parent' | 'teacher'
export type Locale = 'az' | 'en' | 'ru'
export type ParentRelation = 'mother' | 'father' | 'guardian' | 'relative' | 'consultant'

export interface Profile {
  id: string
  role: Role
  full_name: string
  phone: string | null
  city: string | null
  locale: Locale
  parent_relation: ParentRelation | null
  created_at: string
}

export type DiagnosisStatus = 'confirmed' | 'suspected' | 'in_evaluation'
export type CommunicationLevel = 'verbal' | 'limited' | 'nonverbal'
export type SensoryLevel = 'high' | 'medium' | 'low'
export type SensoryKey = 'sound' | 'light' | 'touch'

export const CONDITION_CODES = [
  'adhd', 'intellectual_disability', 'speech_delay', 'epilepsy', 'anxiety', 'sleep', 'gastro',
  'feeding', 'sensory_processing', 'dyspraxia', 'ocd', 'tic', 'hearing_vision', 'genetic', 'other',
] as const
export type ConditionCode = (typeof CONDITION_CODES)[number]

export interface ChildCondition {
  id?: string
  child_id?: string
  condition_code: ConditionCode
  status: 'confirmed' | 'suspected'
  note: string | null
}

export interface MedicalOpinion {
  id: string
  child_id: string
  opinion_date: string
  doctor_name: string | null
  specialty: string | null
  institution: string | null
  diagnosis_text: string | null
  opinion_text: string
  recommendations: string | null
  next_visit_date: string | null
  created_at: string
}

export interface Child {
  id: string
  parent_id: string
  first_name: string
  birth_date: string
  gender: 'male' | 'female' | null
  diagnosis_status: DiagnosisStatus
  support_level: 1 | 2 | 3 | null
  diagnosis_date: string | null
  diagnosed_by: string | null
  icd_code: string | null
  conditions_reviewed: boolean
  chronic_conditions: string | null
  allergies: string | null
  medications: string | null
  health_reviewed: boolean
  communication_level: CommunicationLevel | null
  uses_aac: boolean | null
  sensory: Partial<Record<SensoryKey, SensoryLevel>>
  interests: string[]
  current_therapies: string[]
  created_at: string
  updated_at: string
}

export interface ChildWithRelations extends Child {
  child_conditions: ChildCondition[]
  medical_opinions: MedicalOpinion[]
}

export interface Observation {
  id: string
  child_id: string
  observed_on: string
  mood: 'good' | 'neutral' | 'bad' | null
  sleep: 'good' | 'ok' | 'bad' | null
  meltdown: boolean
  meltdown_note: string | null
  free_text: string | null
  is_demo: boolean
  created_at: string
}

export type SkillCode = 'hygiene' | 'safety' | 'emotions' | 'cognitive'
export const SKILL_CODES: SkillCode[] = ['hygiene', 'safety', 'emotions', 'cognitive']

export interface LessonRow {
  slug: string
  skill_code: SkillCode
  kind: 'lesson' | 'game'
  level: number
  step_count: number
  sort: number
}

export interface SessionSummary {
  session_id: string
  child_id: string
  lesson_slug: string
  skill_code: SkillCode
  step_count: number
  accuracy: number
  solved_rate: number
  avg_response_ms: number
  stuck_count: number
  hints_used: number
  duration_s: number
  completed_at: string
}

export interface SkillStats {
  child_id: string
  skill_code: SkillCode
  sessions_7d: number
  accuracy_7d: number | null
  accuracy_prev_7d: number | null
  avg_response_ms_7d: number | null
  stuck_rate_7d: number | null
  trend: 'up' | 'down' | 'flat'
  total_sessions: number
  last_activity_at: string | null
}

export interface ReportOutput {
  summary: string
  strengths: { skill: string; evidence: string }[]
  attention_areas: { skill: string; evidence: string; why_it_matters: string }[]
  home_activities: { title: string; steps: string[]; duration_min: number; related_skill: string }[]
  next_lessons: string[]
  specialist_note?: string
  specialist_flag?: { needed: boolean; reasons: string[] }
}

export interface AiReport {
  id: string
  child_id: string
  period_start: string
  period_end: string
  output: ReportOutput
  status: 'ok' | 'fallback'
  failure_reason: string | null
  model: string | null
  tokens_in: number | null
  tokens_out: number | null
  created_at: string
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'ended'

export interface TeacherProfile {
  id: string
  display_name: string
  specializations: string[]
  experience_years: number
  city: string | null
  district: string | null
  formats: string[]
  languages: string[]
  price_min: number | null
  price_max: number | null
  age_min: number
  age_max: number
  bio: string | null
  is_verified: boolean
  is_listed: boolean
}

export interface TeacherRequest {
  id: string
  parent_id: string
  child_id: string
  teacher_id: string
  status: RequestStatus
  message: string | null
  consent_given: boolean
  consent_at: string
  created_at: string
  responded_at: string | null
}
