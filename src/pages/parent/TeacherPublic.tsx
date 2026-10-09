import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getTeacherProfile, listChildren, sendRequest } from '../../lib/api'
import { useErrorText } from '../../lib/useErrorText'
import { usePriceText } from '../../features/teacher/TeacherCard'
import { Alert, Avatar, Badge, Button, Card, Checkbox, Field, InfoRow, PageSpinner, Select, Textarea, buttonClass } from '../../components/ui'
import { ArrowLeft, BadgeCheck, Plus, ShieldCheck } from 'lucide-react'

export default function TeacherPublic() {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const priceText = usePriceText()
  const { teacherId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const teacher = useQuery({ queryKey: ['teacher', teacherId], queryFn: () => getTeacherProfile(teacherId!), enabled: Boolean(teacherId) })
  const children = useQuery({ queryKey: ['children'], queryFn: listChildren })

  const [childId, setChildId] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (teacher.isLoading) return <PageSpinner />
  const tp = teacher.data
  if (!tp) return <Alert tone="berry">{t('market.notFound')}</Alert>

  const selectedChild = childId || children.data?.[0]?.id || ''

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!consent) return setError(t('errors.consent_required'))
    setBusy(true)
    setError(null)
    try {
      await sendRequest(selectedChild, tp.id, message.trim(), consent)
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
      navigate('/app/requests')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Link to="/app/teachers" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
        <ArrowLeft size={16} /> {t('market.title')}
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Avatar name={tp.display_name || '?'} size="lg" />
            <div>
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-ink-900">
                {tp.display_name || '—'}
                {tp.is_verified && <Badge tone="mint"><BadgeCheck size={12} /> {t('market.verified')}</Badge>}
              </h1>
              <p className="text-ink-500">{[tp.city, tp.district].filter(Boolean).join(', ')}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tp.specializations.map((s) => (
                  <Badge key={s} tone="brand">
                    {t(`teacherFields.specializations.${s}`, { defaultValue: s })}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <dl className="mt-6 divide-y divide-ink-100">
            <InfoRow label={t('teacher.experience')} value={t('market.experience', { years: tp.experience_years })} />
            <InfoRow label={t('teacher.formats')} value={tp.formats.map((f) => t(`teacherFields.formats.${f}`, { defaultValue: f })).join(', ') || '—'} />
            <InfoRow label={t('teacher.languages')} value={tp.languages.map((l) => t(`teacherFields.languages.${l}`, { defaultValue: l })).join(', ')} />
            <InfoRow label={t('market.priceLabel')} value={priceText(tp)} />
            <InfoRow label={t('market.agesLabel')} value={t('market.ages', { min: tp.age_min, max: tp.age_max })} />
          </dl>
          {tp.bio && (
            <div className="mt-6">
              <h2 className="mb-2 font-extrabold text-ink-900">{t('market.about')}</h2>
              <p className="whitespace-pre-line text-ink-700">{tp.bio}</p>
            </div>
          )}
        </Card>

        <Card className="h-fit p-6">
          <h2 className="mb-4 text-lg font-extrabold text-ink-900">{t('market.requestTitle')}</h2>
          {children.data && children.data.length === 0 ? (
            <div className="space-y-3">
              <Alert tone="peach">{t('market.noChildren')}</Alert>
              <Link to="/app/children/new" className={buttonClass('primary', 'md', 'w-full')}>
                <Plus size={16} /> {t('parent.addChild')}
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label={t('market.selectChild')}>
                <Select value={selectedChild} onChange={(e) => setChildId(e.target.value)}>
                  {children.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('market.message')}>
                <Textarea rows={3} maxLength={1000} value={message} placeholder={t('market.messagePlaceholder')} onChange={(e) => setMessage(e.target.value)} />
              </Field>
              <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-950 ring-1 ring-brand-200">
                <p className="flex items-center gap-1.5 font-bold"><ShieldCheck size={16} /> {t('market.sharedTitle')}</p>
                <p className="mt-1">{t('market.sharedItems')}</p>
                <p className="mt-2 text-xs text-brand-800">{t('market.revokeNote')}</p>
              </div>
              <Checkbox label={<span className="font-bold">{t('market.consent')}</span>} checked={consent} onChange={setConsent} />
              {error && <Alert tone="berry">{error}</Alert>}
              <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!consent || !selectedChild}>
                {t('market.send')}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
