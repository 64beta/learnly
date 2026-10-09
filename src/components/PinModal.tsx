import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, Lock } from 'lucide-react'
import { setChildPin, verifyChildPin } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useErrorText } from '../lib/useErrorText'
import { Alert, Button, Field, Input, Modal, cn } from './ui'

/**
 * 4 xanalı PIN sahəsi. Real input şəffafdır və xanaların üstündədir:
 * yazmaq, yapışdırmaq və mobil rəqəm klaviaturası işləyir.
 * type="password" istifadə olunmur ki, şifrə meneceri əlavələri sahəyə müdaxilə etməsin.
 */
function PinField({ value, onChange, autoFocus, label }: { value: string; onChange: (v: string) => void; autoFocus?: boolean; label: string }) {
  const { t } = useTranslation()
  const [warn, setWarn] = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <div className="relative mx-auto w-fit">
        <div className="flex gap-3" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                'flex h-16 w-14 items-center justify-center rounded-2xl ring-2 transition-colors',
                i < value.length ? 'bg-brand-50 ring-brand-500' : focused && i === value.length ? 'bg-white ring-brand-400' : 'bg-white ring-ink-200',
              )}
            >
              {i < value.length && <span className="h-4 w-4 rounded-full bg-ink-900" />}
            </span>
          ))}
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
          aria-label={label}
          autoFocus={autoFocus}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value
            setWarn(/[^\d\s]/.test(raw))
            onChange(raw.replace(/\D/g, '').slice(0, 4))
          }}
          className="absolute inset-0 h-full w-full cursor-text rounded-2xl text-transparent caret-transparent opacity-0"
        />
      </div>
      {warn && <p className="mt-2 text-center text-xs font-bold text-peach-800">{t('pin.digitsOnly')}</p>}
    </div>
  )
}

/** Yeni PIN təyin etmək (iki dəfə daxil edilir). */
export function SetPinModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const [pin, setPin] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{4}$/.test(pin)) return setError(t('pin.invalid'))
    if (pin !== repeat) return setError(t('pin.mismatch'))
    setBusy(true)
    try {
      await setChildPin(pin)
      setPin('')
      setRepeat('')
      setError(null)
      onDone()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('pin.setTitle')}>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-ink-600">{t('pin.setText')}</p>
        <div>
          <div className="mb-2 text-center text-sm font-bold text-ink-800">{t('pin.pin')}</div>
          <PinField value={pin} onChange={setPin} autoFocus label={t('pin.pin')} />
        </div>
        <div>
          <div className="mb-2 text-center text-sm font-bold text-ink-800">{t('pin.repeat')}</div>
          <PinField value={repeat} onChange={setRepeat} label={t('pin.repeat')} />
        </div>
        {error && <Alert tone="berry">{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={busy} disabled={pin.length !== 4 || repeat.length !== 4}>
            {t('pin.confirm')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/** Uşaq rejimindən çıxmaq üçün PIN yoxlaması (və ya hesab şifrəsi ilə ehtiyat çıxış). */
export function VerifyPinModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const [pin, setPin] = useState('')
  const [password, setPassword] = useState('')
  const [forgot, setForgot] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const checking = useRef(false)

  const reset = () => {
    setPin('')
    setPassword('')
    setForgot(false)
    setError(null)
  }

  const verify = async (value: string) => {
    if (checking.current) return
    checking.current = true
    setBusy(true)
    setError(null)
    try {
      if (await verifyChildPin(value)) {
        reset()
        onSuccess()
      } else {
        setError(t('pin.wrong'))
        setPin('')
      }
    } catch (err) {
      setError(errorText(err))
    } finally {
      checking.current = false
      setBusy(false)
    }
  }

  // 4 rəqəm daxil edilən kimi avtomatik yoxla
  useEffect(() => {
    if (open && !forgot && pin.length === 4) void verify(pin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, open, forgot])

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getUser()
      const email = data.user?.email
      if (!email) throw new Error('forbidden')
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      reset()
      onSuccess()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const close = () => {
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={
        <span className="inline-flex items-center gap-2">
          <Lock size={20} className="text-brand-600" /> {t('pin.enterTitle')}
        </span>
      }
    >
      {!forgot ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pin.length === 4) void verify(pin)
          }}
          className="space-y-5"
        >
          <p className="text-sm text-ink-600">{t('pin.enterText')}</p>
          <PinField value={pin} onChange={setPin} autoFocus label={t('pin.pin')} />
          {error && <Alert tone="berry">{error}</Alert>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setForgot(true)
                setError(null)
              }}
              className="text-sm font-bold text-brand-700 hover:underline"
            >
              {t('pin.forgot')}
            </button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={close}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={busy} disabled={pin.length !== 4}>
                {t('pin.confirm')}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={submitPassword} className="space-y-4">
          <p className="text-sm text-ink-600">{t('pin.forgotHelp')}</p>
          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <KeyRound size={14} /> {t('pin.accountPassword')}
              </span>
            }
          >
            <Input type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <Alert tone="berry">{error}</Alert>}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setForgot(false)
                setError(null)
              }}
              className="text-sm font-bold text-brand-700 hover:underline"
            >
              {t('pin.backToPin')}
            </button>
            <Button type="submit" loading={busy} disabled={!password}>
              {t('pin.confirm')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
