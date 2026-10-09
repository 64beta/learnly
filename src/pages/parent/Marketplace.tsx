import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listTeachers } from '../../lib/api'
import { EMPTY_FILTERS, filterTeachers, type TeacherFilters } from '../../features/teacher/filterTeachers'
import { FORMATS, LANGUAGES, SPECIALIZATIONS, TeacherCard } from '../../features/teacher/TeacherCard'
import { Alert, Button, Card, Checkbox, EmptyState, Field, Input, PageHeader, PageSpinner, Select } from '../../components/ui'
import { SearchX } from 'lucide-react'

export default function Marketplace() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery({ queryKey: ['teachers'], queryFn: listTeachers })
  const [f, setF] = useState<TeacherFilters>(EMPTY_FILTERS)
  const results = useMemo(() => filterTeachers(data ?? [], f), [data, f])
  const set = <K extends keyof TeacherFilters>(k: K, v: TeacherFilters[K]) => setF((x) => ({ ...x, [k]: v }))

  return (
    <div>
      <PageHeader title={t('market.title')} subtitle={t('market.subtitle')} />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit space-y-4 lg:sticky lg:top-24">
          <Field label={t('market.specialization')}>
            <Select value={f.specialization} onChange={(e) => set('specialization', e.target.value)}>
              <option value="">{t('common.all')}</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {t(`teacherFields.specializations.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('market.city')}>
            <Input value={f.city} onChange={(e) => set('city', e.target.value)} placeholder="Bakı" />
          </Field>
          <Field label={t('market.format')}>
            <Select value={f.format} onChange={(e) => set('format', e.target.value)}>
              <option value="">{t('common.all')}</option>
              {FORMATS.map((s) => (
                <option key={s} value={s}>
                  {t(`teacherFields.formats.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('market.language')}>
            <Select value={f.language} onChange={(e) => set('language', e.target.value)}>
              <option value="">{t('common.all')}</option>
              {LANGUAGES.map((s) => (
                <option key={s} value={s}>
                  {t(`teacherFields.languages.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('market.minExperience')}>
              <Input type="number" min={0} value={f.minExperience} onChange={(e) => set('minExperience', e.target.value)} />
            </Field>
            <Field label={t('market.maxPrice')}>
              <Input type="number" min={0} value={f.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
            </Field>
          </div>
          <Checkbox label={t('market.verifiedOnly')} checked={f.verifiedOnly} onChange={(v) => set('verifiedOnly', v)} />
          <Button variant="ghost" size="sm" onClick={() => setF(EMPTY_FILTERS)}>
            {t('common.reset')}
          </Button>
        </Card>

        <div>
          {isLoading ? (
            <PageSpinner />
          ) : error ? (
            <Alert tone="berry">{(error as Error).message}</Alert>
          ) : (
            <>
              <p className="mb-3 text-sm font-bold text-ink-500">{t('market.results', { count: results.length })}</p>
              {results.length === 0 ? (
                <EmptyState icon={<SearchX size={28} />} title={t('market.empty')} />
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {results.map((tp) => (
                    <TeacherCard key={tp.id} teacher={tp} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
