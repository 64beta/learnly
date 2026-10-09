import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Lightbulb } from 'lucide-react'
import type { Option, Step } from '../../content/lessons'
import { LessonIcon } from '../../content/icons'
import { cn } from '../../components/ui'
import type { AnswerEvent } from './tracker'
import { correctPrefix } from './logic'
import { playSoftTry, playSuccess } from './sound'

export const MAX_ATTEMPTS = 3

type ChoiceStepT = Extract<Step, { type: 'choice' }>
type OrderStepT = Extract<Step, { type: 'order' }>
type InfoStepT = Extract<Step, { type: 'info' }>
type Status = 'asking' | 'correct' | 'revealed'

interface StepProps {
  onEvent: (e: AnswerEvent) => void
  onNext: () => void
  /** İlk cəhddə, ipucusuz düzgün olub-olmadığı (ulduz hesabı üçün) */
  onResult: (firstTry: boolean) => void
  sound: boolean
}

function ContinueButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus
      className="pop-in mx-auto mt-8 flex h-16 items-center gap-3 rounded-full bg-mint-600 px-12 text-xl font-extrabold text-white hover:bg-mint-700 focus-visible:ring-4 focus-visible:ring-mint-300 focus-visible:outline-none"
    >
      {t('play.continue')} <ArrowRight size={24} />
    </button>
  )
}

function Feedback({ status, wrongOnce }: { status: Status; wrongOnce: boolean }) {
  const { t } = useTranslation()
  if (status === 'correct')
    return (
      <p className="pop-in inline-flex items-center gap-2 rounded-full bg-mint-100 px-5 py-2 text-2xl font-extrabold text-mint-800">
        <Check size={26} strokeWidth={3} /> {t('play.great')}
      </p>
    )
  if (status === 'revealed')
    return <p className="pop-in rounded-full bg-peach-100 px-5 py-2 text-lg font-bold text-peach-900">{t('play.showAnswer')}</p>
  if (wrongOnce) return <p className="text-lg font-bold text-brand-700">{t('play.tryAgain')}</p>
  return null
}

function HintButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-base font-bold text-peach-800 ring-2 ring-peach-200 hover:bg-peach-50 disabled:opacity-40"
    >
      <Lightbulb size={20} /> {t('play.hint')}
    </button>
  )
}

export function InfoStep({ step, onNext }: { step: InfoStepT; onNext: () => void }) {
  return (
    <div className="pop-in flex flex-col items-center text-center">
      <div className="flex flex-wrap justify-center gap-4">
        {step.icons.map((icon, i) => (
          <LessonIcon key={i} name={icon} size={step.icons.length > 2 ? 'lg' : 'xl'} />
        ))}
      </div>
      <p className="mt-10 max-w-2xl text-3xl leading-snug font-extrabold text-ink-900">{step.text}</p>
      <ContinueButton onClick={onNext} />
    </div>
  )
}

export function ChoiceStep({ step, onEvent, onNext, onResult, sound }: StepProps & { step: ChoiceStepT }) {
  const lastAt = useRef(performance.now())
  const [wrong, setWrong] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('asking')
  const [hint, setHint] = useState(false)
  const [hintPending, setHintPending] = useState(false)
  const [shake, setShake] = useState<string | null>(null)

  const choose = (opt: Option) => {
    if (status !== 'asking' || wrong.includes(opt.id)) return
    const now = performance.now()
    const attempt = wrong.length + 1
    const correct = opt.id === step.correct
    onEvent({ step_id: step.id, attempt_no: attempt, is_correct: correct, response_ms: now - lastAt.current, hint_used: hintPending })
    lastAt.current = now
    setHintPending(false)
    if (correct) {
      setStatus('correct')
      onResult(attempt === 1 && !hint)
      if (sound) playSuccess()
      return
    }
    setWrong((w) => [...w, opt.id])
    setShake(opt.id)
    setTimeout(() => setShake(null), 350)
    if (sound) playSoftTry()
    if (attempt >= MAX_ATTEMPTS) {
      setStatus('revealed')
      onResult(false)
    }
  }

  const cols = step.options.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'

  return (
    <div className="pop-in">
      <div className="flex flex-col items-center gap-5 text-center">
        {step.icon && <LessonIcon name={step.icon} size="lg" />}
        <h2 className="max-w-2xl text-3xl leading-snug font-extrabold text-ink-900">{step.prompt}</h2>
      </div>
      <div className={cn('mt-10 grid gap-5', cols)}>
        {step.options.map((opt) => {
          const isWrong = wrong.includes(opt.id)
          const isAnswer = opt.id === step.correct
          const highlight = (status !== 'asking' && isAnswer) || (hint && status === 'asking' && isAnswer)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => choose(opt)}
              disabled={status !== 'asking' || isWrong}
              className={cn(
                'flex flex-col items-center gap-4 rounded-[2rem] bg-white p-6 ring-4 transition',
                highlight ? 'ring-mint-400' : 'ring-transparent hover:ring-lavender-300',
                isWrong && 'opacity-35',
                shake === opt.id && 'soft-shake',
                'focus-visible:ring-brand-400 focus-visible:outline-none',
              )}
            >
              <LessonIcon name={opt.icon} size="lg" />
              <span className="text-xl font-bold text-ink-900">{opt.label}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-8 flex min-h-12 flex-col items-center gap-4">
        <Feedback status={status} wrongOnce={wrong.length > 0} />
        {status === 'asking' && (
          <HintButton
            disabled={hint}
            onClick={() => {
              setHint(true)
              setHintPending(true)
            }}
          />
        )}
      </div>
      {status !== 'asking' && <ContinueButton onClick={onNext} />}
    </div>
  )
}

function shuffled<T>(items: T[]): T[] {
  if (items.length < 2) return items
  for (let guard = 0; guard < 10; guard++) {
    const a = [...items]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    if (a.some((x, i) => x !== items[i])) return a
  }
  return [...items].reverse()
}

export function OrderStep({ step, onEvent, onNext, onResult, sound }: StepProps & { step: OrderStepT }) {
  const { t } = useTranslation()
  const initial = useMemo(() => shuffled(step.items), [step.items])
  const lastAt = useRef(performance.now())
  const [placed, setPlaced] = useState<Option[]>([])
  const [locked, setLocked] = useState(0) // başdan təsdiqlənmiş düzgün elementlər
  const [attempts, setAttempts] = useState(0)
  const [status, setStatus] = useState<Status>('asking')
  const [hintUsed, setHintUsed] = useState(false)
  const [hintPending, setHintPending] = useState(false)
  const [shake, setShake] = useState(false)

  const pool = initial.filter((o) => !placed.some((p) => p.id === o.id))

  const place = (o: Option) => status === 'asking' && setPlaced((p) => [...p, o])
  const unplace = (index: number) => {
    if (status !== 'asking' || index < locked) return
    setPlaced((p) => p.filter((_, i) => i !== index))
  }

  const check = () => {
    const now = performance.now()
    const attempt = attempts + 1
    const k = correctPrefix(placed, step.items)
    const correct = k === step.items.length
    onEvent({ step_id: step.id, attempt_no: attempt, is_correct: correct, response_ms: now - lastAt.current, hint_used: hintPending })
    lastAt.current = now
    setHintPending(false)
    setAttempts(attempt)
    if (correct) {
      setStatus('correct')
      onResult(attempt === 1 && !hintUsed)
      if (sound) playSuccess()
      return
    }
    if (sound) playSoftTry()
    setShake(true)
    setTimeout(() => setShake(false), 350)
    if (attempt >= MAX_ATTEMPTS) {
      setPlaced(step.items)
      setLocked(step.items.length)
      setStatus('revealed')
      onResult(false)
      return
    }
    // Düzgün başlanğıc yerində qalır, qalanı geri qayıdır
    setPlaced((p) => p.slice(0, k))
    setLocked(k)
  }

  const hint = () => {
    const k = correctPrefix(placed, step.items)
    const next = Math.min(step.items.length, k + 1)
    setPlaced(step.items.slice(0, next))
    setLocked(next)
    setHintUsed(true)
    setHintPending(true)
  }

  return (
    <div className="pop-in">
      <h2 className="text-center text-3xl leading-snug font-extrabold text-ink-900">{step.prompt}</h2>
      <p className="mt-2 text-center text-lg text-ink-600">{t('play.orderHelp')}</p>

      <ol className={cn('mt-8 grid gap-3', step.items.length > 4 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4', shake && 'soft-shake')}>
        {step.items.map((_, i) => {
          const item = placed[i]
          const done = item && (i < locked || status !== 'asking')
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => unplace(i)}
                disabled={!item || i < locked || status !== 'asking'}
                className={cn(
                  'relative flex h-44 w-full flex-col items-center justify-center gap-2 rounded-[1.75rem] p-2',
                  item ? 'bg-white' : 'border-[3px] border-dashed border-lavender-300 bg-white/40',
                  done && 'ring-4 ring-mint-400',
                )}
              >
                <span className={cn('absolute top-2.5 left-3 flex h-7 w-7 items-center justify-center rounded-full text-sm font-black', item ? 'bg-brand-600 text-white' : 'bg-lavender-200 text-lavender-800')}>
                  {i + 1}
                </span>
                {item && (
                  <>
                    <LessonIcon name={item.icon} size="md" />
                    <span className="text-center text-sm leading-tight font-bold text-ink-900">{item.label}</span>
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      {status === 'asking' && pool.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {pool.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => place(o)}
              className="flex w-32 flex-col items-center gap-2 rounded-[1.75rem] bg-white p-4 ring-4 ring-transparent hover:ring-lavender-300 focus-visible:ring-brand-400 focus-visible:outline-none"
            >
              <LessonIcon name={o.icon} size="md" />
              <span className="text-center text-sm leading-tight font-bold text-ink-900">{o.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 flex min-h-12 flex-col items-center gap-4">
        <Feedback status={status} wrongOnce={attempts > 0} />
        {status === 'asking' && (
          <div className="flex flex-wrap justify-center gap-3">
            <HintButton onClick={hint} disabled={placed.length >= step.items.length} />
            <button
              type="button"
              onClick={check}
              disabled={placed.length !== step.items.length}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-600 px-8 text-lg font-extrabold text-white hover:bg-brand-700 disabled:opacity-35"
            >
              <Check size={22} strokeWidth={3} /> {t('play.check')}
            </button>
          </div>
        )}
      </div>
      {status !== 'asking' && <ContinueButton onClick={onNext} />}
    </div>
  )
}
