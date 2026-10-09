import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { TeacherProfile } from '../../lib/types'
import { Avatar, Badge, Card, buttonClass } from '../../components/ui'
import { BadgeCheck } from 'lucide-react'

export const SPECIALIZATIONS = ['speech_therapist', 'defectologist', 'aba', 'psychologist', 'ot', 'special_educator'] as const
export const FORMATS = ['online', 'in_person', 'home_visit'] as const
export const LANGUAGES = ['az', 'ru', 'en', 'tr'] as const

export function usePriceText() {
  const { t } = useTranslation()
  return (tp: Pick<TeacherProfile, 'price_min' | 'price_max'>) => {
    if (tp.price_min && tp.price_max) return t('market.price', { min: Number(tp.price_min), max: Number(tp.price_max) })
    if (tp.price_min) return t('market.priceFrom', { min: Number(tp.price_min) })
    return t('market.priceOnRequest')
  }
}

export function TeacherCard({ teacher }: { teacher: TeacherProfile }) {
  const { t } = useTranslation()
  const priceText = usePriceText()
  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-3">
        <Avatar name={teacher.display_name || '?'} />
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 font-extrabold text-ink-900">
            <span className="truncate">{teacher.display_name || '—'}</span>
            {teacher.is_verified && <Badge tone="mint"><BadgeCheck size={12} /> {t('market.verified')}</Badge>}
          </h3>
          <p className="text-sm text-ink-500">
            {[teacher.city, teacher.district].filter(Boolean).join(', ') || '—'} · {t('market.experience', { years: teacher.experience_years })}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {teacher.specializations.map((s) => (
          <Badge key={s} tone="brand">
            {t(`teacherFields.specializations.${s}`, { defaultValue: s })}
          </Badge>
        ))}
      </div>
      <div className="mt-3 space-y-1 text-sm text-ink-600">
        <div>
          {teacher.formats.map((f) => t(`teacherFields.formats.${f}`, { defaultValue: f })).join(' · ') || '—'}
        </div>
        <div>{teacher.languages.map((l) => t(`teacherFields.languages.${l}`, { defaultValue: l })).join(', ')}</div>
        <div className="font-bold text-ink-800">{priceText(teacher)}</div>
      </div>
      <div className="mt-auto pt-4">
        <Link to={`/app/teachers/${teacher.id}`} className={buttonClass('secondary', 'md', 'w-full')}>
          {t('market.details')}
        </Link>
      </div>
    </Card>
  )
}
