import { useTranslation } from 'react-i18next'
import { SKILL_ICON } from '../../content/lessons'
import { LessonIcon } from '../../content/icons'
import { pct, seconds } from '../../lib/format'
import { SKILL_CODES, type SkillStats } from '../../lib/types'
import { Card, cn } from '../../components/ui'
import { MoveRight, TrendingDown, TrendingUp } from 'lucide-react'

const TREND_STYLE = {
  up: { icon: <TrendingUp size={14} />, cls: 'bg-mint-50 text-mint-700 ring-mint-200' },
  down: { icon: <TrendingDown size={14} />, cls: 'bg-berry-50 text-berry-700 ring-berry-200' },
  flat: { icon: <MoveRight size={14} />, cls: 'bg-ink-100 text-ink-600 ring-ink-200' },
} as const

export function SkillStatsGrid({ stats }: { stats: SkillStats[] }) {
  const { t } = useTranslation()
  const byCode = new Map(stats.map((s) => [s.skill_code, s]))

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {SKILL_CODES.map((code) => {
        const s = byCode.get(code)
        const hasData = s && s.sessions_7d > 0
        const trend = TREND_STYLE[s?.trend ?? 'flat']
        return (
          <Card key={code} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-extrabold text-ink-800">
                <LessonIcon name={SKILL_ICON[code]} size="sm" />
                {t(`skills.${code}`)}
              </div>
              {hasData && s.accuracy_prev_7d !== null && (
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold ring-1', trend.cls)}>
                  {trend.icon} {t(`progress.trend.${s.trend}`)}
                </span>
              )}
            </div>
            {hasData ? (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-ink-900">{pct(s.accuracy_7d)}</span>
                  <span className="text-xs font-bold text-ink-500" title={t('progress.accuracyHelp')}>
                    {t('progress.accuracy')}
                  </span>
                </div>
                {s.accuracy_prev_7d !== null && (
                  <div className="text-xs text-ink-500">{t('progress.prev', { value: pct(s.accuracy_prev_7d) })}</div>
                )}
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-ink-100 pt-3 text-center">
                  <div>
                    <dt className="text-[11px] font-bold text-ink-400" title={t('progress.stuckHelp')}>
                      {t('progress.stuck')}
                    </dt>
                    <dd className={cn('text-sm font-extrabold', (s.stuck_rate_7d ?? 0) > 0.3 ? 'text-peach-600' : 'text-ink-700')}>
                      {pct(s.stuck_rate_7d)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-ink-400">{t('progress.response')}</dt>
                    <dd className="text-sm font-extrabold text-ink-700">{seconds(s.avg_response_ms_7d)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-ink-400">{t('progress.sessions')}</dt>
                    <dd className="text-sm font-extrabold text-ink-700">{s.sessions_7d}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="mt-4 text-sm text-ink-400">{t('progress.noData')}</p>
            )}
          </Card>
        )
      })}
    </div>
  )
}
