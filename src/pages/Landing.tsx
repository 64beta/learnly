import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ChartLine, Gamepad2, HeartHandshake, ShieldCheck, TrendingUp } from 'lucide-react'
import { homePathFor, useAuth } from '../auth/AuthProvider'
import { LanguageSwitcher, Logo, LogoMark } from '../components/Layout'
import { buttonClass } from '../components/ui'
import { LessonIcon } from '../content/icons'

/** Hero kompozisiyası: Wada formaları üzərində məhsulun real kartları. */
function HeroArt() {
  const { t } = useTranslation()
  const bars = [38, 52, 47, 64, 70, 82]
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[480px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 480 480" aria-hidden>
        <circle cx="290" cy="215" r="165" fill="#b5b1d8" />
        <path d="M70 470 A175 175 0 0 1 420 470 Z" fill="#005b8d" />
        <circle cx="92" cy="96" r="42" fill="#fdbf68" />
        <rect x="16" y="318" width="74" height="74" rx="18" fill="#78cdd0" transform="rotate(-10 53 355)" />
        <circle cx="440" cy="70" r="12" fill="#70727c" opacity="0.4" />
      </svg>

      {/* Dərs kartı */}
      <div className="float-slow absolute top-[20%] left-[10%] w-[70%] rounded-3xl bg-white p-5 shadow-xl shadow-brand-900/15">
        <div className="flex items-center gap-3">
          <LessonIcon name="meal" size="sm" />
          <p className="text-sm font-extrabold text-ink-900 sm:text-base">{t('landing.mockPrompt')}</p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(['hands', 'tv', 'toy'] as const).map((k, i) => (
            <div key={k} className={`flex justify-center rounded-2xl p-2.5 ${i === 0 ? 'ring-3 ring-mint-400' : 'ring-1 ring-ink-100'}`}>
              <LessonIcon name={k} size="md" />
            </div>
          ))}
        </div>
      </div>

      {/* İrəliləyiş kartı */}
      <div className="absolute right-0 bottom-[12%] w-[50%] rounded-3xl bg-white p-4 shadow-xl shadow-brand-900/15">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-500">{t('landing.mockWeek')}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-xs font-extrabold text-mint-800">
            <TrendingUp size={14} /> 82%
          </span>
        </div>
        <div className="mt-1 text-sm font-extrabold text-ink-900">{t('skills.hygiene')}</div>
        <div className="mt-3 flex h-16 items-end gap-1.5">
          {bars.map((h, i) => (
            <div key={i} className={`flex-1 rounded-t-md ${i === bars.length - 1 ? 'bg-brand-600' : 'bg-lavender-300'}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const { t } = useTranslation()
  const { session, profile } = useAuth()

  const features = [
    { icon: <Gamepad2 size={26} />, bg: 'bg-mint-100', fg: 'text-mint-800', title: t('landing.f1Title'), text: t('landing.f1Text') },
    { icon: <ChartLine size={26} />, bg: 'bg-peach-100', fg: 'text-peach-800', title: t('landing.f2Title'), text: t('landing.f2Text') },
    { icon: <HeartHandshake size={26} />, bg: 'bg-lavender-200', fg: 'text-lavender-900', title: t('landing.f3Title'), text: t('landing.f3Text') },
  ]
  const steps = [t('landing.how1'), t('landing.how2'), t('landing.how3')]
  const stepColors = ['bg-brand-600 text-white', 'bg-lavender-400 text-lavender-900', 'bg-peach-400 text-peach-900']

  return (
    <div className="dot-grid min-h-screen overflow-x-hidden">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {session && profile ? (
            <Link to={homePathFor(profile)} className={buttonClass('primary', 'sm')}>
              {t('nav.dashboard')}
            </Link>
          ) : (
            <Link to="/login" className={buttonClass('secondary', 'sm')}>
              {t('nav.login')}
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-lavender-100 px-3.5 py-1.5 text-sm font-bold text-lavender-900">
            <span className="h-2 w-2 rounded-full bg-brand-600" />
            {t('landing.kicker')}
          </span>
          <h1 className="mt-5 text-4xl leading-[1.08] font-black tracking-tight text-ink-900 sm:text-6xl">{t('landing.heroTitle')}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-700">{t('landing.heroText')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register?role=parent" className={buttonClass('primary', 'lg')}>
              {t('landing.ctaParent')} <ArrowRight size={18} />
            </Link>
            <Link to="/register?role=teacher" className={buttonClass('secondary', 'lg')}>
              {t('landing.ctaTeacher')}
            </Link>
          </div>
        </div>
        <HeroArt />
      </section>

      {/* Modullar */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-3xl bg-white p-7 ring-1 ring-ink-200/70">
              <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${f.bg} ${f.fg}`}>{f.icon}</span>
              <h2 className="mt-5 text-xl font-extrabold text-ink-900">{f.title}</h2>
              <p className="mt-2 leading-relaxed text-ink-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Necə işləyir */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-3xl font-black tracking-tight text-ink-900">{t('landing.howTitle')}</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step} className="relative">
              <span className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-black ${stepColors[i]}`}>{i + 1}</span>
              <p className="mt-4 text-lg font-bold text-ink-800">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Məxfilik */}
      <section className="relative overflow-hidden bg-brand-600 text-white">
        <svg className="pointer-events-none absolute -top-16 -right-16 h-72 w-72" viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="90" fill="#b5b1d8" opacity="0.25" />
        </svg>
        <svg className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64" viewBox="0 0 200 200" aria-hidden>
          <path d="M0 200 A100 100 0 0 1 200 200 Z" fill="#78cdd0" opacity="0.25" />
        </svg>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 md:flex-row md:items-center">
          <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck size={32} />
          </span>
          <div>
            <h2 className="text-2xl font-black">{t('landing.privacyTitle')}</h2>
            <p className="mt-2 max-w-3xl text-lg leading-relaxed text-white/90">{t('landing.privacyText')}</p>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-10 text-sm text-ink-500 sm:flex-row">
        <span className="flex items-center gap-2 font-bold text-ink-700">
          <LogoMark size={22} /> Learnly
        </span>
        <span className="text-center">{t('landing.disclaimer')} {t('landing.footer')}</span>
      </footer>
    </div>
  )
}
