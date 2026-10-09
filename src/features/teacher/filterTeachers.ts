import type { TeacherProfile } from '../../lib/types'

export interface TeacherFilters {
  specialization: string
  city: string
  format: string
  language: string
  minExperience: string
  maxPrice: string
  verifiedOnly: boolean
}

export const EMPTY_FILTERS: TeacherFilters = {
  specialization: '',
  city: '',
  format: '',
  language: '',
  minExperience: '',
  maxPrice: '',
  verifiedOnly: false,
}

/** Marketplace filtrləri. Saf funksiya — tests/filterTeachers.test.ts yoxlayır. */
export function filterTeachers(teachers: TeacherProfile[], f: TeacherFilters): TeacherProfile[] {
  const city = f.city.trim().toLocaleLowerCase('az')
  const minExp = Number(f.minExperience) || 0
  const maxPrice = Number(f.maxPrice) || 0
  return teachers.filter((tp) => {
    if (f.specialization && !tp.specializations.includes(f.specialization)) return false
    if (f.format && !tp.formats.includes(f.format)) return false
    if (f.language && !tp.languages.includes(f.language)) return false
    if (city && !`${tp.city ?? ''} ${tp.district ?? ''}`.toLocaleLowerCase('az').includes(city)) return false
    if (minExp && tp.experience_years < minExp) return false
    // Qiyməti göstərilməyən müəllimlər qiymət filtrindən keçir ("razılaşma ilə")
    if (maxPrice && tp.price_min !== null && Number(tp.price_min) > maxPrice) return false
    if (f.verifiedOnly && !tp.is_verified) return false
    return true
  })
}
