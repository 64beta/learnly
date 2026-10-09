import { useEffect, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { getTeacherProfile, updateTeacherProfile, type TeacherProfileInput } from '../../lib/api'
import { useErrorText } from '../../lib/useErrorText'
import { FORMATS, LANGUAGES, SPECIALIZATIONS } from '../../features/teacher/TeacherCard'
import { Alert, Badge, Button, Card, Checkbox, Chips, Field, Input, PageHeader, PageSpinner, Textarea } from '../../components/ui'
import { BadgeCheck, Check } from 'lucide-react'

const toNum = (s: string) => (s.trim() === '' ? null : Number(s))

export default function TeacherProfileEdit() {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const me = useQuery({ queryKey: ['teacher', profile?.id], queryFn: () => getTeacherProfile(profile!.id), enabled: Boolean(profile) })

  const [form, setForm] = useState({
    display_name: '',
    specializations: [] as string[],
    experience_years: '0',
    city: '',
    district: '',
    formats: [] as string[],
    languages: ['az'] as string[],
    price_min: '',
    price_max: '',
    age_min: '2',
    age_max: '18',
    bio: '',
    is_listed: true,
  })
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const d = me.data
    if (!d || loaded) return
    setForm({
      display_name: d.display_name,
      specializations: d.specializations,
      experience_years: String(d.experience_years),
      city: d.city ?? '',
      district: d.district ?? '',
      formats: d.formats,
      languages: d.languages,
      price_min: d.price_min === null ? '' : String(d.price_min),
      price_max: d.price_max === null ? '' : String(d.price_max),
      age_min: String(d.age_min),
      age_max: String(d.age_max),
      bio: d.bio ?? '',
      is_listed: d.is_listed,
    })
    setLoaded(true)
  }, [me.data, loaded])

  if (me.isLoading || !profile) return <PageSpinner />
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setSaved(false)
    setForm((f) => ({ ...f, [k]: v }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const input: TeacherProfileInput = {
      display_name: form.display_name.trim(),
      specializations: form.specializations,
      experience_years: Math.max(0, Math.min(60, Number(form.experience_years) || 0)),
      city: form.city.trim() || null,
      district: form.district.trim() || null,
      formats: form.formats,
      languages: form.languages,
      price_min: toNum(form.price_min),
      price_max: toNum(form.price_max),
      age_min: Number(form.age_min) || 2,
      age_max: Number(form.age_max) || 18,
      bio: form.bio.trim() || null,
      is_listed: form.is_listed,
    }
    try {
      await updateTeacherProfile(profile.id, input)
      setSaved(true)
      void queryClient.invalidateQueries({ queryKey: ['teacher', profile.id] })
      void queryClient.invalidateQueries({ queryKey: ['teachers'] })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t('teacher.profileTitle')}
        actions={me.data?.is_verified ? <Badge tone="mint"><BadgeCheck size={12} /> {t('market.verified')}</Badge> : undefined}
      />
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label={t('teacher.displayName')} required>
            <Input required value={form.display_name} onChange={(e) => set('display_name', e.target.value)} />
          </Field>
          <Field label={t('teacher.specializations')}>
            <Chips
              multi
              options={SPECIALIZATIONS.map((s) => ({ value: s, label: t(`teacherFields.specializations.${s}`) }))}
              value={form.specializations}
              onChange={(v) => set('specializations', v)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('teacher.experience')}>
              <Input type="number" min={0} max={60} value={form.experience_years} onChange={(e) => set('experience_years', e.target.value)} />
            </Field>
            <Field label={t('auth.city')}>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </Field>
            <Field label={t('teacher.district')}>
              <Input value={form.district} onChange={(e) => set('district', e.target.value)} />
            </Field>
          </div>
          <Field label={t('teacher.formats')}>
            <Chips multi options={FORMATS.map((s) => ({ value: s, label: t(`teacherFields.formats.${s}`) }))} value={form.formats} onChange={(v) => set('formats', v)} />
          </Field>
          <Field label={t('teacher.languages')}>
            <Chips multi options={LANGUAGES.map((s) => ({ value: s, label: t(`teacherFields.languages.${s}`) }))} value={form.languages} onChange={(v) => set('languages', v)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label={t('teacher.priceMin')}>
              <Input type="number" min={0} value={form.price_min} onChange={(e) => set('price_min', e.target.value)} />
            </Field>
            <Field label={t('teacher.priceMax')}>
              <Input type="number" min={0} value={form.price_max} onChange={(e) => set('price_max', e.target.value)} />
            </Field>
            <Field label={t('teacher.ageMin')}>
              <Input type="number" min={0} max={30} value={form.age_min} onChange={(e) => set('age_min', e.target.value)} />
            </Field>
            <Field label={t('teacher.ageMax')}>
              <Input type="number" min={0} max={30} value={form.age_max} onChange={(e) => set('age_max', e.target.value)} />
            </Field>
          </div>
          <Field label={t('teacher.bio')}>
            <Textarea rows={5} value={form.bio} placeholder={t('teacher.bioPlaceholder')} onChange={(e) => set('bio', e.target.value)} />
          </Field>
          <Checkbox label={t('teacher.listed')} checked={form.is_listed} onChange={(v) => set('is_listed', v)} />
          <p className="text-xs text-ink-500">{t('teacher.verifiedNote')}</p>
          {error && <Alert tone="berry">{error}</Alert>}
          {saved && <Alert tone="mint"><span className="inline-flex items-center gap-1.5"><Check size={16} /> {t('common.saved')}</span></Alert>}
          <Button type="submit" size="lg" loading={busy}>
            {t('common.save')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
