import { useTranslation } from 'react-i18next'
import { LESSONS, SKILL_COLOR } from '../../content/lessons'
import { formatDate } from '../../lib/format'
import type { AiReport, Locale, SkillCode } from '../../lib/types'
import { Alert, Badge, Card } from '../../components/ui'
import { BookOpen, Eye, House, Stethoscope, TrendingUp } from 'lucide-react'

function SkillLabel({ skill }: { skill: string }) {
  const { t } = useTranslation()
  const color = SKILL_COLOR[skill as SkillCode]
  return (
    <span className="inline-flex items-center gap-2">
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
      {t(`skills.${skill}`, { defaultValue: skill })}
    </span>
  )
}

export function ReportView({ report }: { report: AiReport }) {
  const { t, i18n } = useTranslation()
  const o = report.output
  const lang = i18n.language as Locale

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span>
          {t('ai.generatedAt')}: {formatDate(report.created_at, lang)}
        </span>
        <span>·</span>
        <span>
          {formatDate(report.period_start, lang)} – {formatDate(report.period_end, lang)}
        </span>
        {report.model && (
          <>
            <span>·</span>
            <span>
              {t('ai.model')}: {report.model}
            </span>
          </>
        )}
        {report.status === 'fallback' && <Badge tone="peach">{t('ai.fallbackBadge')}</Badge>}
      </div>

      {o.specialist_flag?.needed && (
        <Alert tone="peach">
          <div className="flex items-center gap-2 font-extrabold"><Stethoscope size={18} /> {t('ai.specialistTitle')}</div>
          <ul className="mt-1 list-disc pl-5">
            {o.specialist_flag.reasons.map((r) => (
              <li key={r}>{t(`ai.specialistReasons.${r}`, { defaultValue: r })}</li>
            ))}
          </ul>
          {o.specialist_note && <p className="mt-2">{o.specialist_note}</p>}
        </Alert>
      )}

      <Card>
        <h3 className="mb-2 font-extrabold text-ink-900">{t('ai.summary')}</h3>
        <p className="leading-relaxed whitespace-pre-line text-ink-700">{o.summary}</p>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-extrabold text-mint-800"><TrendingUp size={18} /> {t('ai.strengths')}</h3>
          <ul className="space-y-3">
            {o.strengths.map((s, i) => (
              <li key={i} className="text-sm">
                <div className="font-bold text-ink-800"><SkillLabel skill={s.skill} /></div>
                <p className="text-ink-600">{s.evidence}</p>
              </li>
            ))}
            {o.strengths.length === 0 && <li className="text-sm text-ink-400">—</li>}
          </ul>
        </Card>
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-extrabold text-peach-800"><Eye size={18} /> {t('ai.attention')}</h3>
          <ul className="space-y-3">
            {o.attention_areas.map((a, i) => (
              <li key={i} className="text-sm">
                <div className="font-bold text-ink-800"><SkillLabel skill={a.skill} /></div>
                <p className="text-ink-600">{a.evidence}</p>
                {a.why_it_matters && (
                  <p className="mt-1 text-xs text-ink-500">
                    <span className="font-bold">{t('ai.why')}:</span> {a.why_it_matters}
                  </p>
                )}
              </li>
            ))}
            {o.attention_areas.length === 0 && <li className="text-sm text-ink-400">—</li>}
          </ul>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-extrabold text-ink-900"><House size={18} className="text-brand-600" /> {t('ai.activities')}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {o.home_activities.map((a, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-extrabold text-ink-800">{a.title}</h4>
                <Badge tone="brand">
                  {a.duration_min} {t('common.minutes')}
                </Badge>
              </div>
              <div className="mt-1 text-xs font-bold text-ink-400"><SkillLabel skill={a.related_skill} /></div>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-600">
                {a.steps.map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </div>

      {o.next_lessons.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-extrabold text-ink-900"><BookOpen size={18} className="text-brand-600" /> {t('ai.nextLessons')}</h3>
          <div className="flex flex-wrap gap-2">
            {o.next_lessons.map((slug) => {
              const lesson = LESSONS.find((l) => l.slug === slug)
              return (
                <Badge key={slug} tone="lavender" className="px-3 py-1 text-sm">
                  {lesson ? (lesson.title[lang] ?? lesson.title.az) : slug}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-ink-400">{t('ai.disclaimer')}</p>
    </div>
  )
}
