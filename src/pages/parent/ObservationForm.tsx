import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { upsertObservation } from '../../lib/api'
import { todayIso } from '../../lib/format'
import { useErrorText } from '../../lib/useErrorText'
import type { Observation } from '../../lib/types'
import { Alert, Button, Card, Checkbox, Field, Input, Textarea, cn } from '../../components/ui'
import { ArrowLeft, CloudLightning, CloudMoon, Moon, NotebookPen, Zap } from 'lucide-react'
import { Face } from '../../content/art'

type Mood = NonNullable<Observation['mood']>
type Sleep = NonNullable<Observation['sleep']>

function BigChoice<T extends string>({ options, value, onChange }: { options: { value: T; icon: ReactNode; label: string }[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            'flex flex-col items-center gap-1 rounded-2xl p-3 ring-2 transition-colors',
            value === o.value ? 'bg-brand-50 ring-brand-500' : 'bg-white ring-ink-200 hover:ring-ink-300',
          )}
        >
          <span className="flex h-12 items-center justify-center" aria-hidden>
            {o.icon}
          </span>
          <span className="text-sm font-bold text-ink-700">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function ObservationForm() {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayIso())
  const [mood, setMood] = useState<Mood | null>(null)
  const [sleep, setSleep] = useState<Sleep | null>(null)
  const [meltdown, setMeltdown] = useState(false)
  const [meltdownNote, setMeltdownNote] = useState('')
  const [freeText, setFreeText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!id) return null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await upsertObservation({
        child_id: id,
        observed_on: date,
        mood,
        sleep,
        meltdown,
        meltdown_note: meltdown && meltdownNote.trim() ? meltdownNote.trim() : null,
        free_text: freeText.trim() ? freeText.trim().slice(0, 2000) : null,
      })
      void queryClient.invalidateQueries({ queryKey: ['observations', id] })
      navigate(`/app/children/${id}?tab=observations`)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/app/children/${id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
        <ArrowLeft size={16} /> {t('common.back')}
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-3xl font-extrabold text-ink-900"><NotebookPen size={26} className="text-brand-600" /> {t('observe.title')}</h1>
      <p className="mb-6 text-ink-500">{t('observe.subtitle')}</p>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <Field label={t('observe.date')} className="sm:w-1/2">
            <Input type="date" max={todayIso()} value={date} required onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div>
            <div className="mb-2 text-sm font-bold text-ink-700">{t('observe.mood')}</div>
            <BigChoice<Mood>
              value={mood}
              onChange={setMood}
              options={[
                { value: 'good', icon: <Face kind="happy" size={44} />, label: t('observe.moods.good') },
                { value: 'neutral', icon: <Face kind="neutral" size={44} />, label: t('observe.moods.neutral') },
                { value: 'bad', icon: <Face kind="sad" size={44} />, label: t('observe.moods.bad') },
              ]}
            />
          </div>
          <div>
            <div className="mb-2 text-sm font-bold text-ink-700">{t('observe.sleep')}</div>
            <BigChoice<Sleep>
              value={sleep}
              onChange={setSleep}
              options={[
                { value: 'good', icon: <Moon size={32} className="text-brand-600" />, label: t('observe.sleeps.good') },
                { value: 'ok', icon: <CloudMoon size={32} className="text-lavender-700" />, label: t('observe.sleeps.ok') },
                { value: 'bad', icon: <CloudLightning size={32} className="text-peach-700" />, label: t('observe.sleeps.bad') },
              ]}
            />
          </div>
          <div className="space-y-3">
            <Checkbox label={<span className="inline-flex items-center gap-1.5 font-bold"><Zap size={16} className="text-berry-600" /> {t('observe.meltdown')}</span>} checked={meltdown} onChange={setMeltdown} />
            {meltdown && <Textarea rows={2} placeholder={t('observe.meltdownNote')} value={meltdownNote} onChange={(e) => setMeltdownNote(e.target.value)} />}
          </div>
          <Field label={t('observe.freeText')}>
            <Textarea rows={4} maxLength={2000} placeholder={t('observe.freeTextPlaceholder')} value={freeText} onChange={(e) => setFreeText(e.target.value)} />
          </Field>
          {error && <Alert tone="berry">{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            {t('common.save')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
