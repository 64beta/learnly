import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useErrorText } from '../lib/useErrorText'
import type { ParentRelation, Role } from '../lib/types'
import { Alert, Button, Field, Input, Select, cn } from '../components/ui'
import { AuthShell } from './AuthShell'
import { GraduationCap, Users } from 'lucide-react'

const RELATIONS: ParentRelation[] = ['mother', 'father', 'guardian', 'relative', 'consultant']

export default function Register() {
  const { t, i18n } = useTranslation()
  const errorText = useErrorText()
  const [params] = useSearchParams()
  const [role, setRole] = useState<Role>(params.get('role') === 'teacher' ? 'teacher' : 'parent')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [relation, setRelation] = useState<ParentRelation>('mother')
  const [error, setError] = useState<string | null>(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          city: city.trim() || null,
          parent_relation: role === 'parent' ? relation : null,
          locale: i18n.language,
        },
      },
    })
    setBusy(false)
    if (err) return setError(errorText(err))
    // E-poçt təsdiqi aktivdirsə sessiya qayıtmır
    if (!data.session) setNeedsConfirm(true)
  }

  if (needsConfirm) {
    return (
      <AuthShell title={t('auth.registerTitle')}>
        <Alert tone="mint">{t('auth.confirmEmail')}</Alert>
        <Link to="/login" className="mt-6 block text-center font-bold text-brand-700">
          {t('nav.login')}
        </Link>
      </AuthShell>
    )
  }

  const roleCard = (value: Role, icon: ReactNode, title: string, hint: string) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      aria-pressed={role === value}
      className={cn(
        'flex-1 rounded-2xl p-4 text-left ring-2 transition-colors',
        role === value ? 'bg-brand-50 ring-brand-500' : 'bg-white ring-ink-200 hover:ring-ink-300',
      )}
    >
      <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl', role === value ? 'bg-brand-600 text-white' : 'bg-lavender-100 text-lavender-800')}>
        {icon}
      </span>
      <div className="mt-2 font-extrabold text-ink-900">{title}</div>
      <div className="mt-1 text-xs text-ink-500">{hint}</div>
    </button>
  )

  return (
    <AuthShell title={t('auth.registerTitle')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <div className="mb-2 text-sm font-bold text-ink-700">{t('auth.roleQuestion')}</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {roleCard('parent', <Users size={24} />, t('auth.roleParent'), t('auth.roleParentHint'))}
            {roleCard('teacher', <GraduationCap size={24} />, t('auth.roleTeacher'), t('auth.roleTeacherHint'))}
          </div>
        </div>
        <Field label={t('auth.fullName')} required>
          <Input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        {role === 'parent' && (
          <Field label={t('auth.relation')}>
            <Select value={relation} onChange={(e) => setRelation(e.target.value as ParentRelation)}>
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {t(`auth.relations.${r}`)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t('auth.email')} required>
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t('auth.password')} hint={t('auth.passwordHint')} required>
          <Input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>{t('auth.phone')} <span className="font-normal text-ink-400">({t('common.optional')})</span></>}>
            <Input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label={<>{t('auth.city')} <span className="font-normal text-ink-400">({t('common.optional')})</span></>}>
            <Input autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
        </div>
        {error && <Alert tone="berry">{error}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {t('auth.submitRegister')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-600">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-bold text-brand-700 hover:underline">
          {t('nav.login')}
        </Link>
      </p>
    </AuthShell>
  )
}
