import type { Child } from './types'

export type CompletenessItem = 'basics' | 'diagnosis' | 'conditions' | 'opinions' | 'health' | 'daily'

/** Hər bölmə wizard-ın bir addımına uyğun gəlir (redaktə linkləri üçün). */
export const ITEM_STEP: Record<CompletenessItem, number> = {
  basics: 1,
  diagnosis: 2,
  conditions: 3,
  opinions: 4,
  health: 5,
  daily: 6,
}

export interface Completeness {
  percent: number
  done: CompletenessItem[]
  missing: CompletenessItem[]
}

type ChildLike = Pick<
  Child,
  | 'first_name' | 'birth_date' | 'gender' | 'diagnosis_status' | 'support_level'
  | 'conditions_reviewed' | 'health_reviewed' | 'communication_level' | 'sensory' | 'interests'
>

/**
 * Profilin doluluq faizi. "Yoxdur" cavabı da doldurulmuş sayılır:
 * buna görə əlavə vəziyyətlər və sağlamlıq üçün *_reviewed bayraqları istifadə olunur.
 */
export function computeCompleteness(child: ChildLike, opinionCount: number): Completeness {
  const checks: Record<CompletenessItem, boolean> = {
    basics: Boolean(child.first_name?.trim() && child.birth_date && child.gender),
    diagnosis: Boolean(child.diagnosis_status && (child.support_level || child.diagnosis_status !== 'confirmed')),
    conditions: child.conditions_reviewed,
    opinions: opinionCount > 0,
    health: child.health_reviewed,
    daily: Boolean(
      child.communication_level &&
        Object.keys(child.sensory ?? {}).length > 0 &&
        (child.interests?.length ?? 0) > 0,
    ),
  }
  const items = Object.keys(checks) as CompletenessItem[]
  const done = items.filter((k) => checks[k])
  const missing = items.filter((k) => !checks[k])
  return { percent: Math.round((done.length / items.length) * 100), done, missing }
}
