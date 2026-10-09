import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BookOpen, House, RotateCcw, Star, Volume2, VolumeX } from 'lucide-react'
import { findLesson } from '../../content/lessons'
import { LessonIcon } from '../../content/icons'
import { getChild } from '../../lib/api'
import type { Locale } from '../../lib/types'
import { PlayShell } from '../../features/play/PlayShell'
import { ChoiceStep, InfoStep, OrderStep } from '../../features/play/steps'
import { createTracker, type Tracker } from '../../features/play/tracker'
import { PageSpinner } from '../../components/ui'

/** Sakit bayram təsviri: palitra formaları (yanıb-sönmə və konfetti partlayışı yoxdur). */
function Celebration() {
  return (
    <svg viewBox="0 0 200 140" className="h-36 w-52" aria-hidden>
      <circle cx="100" cy="78" r="52" fill="#b5b1d8" />
      <path d="M60 110 A40 40 0 0 1 140 110 Z" fill="#005b8d" />
      <circle cx="38" cy="40" r="10" fill="#fdbf68" />
      <circle cx="166" cy="34" r="7" fill="#78cdd0" />
      <rect x="150" y="84" width="16" height="16" rx="4" fill="#a36aa5" transform="rotate(18 158 92)" />
      <rect x="22" y="88" width="12" height="12" rx="3" fill="#099197" transform="rotate(-14 28 94)" />
      <circle cx="84" cy="70" r="5" fill="#2c2e4c" />
      <circle cx="116" cy="70" r="5" fill="#2c2e4c" />
      <path d="M84 86 Q100 100 116 86" stroke="#2c2e4c" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function LessonPlayer() {
  const { t, i18n } = useTranslation()
  const { childId, slug } = useParams()
  const queryClient = useQueryClient()
  const lesson = findLesson(slug)
  const child = useQuery({ queryKey: ['child', childId], queryFn: () => getChild(childId!), enabled: Boolean(childId) })

  const [run, setRun] = useState(0) // "Yenidən oyna" yeni sessiya başladır
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [firstTry, setFirstTry] = useState(0)
  const [trackError, setTrackError] = useState(false)
  const [soundPref, setSoundPref] = useState<boolean | null>(null)
  const trackerRef = useRef<Tracker | null>(null)
  const startedRun = useRef<number | null>(null)

  useEffect(() => {
    if (!childId || !lesson || startedRun.current === run) return
    startedRun.current = run // StrictMode-da iki dəfə sessiya yaranmasın
    trackerRef.current = createTracker(childId, lesson.slug, () => setTrackError(true))
  }, [childId, lesson, run])

  if (!childId) return null
  if (!lesson) {
    return (
      <PlayShell childId={childId}>
        <p className="text-center text-xl font-bold">{t('play.unknownLesson')}</p>
      </PlayShell>
    )
  }
  if (child.isLoading) return <PageSpinner />

  // Səsə yüksək həssaslıq varsa, səs default olaraq bağlıdır
  const sound = soundPref ?? child.data?.sensory?.sound !== 'high'
  const lang = i18n.language as Locale
  const step = lesson.steps[index]
  const graded = lesson.steps.filter((s) => s.type !== 'info').length

  const next = () => {
    if (index + 1 < lesson.steps.length) {
      setIndex(index + 1)
      return
    }
    setDone(true)
    void trackerRef.current?.finish().then(() => {
      for (const key of ['stats', 'summaries']) void queryClient.invalidateQueries({ queryKey: [key, childId] })
    })
  }

  const restart = () => {
    setIndex(0)
    setDone(false)
    setFirstTry(0)
    setTrackError(false)
    setRun((r) => r + 1)
  }

  const onEvent = (e: Parameters<Tracker['log']>[0]) => trackerRef.current?.log(e)
  const onResult = (ok: boolean) => ok && setFirstTry((n) => n + 1)
  const stars = graded === 0 ? 3 : Math.max(1, Math.round((firstTry / graded) * 3))
  const progress = ((done ? lesson.steps.length : index) / lesson.steps.length) * 100

  const top = (
    <div className="flex items-center gap-3">
      <Link
        to={`/play/${childId}`}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink-700 ring-1 ring-lavender-200 hover:text-brand-700"
        aria-label={t('play.toMenu')}
      >
        <House size={20} />
      </Link>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-lavender-200">
        <div className="h-full rounded-full bg-mint-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <button
        type="button"
        onClick={() => setSoundPref(!sound)}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink-700 ring-1 ring-lavender-200"
        aria-label={sound ? t('play.soundOn') : t('play.soundOff')}
        title={sound ? t('play.soundOn') : t('play.soundOff')}
      >
        {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </div>
  )

  return (
    <PlayShell childId={childId} top={top}>
      <div className="mb-8 flex items-center justify-center gap-2 text-sm font-bold text-ink-600">
        <LessonIcon name={lesson.icon} size="sm" />
        {lesson.title[lang] ?? lesson.title.az}
      </div>
      {trackError && <p className="mb-6 rounded-2xl bg-peach-100 p-3 text-center text-sm text-peach-900">{t('play.notTracked')}</p>}

      {done ? (
        <div className="pop-in flex flex-col items-center py-6 text-center">
          <Celebration />
          <h2 className="mt-4 text-5xl font-black text-ink-900">{t('play.doneTitle')}</h2>
          <p className="mt-3 text-2xl text-ink-700">{t('play.doneText')}</p>
          <div className="mt-6 flex gap-2" aria-label={`${stars}/3`}>
            {[0, 1, 2].map((i) => (
              <Star key={i} size={48} className={i < stars ? 'fill-peach-400 text-peach-600' : 'fill-lavender-100 text-lavender-300'} />
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button type="button" onClick={restart} className="inline-flex h-16 items-center justify-center gap-3 rounded-full bg-white px-9 text-lg font-extrabold text-ink-800 ring-2 ring-lavender-200">
              <RotateCcw size={22} /> {t('play.again')}
            </button>
            <Link to={`/play/${childId}`} className="inline-flex h-16 items-center justify-center gap-3 rounded-full bg-mint-600 px-9 text-lg font-extrabold text-white hover:bg-mint-700">
              <BookOpen size={22} /> {t('play.toMenu')}
            </Link>
          </div>
        </div>
      ) : step.type === 'info' ? (
        <InfoStep key={`${run}-${step.id}`} step={step} onNext={next} />
      ) : step.type === 'choice' ? (
        <ChoiceStep key={`${run}-${step.id}`} step={step} onEvent={onEvent} onNext={next} onResult={onResult} sound={sound} />
      ) : (
        <OrderStep key={`${run}-${step.id}`} step={step} onEvent={onEvent} onNext={next} onResult={onResult} sound={sound} />
      )}
    </PlayShell>
  )
}
