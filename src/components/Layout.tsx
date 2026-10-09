import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import { homePathFor, useAuth } from '../auth/AuthProvider'
import { LOCALES, LOCALE_LABEL, changeLocale } from '../i18n'
import { updateLocale } from '../lib/api'
import type { Locale } from '../lib/types'
import { cn } from './ui'

export function LanguageSwitcher({ dark }: { dark?: boolean }) {
  const { i18n, t } = useTranslation()
  const { profile } = useAuth()
  const pick = (l: Locale) => {
    changeLocale(l)
    if (profile) void updateLocale(profile.id, l)
  }
  return (
    <div className={cn('flex items-center gap-0.5 rounded-full p-1', dark ? 'bg-white/10' : 'bg-lavender-100/80')} aria-label={t('nav.language')}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-extrabold transition-colors',
            i18n.language === l
              ? dark
                ? 'bg-white text-brand-700'
                : 'bg-white text-brand-700 shadow-sm'
              : dark
                ? 'text-white/70 hover:text-white'
                : 'text-ink-500 hover:text-ink-900',
          )}
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </div>
  )
}

/** Learnly işarəsi: dörd həndəsi parça (Wada №218 rəngləri). */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M2 16 A14 14 0 0 1 16 2 V16 Z" fill="#005b8d" />
      <rect x="17" y="2" width="13" height="13" rx="3.5" fill="#b5b1d8" />
      <circle cx="9" cy="23.5" r="6.5" fill="#fdbf68" />
      <path d="M17 17 H30 A13 13 0 0 1 17 30 Z" fill="#099197" />
    </svg>
  )
}

export function Logo({ to = '/', light }: { to?: string; light?: boolean }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5 text-xl font-extrabold tracking-tight', light ? 'text-white' : 'text-ink-900')}>
      <LogoMark />
      Learnly
    </Link>
  )
}

export function AppLayout() {
  const { t } = useTranslation()
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const links =
    profile?.role === 'teacher'
      ? [
          { to: '/t', label: t('nav.dashboard'), end: true },
          { to: '/t/profile', label: t('nav.myProfile') },
          { to: '/settings', label: t('nav.settings') },
        ]
      : [
          { to: '/app', label: t('nav.dashboard'), end: true },
          { to: '/app/teachers', label: t('nav.teachers') },
          { to: '/app/requests', label: t('nav.requests') },
          { to: '/settings', label: t('nav.settings') },
        ]

  const onSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-lavender-200/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo to={homePathFor(profile)} />
          <nav className="hidden items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-lavender-200 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn('rounded-full px-4 py-1.5 text-sm font-bold transition-colors', isActive ? 'bg-brand-600 text-white' : 'text-ink-700 hover:bg-lavender-100')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <span className="max-w-40 truncate text-sm font-bold text-ink-600">{profile?.full_name}</span>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full p-2 text-ink-500 hover:bg-berry-50 hover:text-berry-600"
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
          <button type="button" className="rounded-full p-2 text-ink-800 hover:bg-lavender-100 md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {open && (
          <div className="border-t border-lavender-200 bg-paper px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => cn('rounded-2xl px-4 py-3 font-bold', isActive ? 'bg-brand-600 text-white' : 'text-ink-800')}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-lavender-200 pt-3">
              <LanguageSwitcher />
              <button type="button" onClick={onSignOut} className="inline-flex items-center gap-1.5 font-bold text-berry-600">
                <LogOut size={16} /> {t('nav.logout')}
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
