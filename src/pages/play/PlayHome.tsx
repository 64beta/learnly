import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BookOpen, Gamepad2 } from 'lucide-react'
import { LESSONS, SKILL_TONE, type Lesson } from '../../content/lessons'
import { LessonIcon } from '../../content/icons'
import { getChild } from '../../lib/api'
import type { Locale } from '../../lib/types'
import { PlayShell } from '../../features/play/PlayShell'
import { PageSpinner, cn } from '../../components/ui'

const TILE_BG = {
  mint: 'bg-mint-100 hover:bg-mint-200',
  peach: 'bg-peach-100 hover:bg-peach-200',
  violet: 'bg-violet-100 hover:brightness-95',
  brand: 'bg-brand-100 hover:bg-brand-200',
  lavender: 'bg-lavender-100 hover:bg-lavender-200',
  berry: 'bg-berry-100',
  ink: 'bg-ink-100',
} as const

function LessonTile({ lesson, childId, lang }: { lesson: Lesson; childId: string; lang: Locale }) {
  return (
    <Link
      to={`/play/${childId}/${lesson.slug}`}
      className={cn(
        'group flex flex-col items-center gap-4 rounded-[2rem] p-6 text-center transition-colors focus-visible:ring-4 focus-visible:ring-brand-400 focus-visible:outline-none',
        TILE_BG[SKILL_TONE[lesson.skill]],
      )}
    >
      <span className="rounded-full bg-white p-2 shadow-sm">
        <LessonIcon name={lesson.icon} size="lg" />
      </span>
      <span className="text-lg leading-snug font-extrabold text-ink-900">{lesson.title[lang] ?? lesson.title.az}</span>
    </Link>
  )
}

export default function PlayHome() {
  const { t, i18n } = useTranslation()
  const { childId } = useParams()
  const child = useQuery({ queryKey: ['child', childId], queryFn: () => getChild(childId!), enabled: Boolean(childId) })
  if (!childId) return null
  if (child.isLoading) return <PageSpinner />

  const lang = i18n.language as Locale
  const lessons = LESSONS.filter((l) => l.kind === 'lesson')
  const games = LESSONS.filter((l) => l.kind === 'game')

  return (
    <PlayShell childId={childId}>
      <h1 className="text-center text-4xl font-black tracking-tight text-ink-900">{t('play.hello', { name: child.data?.first_name ?? '' })}</h1>
      <p className="mt-2 text-center text-xl text-ink-600">{t('play.choose')}</p>

      <h2 className="mt-10 mb-4 flex items-center gap-2 text-xl font-extrabold text-ink-800">
        <BookOpen size={22} className="text-brand-600" /> {t('play.lessons')}
      </h2>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {lessons.map((l) => (
          <LessonTile key={l.slug} lesson={l} childId={childId} lang={lang} />
        ))}
      </div>

      <h2 className="mt-10 mb-4 flex items-center gap-2 text-xl font-extrabold text-ink-800">
        <Gamepad2 size={22} className="text-violet-500" /> {t('play.games')}
      </h2>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {games.map((l) => (
          <LessonTile key={l.slug} lesson={l} childId={childId} lang={lang} />
        ))}
      </div>
    </PlayShell>
  )
}
