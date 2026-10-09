import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher, Logo } from '../components/Layout'
import { LessonIcon } from '../content/icons'

/** Giriş/qeydiyyat çərçivəsi: solda Helvetia Blue panel (Wada №218 formaları), sağda forma. */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-600 p-10 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <circle cx="470" cy="190" r="150" fill="#b5b1d8" opacity="0.9" />
          <path d="M40 800 A260 260 0 0 1 560 800 Z" fill="#1d2140" opacity="0.35" />
          <circle cx="110" cy="330" r="56" fill="#fdbf68" />
          <rect x="430" y="420" width="96" height="96" rx="24" fill="#78cdd0" transform="rotate(12 478 468)" />
        </svg>
        <Logo light />
        <div className="relative mt-auto max-w-md">
          <div className="mb-6 flex gap-3">
            <span className="rounded-full bg-white p-1.5">
              <LessonIcon name="face-happy" size="sm" />
            </span>
            <span className="rounded-full bg-white p-1.5">
              <LessonIcon name="soap" size="sm" />
            </span>
            <span className="rounded-full bg-white p-1.5">
              <LessonIcon name="light-green" size="sm" />
            </span>
          </div>
          <p className="text-3xl leading-tight font-black">{t('landing.heroTitle')}</p>
          <p className="mt-4 text-white/85">{t('app.tagline')}</p>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex h-20 items-center justify-between px-6">
          <span className="lg:invisible">
            <Logo />
          </span>
          <LanguageSwitcher />
        </header>
        <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-12 lg:items-center">
          <div className="w-full max-w-md">
            <h1 className="mb-8 text-3xl font-black tracking-tight text-ink-900">{title}</h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
