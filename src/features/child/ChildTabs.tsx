import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { LESSONS } from '../../content/lessons'
import { clearDemoHistory, generateReport, seedDemoHistory, type ParentRequestRow } from '../../lib/api'
import { buildLocalFallbackReport } from '../../lib/localReport'
import { ITEM_STEP, type Completeness } from '../../lib/completeness'
import { formatDate, pct } from '../../lib/format'
import { useErrorText } from '../../lib/useErrorText'
import type { AiReport, ChildWithRelations, Locale, Observation, SessionSummary, SkillStats } from '../../lib/types'
import { Alert, Badge, Button, Card, EmptyState, InfoRow, buttonClass } from '../../components/ui'
import { AccuracyChart } from './AccuracyChart'
import { ReportView } from './ReportView'
import { SkillStatsGrid } from './SkillStatsGrid'
import { ArrowRight, ChevronDown, ChevronUp, ClipboardList, CloudLightning, CloudMoon, FlaskConical, Gamepad2, HeartHandshake, Moon, NotebookPen, Play, Plus, Stethoscope, Users, Zap } from 'lucide-react'
import { Face } from '../../content/art'

const MOOD_FACE = { good: 'happy', neutral: 'neutral', bad: 'sad' } as const
const SLEEP_ICON = { good: Moon, ok: CloudMoon, bad: CloudLightning } as const

export function OverviewTab({
  child,
  stats,
  latestReport,
  completeness,
  readOnly,
  onOpenTab,
  onStartChildMode,
}: {
  child: ChildWithRelations
  stats: SkillStats[]
  latestReport: AiReport | undefined
  completeness: Completeness
  readOnly: boolean
  onOpenTab: (tab: 'ai' | 'progress') => void
  onStartChildMode: () => void
}) {
  const { t, i18n } = useTranslation()
  const sessions7d = stats.reduce((a, s) => a + s.sessions_7d, 0)
  const withAcc = stats.filter((s) => s.accuracy_7d !== null && s.sessions_7d > 0)
  const avgAcc = withAcc.length ? withAcc.reduce((a, s) => a + Number(s.accuracy_7d), 0) / withAcc.length : null
  const lastActivity = stats.map((s) => s.last_activity_at).filter(Boolean).sort().at(-1) ?? null
  const totalSessions = stats.reduce((a, s) => a + s.total_sessions, 0)

  return (
    <div className="space-y-6">
      {!readOnly && completeness.missing.length > 0 && (
        <Alert tone="brand">
          <div className="font-bold">{t('child.missingTitle')}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {completeness.missing.map((m) => (
              <Link
                key={m}
                to={`/app/children/${child.id}/edit?step=${ITEM_STEP[m]}`}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
              >
                <Plus size={14} /> {t(`child.missing.${m}`)}
              </Link>
            ))}
          </div>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs font-bold text-ink-500">{t('child.sessions7d')}</div>
          <div className="mt-1 text-3xl font-extrabold text-ink-900">{sessions7d}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-bold text-ink-500">{t('child.avgAccuracy')}</div>
          <div className="mt-1 text-3xl font-extrabold text-ink-900">{pct(avgAcc)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-bold text-ink-500">{t('child.lastActivity')}</div>
          <div className="mt-2 text-lg font-extrabold text-ink-900">{formatDate(lastActivity, i18n.language)}</div>
        </Card>
      </div>

      {totalSessions === 0 ? (
        <EmptyState
          icon={<Gamepad2 size={28} />}
          title={t('child.noActivityTitle')}
          text={readOnly ? undefined : t('child.noActivityText')}
          action={
            readOnly ? undefined : (
              <Button variant="success" size="lg" onClick={onStartChildMode}>
                <Play size={18} /> {t('child.childMode')}
              </Button>
            )
          }
        />
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold text-ink-900">{t('progress.title')}</h2>
            <button type="button" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline" onClick={() => onOpenTab('progress')}>
              {t('common.view')} <ArrowRight size={14} />
            </button>
          </div>
          <SkillStatsGrid stats={stats} />
        </div>
      )}

      {latestReport && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-extrabold text-ink-900"><ClipboardList size={20} className="text-brand-600" /> {t('ai.title')}</h2>
            <button type="button" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline" onClick={() => onOpenTab('ai')}>
              {t('common.view')} <ArrowRight size={14} />
            </button>
          </div>
          <p className="mt-2 line-clamp-3 text-ink-700">{latestReport.output.summary}</p>
        </Card>
      )}

      {!readOnly && <DemoBox childId={child.id} hasSessions={totalSessions > 0} />}
    </div>
  )
}

function DemoBox({ childId, hasSessions }: { childId: string; hasSessions: boolean }) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const invalidate = () => {
    for (const key of ['stats', 'summaries', 'observations']) void queryClient.invalidateQueries({ queryKey: [key, childId] })
  }
  const seed = useMutation({
    mutationFn: () => seedDemoHistory(childId),
    onSuccess: (count) => {
      setMessage(t('child.demoCreated', { count }))
      invalidate()
    },
  })
  const clear = useMutation({ mutationFn: () => clearDemoHistory(childId), onSuccess: invalidate })

  return (
    <div className="rounded-2xl border-2 border-dashed border-peach-200 bg-peach-50/50 p-5">
      <div className="flex items-center gap-2 font-extrabold text-peach-900">
        <FlaskConical size={18} /> {t('child.demoTitle')} <Badge tone="peach">{t('common.demo')}</Badge>
      </div>
      <p className="mt-1 text-sm text-peach-900/80">{t('child.demoText')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" loading={seed.isPending} onClick={() => seed.mutate()}>
          {t('child.demoCreate')}
        </Button>
        {hasSessions && (
          <Button variant="ghost" size="sm" loading={clear.isPending} onClick={() => clear.mutate()}>
            {t('child.demoClear')}
          </Button>
        )}
      </div>
      {message && <p className="mt-2 text-sm font-bold text-mint-700">{message}</p>}
      {(seed.error || clear.error) && <Alert tone="berry" className="mt-2">{errorText(seed.error ?? clear.error)}</Alert>}
    </div>
  )
}

function SleepLabel({ sleep }: { sleep: 'good' | 'ok' | 'bad' }) {
  const { t } = useTranslation()
  const Icon = SLEEP_ICON[sleep]
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-600" title={t('observe.sleep')}>
      <Icon size={16} /> {t(`observe.sleeps.${sleep}`)}
    </span>
  )
}

export function ProgressTab({ stats, summaries }: { stats: SkillStats[]; summaries: SessionSummary[] }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Locale
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 font-extrabold text-ink-900">{t('progress.title')}</h2>
        <SkillStatsGrid stats={stats} />
      </div>
      {summaries.length > 0 && (
        <>
          <Card>
            <h2 className="mb-3 font-extrabold text-ink-900">{t('progress.chartTitle')}</h2>
            <AccuracyChart summaries={summaries} />
          </Card>
          <Card className="overflow-x-auto p-0">
            <h2 className="px-5 pt-5 font-extrabold text-ink-900">{t('progress.recentTitle')}</h2>
            <table className="mt-3 w-full min-w-[560px] text-left text-sm">
              <thead className="border-y border-ink-100 bg-ink-50 text-xs text-ink-500">
                <tr>
                  <th className="px-5 py-2">{t('progress.lesson')}</th>
                  <th className="px-3 py-2">{t('progress.date')}</th>
                  <th className="px-3 py-2">{t('progress.accuracy')}</th>
                  <th className="px-3 py-2">{t('progress.stuck')}</th>
                  <th className="px-3 py-2">{t('progress.hints')}</th>
                  <th className="px-3 py-2">{t('progress.duration')}</th>
                </tr>
              </thead>
              <tbody>
                {summaries.slice(0, 20).map((s) => {
                  const lesson = LESSONS.find((l) => l.slug === s.lesson_slug)
                  return (
                    <tr key={s.session_id} className="border-b border-ink-100 last:border-0">
                      <td className="px-5 py-2.5 font-semibold text-ink-800">
                        {lesson ? (lesson.title[lang] ?? lesson.title.az) : s.lesson_slug}
                      </td>
                      <td className="px-3 py-2.5 text-ink-500">{formatDate(s.completed_at, lang)}</td>
                      <td className="px-3 py-2.5 font-bold">{pct(Number(s.accuracy))}</td>
                      <td className="px-3 py-2.5">
                        {s.stuck_count}/{s.step_count}
                      </td>
                      <td className="px-3 py-2.5">{s.hints_used}</td>
                      <td className="px-3 py-2.5 text-ink-500">
                        {Math.max(1, Math.round(s.duration_s / 60))} {t('common.minutes')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}

export function AiTab({ childId, reports, readOnly }: { childId: string; reports: AiReport[]; readOnly: boolean }) {
  const { t, i18n } = useTranslation()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const [openId, setOpenId] = useState<string | null>(null)
  const [localReport, setLocalReport] = useState<AiReport | null>(null)
  const gen = useMutation({
    mutationFn: async () => {
      try {
        return await generateReport(childId, i18n.language as Locale)
      } catch (e) {
        // AI funksiyası əlçatan deyil → eyni məntiqlə rəqəmlərə əsaslanan hesabat (yadda saxlanmır)
        if (e instanceof Error && e.message === 'function_unavailable') return buildLocalFallbackReport(childId, i18n.language as Locale)
        throw e
      }
    },
    onSuccess: (report) => {
      setOpenId(null)
      if (report.id.startsWith('local-')) {
        setLocalReport(report)
      } else {
        setLocalReport(null)
        void queryClient.invalidateQueries({ queryKey: ['reports', childId] })
      }
    },
  })
  const [savedLatest, ...savedOlder] = reports
  const latest = localReport ?? savedLatest
  const older = localReport ? reports : savedOlder

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink-900"><ClipboardList size={22} className="text-brand-600" /> {t('ai.title')}</h2>
          <p className="text-sm text-ink-500">{t('ai.subtitle')}</p>
        </div>
        {readOnly ? (
          <p className="text-sm text-ink-400">{t('ai.teacherReadOnly')}</p>
        ) : (
          <Button size="lg" loading={gen.isPending} onClick={() => gen.mutate()}>
            {gen.isPending ? t('ai.generating') : t('ai.generate')}
          </Button>
        )}
      </div>
      {gen.error && <Alert tone="berry">{errorText(gen.error)}</Alert>}
      {localReport && <Alert tone="lavender">{t('ai.localFallback')}</Alert>}
      {!latest ? (
        <EmptyState icon={<ClipboardList size={28} />} title={t('ai.empty')} />
      ) : (
        <ReportView report={latest} />
      )}
      {older.length > 0 && (
        <div>
          <h3 className="mb-2 font-extrabold text-ink-700">{t('ai.history')}</h3>
          <ul className="space-y-2">
            {older.map((r) => (
              <li key={r.id} className="rounded-xl bg-white ring-1 ring-ink-200">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  aria-expanded={openId === r.id}
                >
                  <span className="text-sm font-bold text-ink-700">{formatDate(r.created_at, i18n.language)}</span>
                  <span className="line-clamp-1 flex-1 text-sm text-ink-500">{r.output.summary}</span>
                  <span aria-hidden>{openId === r.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                </button>
                {openId === r.id && (
                  <div className="border-t border-ink-100 p-4">
                    <ReportView report={r} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function HealthTab({ child }: { child: ChildWithRelations }) {
  const { t, i18n } = useTranslation()
  const none = <span className="text-ink-400">{t('common.notSet')}</span>
  const sensoryEntries = Object.entries(child.sensory ?? {}) as [keyof typeof child.sensory, string][]

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="mb-2 font-extrabold text-ink-900">{t('child.diagnosisSection')}</h2>
        <dl className="divide-y divide-ink-100">
          <InfoRow label={t('wizard.diagnosisStatus')} value={t(`child.diagnosisStatus.${child.diagnosis_status}`)} />
          <InfoRow label={t('wizard.supportLevel')} value={child.support_level ? t('child.supportLevelN', { level: child.support_level }) : none} />
          <InfoRow label={t('child.diagnosisDate')} value={child.diagnosis_date ? formatDate(child.diagnosis_date, i18n.language) : none} />
          <InfoRow label={t('child.diagnosedBy')} value={child.diagnosed_by || none} />
          <InfoRow label={t('child.icd')} value={child.icd_code || none} />
        </dl>
      </Card>
      <Card>
        <h2 className="mb-3 font-extrabold text-ink-900">{t('child.conditionsSection')}</h2>
        {child.child_conditions.length === 0 ? (
          <p className="text-sm text-ink-400">{t('child.noConditions')}</p>
        ) : (
          <ul className="space-y-2">
            {child.child_conditions.map((c) => (
              <li key={c.condition_code} className="text-sm">
                <span className="font-bold text-ink-800">{t(`conditions.${c.condition_code}`)}</span>{' '}
                <Badge tone={c.status === 'confirmed' ? 'lavender' : 'peach'}>
                  {c.status === 'confirmed' ? t('wizard.confirmed') : t('wizard.suspected')}
                </Badge>
                {c.note && <p className="text-ink-500">{c.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h2 className="mb-2 font-extrabold text-ink-900">{t('child.healthSection')}</h2>
        <dl className="divide-y divide-ink-100">
          <InfoRow label={t('child.chronic')} value={child.chronic_conditions || none} />
          <InfoRow label={t('child.allergies')} value={child.allergies || none} />
          <InfoRow label={t('child.medications')} value={child.medications || none} />
        </dl>
      </Card>
      <Card>
        <h2 className="mb-2 font-extrabold text-ink-900">{t('child.dailySection')}</h2>
        <dl className="divide-y divide-ink-100">
          <InfoRow
            label={t('wizard.communication')}
            value={child.communication_level ? t(`child.communication.${child.communication_level}`) : none}
          />
          <InfoRow label={t('child.aac')} value={child.uses_aac ? t('common.yes') : t('common.no')} />
          <InfoRow
            label={t('child.sensory')}
            value={
              sensoryEntries.length
                ? sensoryEntries.map(([k, v]) => `${t(`child.sensoryKeys.${k}`)}: ${t(`child.sensoryLevels.${v}`)}`).join('\n')
                : none
            }
          />
          <InfoRow label={t('child.interests')} value={child.interests.length ? child.interests.join(', ') : none} />
          <InfoRow
            label={t('child.therapies')}
            value={child.current_therapies.length ? child.current_therapies.map((x) => t(`therapies.${x}`, { defaultValue: x })).join(', ') : none}
          />
        </dl>
      </Card>
    </div>
  )
}

export function OpinionsTab({ child, readOnly }: { child: ChildWithRelations; readOnly: boolean }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end">
          <Link to={`/app/children/${child.id}/edit?step=4`} className={buttonClass('primary')}>
            <Plus size={16} /> {t('wizard.addOpinion')}
          </Link>
        </div>
      )}
      {child.medical_opinions.length === 0 ? (
        <EmptyState icon={<Stethoscope size={28} />} title={t('wizard.noOpinions')} />
      ) : (
        child.medical_opinions.map((o) => (
          <Card key={o.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-ink-900">{formatDate(o.opinion_date, i18n.language)}</span>
              {o.specialty && <Badge tone="brand">{t(`specialties.${o.specialty}`, { defaultValue: o.specialty })}</Badge>}
              {o.doctor_name && <span className="text-sm text-ink-600">{o.doctor_name}</span>}
              {o.institution && <span className="text-sm text-ink-400">· {o.institution}</span>}
            </div>
            <dl className="mt-3 divide-y divide-ink-100">
              {o.diagnosis_text && <InfoRow label={t('wizard.diagnosisText')} value={o.diagnosis_text} />}
              <InfoRow label={t('wizard.opinionText')} value={o.opinion_text} />
              {o.recommendations && <InfoRow label={t('wizard.recommendations')} value={o.recommendations} />}
              {o.next_visit_date && <InfoRow label={t('wizard.nextVisit')} value={formatDate(o.next_visit_date, i18n.language)} />}
            </dl>
          </Card>
        ))
      )}
    </div>
  )
}

export function ObservationsTab({ childId, observations, readOnly }: { childId: string; observations: Observation[]; readOnly: boolean }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end">
          <Link to={`/app/children/${childId}/observe`} className={buttonClass('primary')}>
            <NotebookPen size={16} /> {t('observe.add')}
          </Link>
        </div>
      )}
      {observations.length === 0 ? (
        <EmptyState icon={<NotebookPen size={28} />} title={t('observe.listEmpty')} />
      ) : (
        <ul className="space-y-3">
          {observations.map((o) => (
            <li key={o.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-extrabold text-ink-900">{formatDate(o.observed_on, i18n.language)}</span>
                  {o.mood && (
                    <span className="inline-flex items-center gap-1.5 text-sm" title={t('observe.mood')}>
                      <Face kind={MOOD_FACE[o.mood]} size={22} /> {t(`observe.moods.${o.mood}`)}
                    </span>
                  )}
                  {o.sleep && (
                    <SleepLabel sleep={o.sleep} />
                  )}
                  {o.meltdown && <Badge tone="berry"><Zap size={12} /> {t('observe.meltdown')}</Badge>}
                  {o.is_demo && <Badge tone="peach">{t('common.demo')}</Badge>}
                </div>
                {o.meltdown_note && <p className="mt-2 text-sm text-berry-800">{o.meltdown_note}</p>}
                {o.free_text && <p className="mt-2 text-sm text-ink-700">{o.free_text}</p>}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const STATUS_TONE = { pending: 'peach', accepted: 'mint', rejected: 'berry', cancelled: 'ink', ended: 'ink' } as const

export function RequestStatusBadge({ status }: { status: keyof typeof STATUS_TONE }) {
  const { t } = useTranslation()
  return <Badge tone={STATUS_TONE[status]}>{t(`requests.status.${status}`)}</Badge>
}

export function TeachersTab({ requests }: { requests: ParentRequestRow[] }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/app/teachers" className={buttonClass('primary')}>
          <Users size={16} /> {t('parent.findTeacher')}
        </Link>
      </div>
      {requests.length === 0 ? (
        <EmptyState icon={<HeartHandshake size={28} />} title={t('requests.empty')} />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-extrabold text-ink-900">{r.teacher?.display_name ?? '—'}</div>
                  <div className="text-xs text-ink-500">
                    {t('requests.sentAt')}: {formatDate(r.created_at, i18n.language)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RequestStatusBadge status={r.status} />
                  <span className="text-xs text-ink-500">
                    {r.status === 'pending' || r.status === 'accepted' ? t('requests.accessOpen') : t('requests.accessClosed')}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink-500">
        <Link to="/app/requests" className="font-bold text-brand-700 hover:underline">
          {t('parent.myRequests')} <ArrowRight size={12} className="inline" />
        </Link>
      </p>
    </div>
  )
}
