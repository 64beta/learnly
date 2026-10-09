import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useErrorText } from '../lib/useErrorText'
import { Alert, Button, Field, Input } from '../components/ui'
import { AuthShell } from './AuthShell'

export default function Login() {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    // Uğurlu girişdən sonra RedirectIfAuthed istifadəçini öz panelinə aparır
    if (err) setError(errorText(err))
  }

  return (
    <AuthShell title={t('auth.loginTitle')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t('auth.email')}>
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t('auth.password')}>
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <Alert tone="berry">{error}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {t('auth.submitLogin')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-600">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-bold text-brand-700 hover:underline">
          {t('nav.register')}
        </Link>
      </p>
    </AuthShell>
  )
}
