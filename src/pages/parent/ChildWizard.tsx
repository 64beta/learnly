import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  addOpinion,
  createChild,
  deleteOpinion,
  getChild,
  replaceConditions,
  updateChild,
  type ChildInput,
} from '../../lib/api'
import {
  CONDITION_CODES,
  type ChildCondition,
  type CommunicationLevel,
  type ConditionCode,
  type DiagnosisStatus,
  type MedicalOpinion,
  type SensoryKey,
  type SensoryLevel,
} from '../../lib/types'
import { formatDate, todayIso } from '../../lib/format'
import { useErrorText } from '../../lib/useErrorText'
import { Alert, Button, Card, Checkbox, Chips, Field, Input, PageSpinner, Select, Textarea, cn } from '../../components/ui'
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react'

const STEPS = ['basics', 'diagnosis', 'conditions', 'opinions', 'health', 'daily'] as const
const SPECIALTIES = ['neurologist', 'psychiatrist', 'psychologist', 'speech_therapist', 'defectologist', 'pediatrician', 'other'] as const
const THERAPIES = ['aba', 'speech', 'ot', 'psychology', 'defectology', 'sport', 'other'] as const
const SENSORY_KEYS: SensoryKey[] = ['sound', 'light', 'touch']
const SENSORY_LEVELS: SensoryLevel[] = ['high', 'medium', 'low']

interface FormState {
  first_name: string
  birth_date: string
  gender: 'male' | 'female' | null
  diagnosis_status: DiagnosisStatus | null
  support_level: 1 | 2 | 3 | null
  diagnosis_date: string
  diagnosed_by: string
  icd_code: string
  chronic_conditions: string
  allergies: string
  medications: string
  communication_level: CommunicationLevel | null
  uses_aac: boolean
  sensory: Partial<Record<SensoryKey, SensoryLevel>>
  interests: string
  current_therapies: string[]
}

const EMPTY_FORM: FormState = {
  first_name: '',
  birth_date: '',
  gender: null,
  diagnosis_status: null,
  support_level: null,
  diagnosis_date: '',
  diagnosed_by: '',
  icd_code: '',
  chronic_conditions: '',
  allergies: '',
  medications: '',
  communication_level: null,
  uses_aac: false,
  sensory: {},
  interests: '',
  current_therapies: [],
}

const EMPTY_OPINION = {
  opinion_date: todayIso(),
  doctor_name: '',
  specialty: '',
  institution: '',
  diagnosis_text: '',
  opinion_text: '',
  recommendations: '',
  next_visit_date: '',
}

const orNull = (s: string) => (s.trim() ? s.trim() : null)

export default function ChildWizard() {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id: routeId } = useParams()
  const [params, setParams] = useSearchParams()

  const [childId, setChildId] = useState<string | null>(routeId ?? null)
  const [step, setStep] = useState(() => Math.min(6, Math.max(1, Number(params.get('step')) || 1)))
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [conditions, setConditions] = useState<Partial<Record<ConditionCode, ChildCondition>>>({})
  const [opinions, setOpinions] = useState<MedicalOpinion[]>([])
  const [opinionDraft, setOpinionDraft] = useState(EMPTY_OPINION)
  const [initialized, setInitialized] = useState(!routeId)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existing = useQuery({ queryKey: ['child', routeId], queryFn: () => getChild(routeId!), enabled: Boolean(routeId) })

  useEffect(() => {
    const c = existing.data
    if (!c || initialized) return
    setForm({
      first_name: c.first_name,
      birth_date: c.birth_date,
      gender: c.gender,
      diagnosis_status: c.diagnosis_status,
      support_level: c.support_level,
      diagnosis_date: c.diagnosis_date ?? '',
      diagnosed_by: c.diagnosed_by ?? '',
      icd_code: c.icd_code ?? '',
      chronic_conditions: c.chronic_conditions ?? '',
      allergies: c.allergies ?? '',
      medications: c.medications ?? '',
      communication_level: c.communication_level,
      uses_aac: Boolean(c.uses_aac),
      sensory: c.sensory ?? {},
      interests: (c.interests ?? []).join(', '),
      current_therapies: c.current_therapies ?? [],
    })
    setConditions(Object.fromEntries(c.child_conditions.map((x) => [x.condition_code, x])))
    setOpinions(c.medical_opinions)
    setInitialized(true)
  }, [existing.data, initialized])

  if (routeId && (existing.isLoading || !initialized)) return <PageSpinner />
  if (routeId && !existing.data) return <Alert tone="berry">{t('child.notFound')}</Alert>

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const goTo = (n: number) => {
    setStep(n)
    setErrors({})
    setError(null)
    if (childId) setParams({ step: String(n) }, { replace: true })
    window.scrollTo({ top: 0 })
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!form.first_name.trim()) e.first_name = t('errors.required')
      if (!form.birth_date) e.birth_date = t('errors.required')
      else if (form.birth_date > todayIso() || form.birth_date < '2000-01-02') e.birth_date = t('errors.invalidDate')
    }
    if (step === 2 && !form.diagnosis_status) e.diagnosis_status = t('errors.required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const payloadFor = (n: number): ChildInput => {
    switch (n) {
      case 1:
        return { first_name: form.first_name.trim(), birth_date: form.birth_date, gender: form.gender }
      case 2:
        return {
          diagnosis_status: form.diagnosis_status!,
          support_level: form.support_level,
          diagnosis_date: orNull(form.diagnosis_date),
          diagnosed_by: orNull(form.diagnosed_by),
          icd_code: orNull(form.icd_code),
        }
      case 5:
        return {
          chronic_conditions: orNull(form.chronic_conditions),
          allergies: orNull(form.allergies),
          medications: orNull(form.medications),
          health_reviewed: true,
        }
      case 6:
        return {
          communication_level: form.communication_level,
          uses_aac: form.uses_aac,
          sensory: form.sensory,
          interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
          current_therapies: form.current_therapies,
        }
      default:
        return {}
    }
  }

  const persistStep = async (): Promise<string | null> => {
    if (step === 1 && !childId) return null // uşaq 2-ci addımdan sonra yaradılır
    if (step === 2 && !childId) {
      const created = await createChild({ ...payloadFor(1), ...payloadFor(2) })
      setChildId(created.id)
      navigate(`/app/children/${created.id}/edit?step=3`, { replace: true })
      return created.id
    }
    if (!childId) return null
    if (step === 3) {
      await replaceConditions(childId, Object.values(conditions).filter((c): c is ChildCondition => Boolean(c)))
    } else if (step !== 4) {
      await updateChild(childId, payloadFor(step))
    }
    return childId
  }

  const finishTo = (id: string) => {
    void queryClient.invalidateQueries({ queryKey: ['children'] })
    void queryClient.invalidateQueries({ queryKey: ['child', id] })
    navigate(`/app/children/${id}`)
  }

  const onNext = async () => {
    if (!validate()) return
    setSaving(true)
    setError(null)
    try {
      const id = (await persistStep()) ?? childId
      if (step === 6 && id) return finishTo(id)
      goTo(step + 1)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const onLater = async () => {
    if (!childId) return
    setSaving(true)
    try {
      if (validate()) await persistStep()
      finishTo(childId)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const onAddOpinion = async () => {
    if (!childId) return
    const e: Record<string, string> = {}
    if (!opinionDraft.opinion_date) e.opinion_date = t('errors.required')
    if (!opinionDraft.opinion_text.trim()) e.opinion_text = t('errors.required')
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      const created = await addOpinion({
        child_id: childId,
        opinion_date: opinionDraft.opinion_date,
        doctor_name: orNull(opinionDraft.doctor_name),
        specialty: orNull(opinionDraft.specialty),
        institution: orNull(opinionDraft.institution),
        diagnosis_text: orNull(opinionDraft.diagnosis_text),
        opinion_text: opinionDraft.opinion_text.trim(),
        recommendations: orNull(opinionDraft.recommendations),
        next_visit_date: orNull(opinionDraft.next_visit_date),
      })
      setOpinions((o) => [created, ...o].sort((a, b) => b.opinion_date.localeCompare(a.opinion_date)))
      setOpinionDraft(EMPTY_OPINION)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const onDeleteOpinion = async (id: string) => {
    try {
      await deleteOpinion(id)
      setOpinions((o) => o.filter((x) => x.id !== id))
    } catch (err) {
      setError(errorText(err))
    }
  }

  const toggleCondition = (code: ConditionCode, on: boolean) =>
    setConditions((c) => {
      const next = { ...c }
      if (on) next[code] = { condition_code: code, status: 'confirmed', note: null }
      else delete next[code]
      return next
    })

  const optional = <span className="font-normal text-ink-400">({t('common.optional')})</span>

  let body: ReactNode = null
  if (step === 1) {
    body = (
      <div className="space-y-5">
        <Field label={t('wizard.firstName')} required error={errors.first_name}>
          <Input value={form.first_name} maxLength={60} onChange={(e) => set('first_name', e.target.value)} autoFocus />
        </Field>
        <Field label={t('wizard.birthDate')} required error={errors.birth_date}>
          <Input type="date" max={todayIso()} value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} />
        </Field>
        <Field label={<>{t('wizard.gender')} {optional}</>}>
          <Chips
            options={[
              { value: 'male', label: t('child.gender.male') },
              { value: 'female', label: t('child.gender.female') },
            ]}
            value={form.gender ? [form.gender] : []}
            onChange={(v) => set('gender', (v[0] as 'male' | 'female' | undefined) ?? null)}
          />
        </Field>
      </div>
    )
  } else if (step === 2) {
    body = (
      <div className="space-y-5">
        <Field label={t('wizard.diagnosisStatus')} required error={errors.diagnosis_status}>
          <Chips
            options={(['confirmed', 'suspected', 'in_evaluation'] as DiagnosisStatus[]).map((s) => ({ value: s, label: t(`child.diagnosisStatus.${s}`) }))}
            value={form.diagnosis_status ? [form.diagnosis_status] : []}
            onChange={(v) => set('diagnosis_status', (v[0] as DiagnosisStatus | undefined) ?? null)}
          />
        </Field>
        <Field label={<>{t('wizard.supportLevel')} {optional}</>} hint={t('wizard.supportHelp')}>
          <Chips
            options={[
              { value: '1', label: t('child.supportLevelN', { level: 1 }) },
              { value: '2', label: t('child.supportLevelN', { level: 2 }) },
              { value: '3', label: t('child.supportLevelN', { level: 3 }) },
            ]}
            value={form.support_level ? [String(form.support_level)] : []}
            onChange={(v) => set('support_level', v[0] ? (Number(v[0]) as 1 | 2 | 3) : null)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={<>{t('child.diagnosisDate')} {optional}</>}>
            <Input type="date" max={todayIso()} value={form.diagnosis_date} onChange={(e) => set('diagnosis_date', e.target.value)} />
          </Field>
          <Field label={<>{t('child.diagnosedBy')} {optional}</>}>
            <Input value={form.diagnosed_by} onChange={(e) => set('diagnosed_by', e.target.value)} />
          </Field>
          <Field label={<>{t('child.icd')} {optional}</>}>
            <Input value={form.icd_code} placeholder="F84.0" onChange={(e) => set('icd_code', e.target.value)} />
          </Field>
        </div>
      </div>
    )
  } else if (step === 3) {
    body = (
      <div className="space-y-4">
        <p className="text-sm text-ink-600">{t('wizard.conditionsHelp')}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {CONDITION_CODES.map((code) => {
            const c = conditions[code]
            return (
              <div key={code} className={cn('rounded-xl p-3 ring-1', c ? 'bg-brand-50/60 ring-brand-200' : 'ring-ink-200')}>
                <Checkbox label={<span className="font-semibold">{t(`conditions.${code}`)}</span>} checked={Boolean(c)} onChange={(on) => toggleCondition(code, on)} />
                {c && (
                  <div className="mt-3 space-y-2 pl-8">
                    <Chips
                      options={[
                        { value: 'confirmed', label: t('wizard.confirmed') },
                        { value: 'suspected', label: t('wizard.suspected') },
                      ]}
                      value={[c.status]}
                      onChange={(v) =>
                        setConditions((all) => ({ ...all, [code]: { ...c, status: (v[0] as 'confirmed' | 'suspected' | undefined) ?? c.status } }))
                      }
                    />
                    <Input
                      placeholder={t('wizard.note')}
                      value={c.note ?? ''}
                      onChange={(e) => setConditions((all) => ({ ...all, [code]: { ...c, note: e.target.value } }))}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  } else if (step === 4) {
    body = (
      <div className="space-y-6">
        <p className="text-sm text-ink-600">{t('wizard.opinionsHelp')}</p>
        {opinions.length === 0 ? (
          <p className="text-sm font-semibold text-ink-400">{t('wizard.noOpinions')}</p>
        ) : (
          <ul className="space-y-3">
            {opinions.map((o) => (
              <li key={o.id} className="flex items-start justify-between gap-3 rounded-xl bg-ink-50 p-3 ring-1 ring-ink-200">
                <div className="min-w-0 text-sm">
                  <div className="font-bold text-ink-800">
                    {formatDate(o.opinion_date)} · {o.specialty ? t(`specialties.${o.specialty}`, { defaultValue: o.specialty }) : '—'}
                    {o.doctor_name ? ` · ${o.doctor_name}` : ''}
                  </div>
                  <p className="mt-1 line-clamp-2 text-ink-600">{o.opinion_text}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void onDeleteOpinion(o.id)}>
                  {t('common.delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-4 rounded-2xl p-4 ring-1 ring-ink-200">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('wizard.opinionDate')} required error={errors.opinion_date}>
              <Input type="date" max={todayIso()} value={opinionDraft.opinion_date} onChange={(e) => setOpinionDraft((d) => ({ ...d, opinion_date: e.target.value }))} />
            </Field>
            <Field label={t('wizard.specialty')}>
              <Select value={opinionDraft.specialty} onChange={(e) => setOpinionDraft((d) => ({ ...d, specialty: e.target.value }))}>
                <option value="">—</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {t(`specialties.${s}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('wizard.doctorName')}>
              <Input value={opinionDraft.doctor_name} onChange={(e) => setOpinionDraft((d) => ({ ...d, doctor_name: e.target.value }))} />
            </Field>
            <Field label={t('wizard.institution')}>
              <Input value={opinionDraft.institution} onChange={(e) => setOpinionDraft((d) => ({ ...d, institution: e.target.value }))} />
            </Field>
          </div>
          <Field label={t('wizard.diagnosisText')}>
            <Input value={opinionDraft.diagnosis_text} onChange={(e) => setOpinionDraft((d) => ({ ...d, diagnosis_text: e.target.value }))} />
          </Field>
          <Field label={t('wizard.opinionText')} required error={errors.opinion_text}>
            <Textarea rows={5} value={opinionDraft.opinion_text} onChange={(e) => setOpinionDraft((d) => ({ ...d, opinion_text: e.target.value }))} />
          </Field>
          <Field label={t('wizard.recommendations')}>
            <Textarea rows={3} value={opinionDraft.recommendations} onChange={(e) => setOpinionDraft((d) => ({ ...d, recommendations: e.target.value }))} />
          </Field>
          <Field label={t('wizard.nextVisit')} className="sm:w-1/2">
            <Input type="date" value={opinionDraft.next_visit_date} onChange={(e) => setOpinionDraft((d) => ({ ...d, next_visit_date: e.target.value }))} />
          </Field>
          <Button variant="secondary" onClick={() => void onAddOpinion()} loading={saving}>
            <Plus size={16} /> {t('wizard.addOpinion')}
          </Button>
        </div>
      </div>
    )
  } else if (step === 5) {
    body = (
      <div className="space-y-5">
        <p className="text-sm text-ink-600">{t('wizard.healthHelp')}</p>
        <Field label={t('child.chronic')}>
          <Textarea rows={3} value={form.chronic_conditions} onChange={(e) => set('chronic_conditions', e.target.value)} />
        </Field>
        <Field label={t('child.allergies')}>
          <Textarea rows={2} value={form.allergies} onChange={(e) => set('allergies', e.target.value)} />
        </Field>
        <Field label={<>{t('child.medications')} {optional}</>} hint={t('wizard.medicationsHint')}>
          <Textarea rows={3} value={form.medications} onChange={(e) => set('medications', e.target.value)} />
        </Field>
      </div>
    )
  } else {
    body = (
      <div className="space-y-6">
        <Field label={t('wizard.communication')}>
          <Chips
            options={(['verbal', 'limited', 'nonverbal'] as CommunicationLevel[]).map((c) => ({ value: c, label: t(`child.communication.${c}`) }))}
            value={form.communication_level ? [form.communication_level] : []}
            onChange={(v) => set('communication_level', (v[0] as CommunicationLevel | undefined) ?? null)}
          />
        </Field>
        <Checkbox label={t('child.aac')} checked={form.uses_aac} onChange={(v) => set('uses_aac', v)} />
        <div>
          <div className="mb-1 text-sm font-bold text-ink-700">{t('child.sensory')}</div>
          <p className="mb-3 text-xs text-ink-500">{t('wizard.sensoryHelp')}</p>
          <div className="space-y-3">
            {SENSORY_KEYS.map((key) => (
              <div key={key} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="w-28 text-sm font-semibold text-ink-600">{t(`child.sensoryKeys.${key}`)}</span>
                <Chips
                  options={SENSORY_LEVELS.map((l) => ({ value: l, label: t(`child.sensoryLevels.${l}`) }))}
                  value={form.sensory[key] ? [form.sensory[key]!] : []}
                  onChange={(v) =>
                    setForm((f) => {
                      const sensory = { ...f.sensory }
                      if (v[0]) sensory[key] = v[0] as SensoryLevel
                      else delete sensory[key]
                      return { ...f, sensory }
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <Field label={t('child.interests')} hint={t('common.commaHint')}>
          <Input value={form.interests} placeholder={t('wizard.interestsPlaceholder')} onChange={(e) => set('interests', e.target.value)} />
        </Field>
        <Field label={t('child.therapies')}>
          <Chips
            multi
            options={THERAPIES.map((th) => ({ value: th, label: t(`therapies.${th}`) }))}
            value={form.current_therapies}
            onChange={(v) => set('current_therapies', v)}
          />
        </Field>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link to={childId ? `/app/children/${childId}` : '/app'} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-ink-900 sm:text-3xl">{routeId ? t('wizard.titleEdit') : t('wizard.titleNew')}</h1>
        {form.first_name && routeId && <p className="text-ink-500">{form.first_name}</p>}
      </div>

      {/* Addım göstəricisi */}
      <ol className="mb-6 grid grid-cols-6 gap-1.5" aria-label={t('wizard.stepOf', { n: step, total: 6 })}>
        {STEPS.map((s, i) => {
          const n = i + 1
          const reachable = Boolean(childId) || n <= step
          return (
            <li key={s}>
              <button
                type="button"
                disabled={!reachable || saving}
                onClick={() => goTo(n)}
                className="w-full text-left disabled:cursor-default"
                aria-current={n === step ? 'step' : undefined}
              >
                <span className={cn('block h-1.5 rounded-full', n <= step ? 'bg-brand-500' : 'bg-ink-200')} />
                <span className={cn('mt-1.5 hidden text-xs font-bold sm:block', n === step ? 'text-brand-700' : 'text-ink-400')}>
                  {t(`wizard.steps.${s}`)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <Card className="p-6">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-extrabold text-ink-900">{t(`wizard.steps.${STEPS[step - 1]}`)}</h2>
          <span className="text-sm font-bold text-ink-400">{t('wizard.stepOf', { n: step, total: 6 })}</span>
        </div>
        {step <= 2 && !childId && <p className="mb-5 text-xs text-ink-500">{t('wizard.requiredNote')}</p>}
        {body}
        {error && <Alert tone="berry" className="mt-5">{error}</Alert>}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={saving}>
                <ArrowLeft size={16} /> {t('common.back')}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {childId && step < 6 && (
              <Button variant="secondary" onClick={() => void onLater()} disabled={saving}>
                {t('common.later')}
              </Button>
            )}
            <Button onClick={() => void onNext()} loading={saving}>
              {step === 6 ? <><Check size={18} /> {t('common.finish')}</> : <>{t('common.next')} <ArrowRight size={18} /></>}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
