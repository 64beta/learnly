import { useEffect, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  getChild,
  getSkillStats,
  listObservations,
  listParentRequests,
  listReports,
  listSummaries,
  refreshChildStats,
} from '../../lib/api'
import { computeCompleteness } from '../../lib/completeness'
import { ageInYears } from '../../lib/format'
import { Alert, Avatar, Badge, PageSpinner, ProgressBar, Tabs } from '../../components/ui'
import { AiTab, HealthTab, ObservationsTab, OpinionsTab, OverviewTab, ProgressTab, TeachersTab } from './ChildTabs'

const TAB_IDS = ['overview', 'progress', 'ai', 'health', 'opinions', 'observations', 'teachers'] as const
type TabId = (typeof TAB_IDS)[number]

/**
 * Uşaq profilinin tam görünüşü. Valideyn üçün redaktə imkanları ilə,
 * müəllim üçün isə (readOnly) yalnız oxumaq rejimində istifadə olunur.
 */
export function ChildProfileView({
  childId,
  readOnly,
  actions,
  onStartChildMode,
}: {
  childId: string
  readOnly: boolean
  actions?: ReactNode
  onStartChildMode?: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab') as TabId | null
  const tabs = TAB_IDS.filter((id) => !(readOnly && id === 'teachers'))
  const tab: TabId = tabParam && tabs.includes(tabParam) ? tabParam : 'overview'

  const child = useQuery({ queryKey: ['child', childId], queryFn: () => getChild(childId) })
  const stats = useQuery({ queryKey: ['stats', childId], queryFn: () => getSkillStats(childId) })
  const summaries = useQuery({ queryKey: ['summaries', childId], queryFn: () => listSummaries(childId, 14) })
  const observations = useQuery({ queryKey: ['observations', childId], queryFn: () => listObservations(childId) })
  const reports = useQuery({ queryKey: ['reports', childId], queryFn: () => listReports(childId) })
  const requests = useQuery({
    queryKey: ['requests', childId],
    queryFn: () => listParentRequests(childId),
    enabled: !readOnly,
  })

  // 7 günlük pəncərələr köhnəlməsin deyə statistikanı yeniləyirik (yalnız valideyn edə bilər)
  useEffect(() => {
    if (readOnly) return
    refreshChildStats(childId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['stats', childId] }))
      .catch(() => undefined)
  }, [childId, readOnly, queryClient])

  if (child.isLoading) return <PageSpinner />
  if (!child.data) return <Alert tone="berry">{t('child.notFound')}</Alert>

  const c = child.data
  const completeness = computeCompleteness(c, c.medical_opinions.length)
  const openTab = (id: TabId) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={c.first_name} size="lg" />
          <div>
            <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{c.first_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
              <span>{t('child.ageYears', { age: ageInYears(c.birth_date) })}</span>
              <Badge tone="lavender">{t(`child.diagnosisStatus.${c.diagnosis_status}`)}</Badge>
              {c.support_level && <Badge tone="brand">{t('child.supportLevelN', { level: c.support_level })}</Badge>}
              {c.child_conditions.slice(0, 3).map((x) => (
                <Badge key={x.condition_code}>{t(`conditions.${x.condition_code}`)}</Badge>
              ))}
            </div>
            {!readOnly && (
              <div className="mt-3 w-64">
                <div className="mb-1 text-xs font-bold text-ink-500">{t('parent.completeness', { percent: completeness.percent })}</div>
                <ProgressBar value={completeness.percent} tone={completeness.percent === 100 ? 'mint' : 'brand'} />
              </div>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <Tabs tabs={tabs.map((id) => ({ id, label: t(`child.tabs.${id}`) }))} active={tab} onChange={openTab} />

      <div className="pt-6">
        {tab === 'overview' && (
          <OverviewTab
            child={c}
            stats={stats.data ?? []}
            latestReport={reports.data?.[0]}
            completeness={completeness}
            readOnly={readOnly}
            onOpenTab={openTab}
            onStartChildMode={() => onStartChildMode?.()}
          />
        )}
        {tab === 'progress' && <ProgressTab stats={stats.data ?? []} summaries={summaries.data ?? []} />}
        {tab === 'ai' && <AiTab childId={childId} reports={reports.data ?? []} readOnly={readOnly} />}
        {tab === 'health' && <HealthTab child={c} />}
        {tab === 'opinions' && <OpinionsTab child={c} readOnly={readOnly} />}
        {tab === 'observations' && <ObservationsTab childId={childId} observations={observations.data ?? []} readOnly={readOnly} />}
        {tab === 'teachers' && !readOnly && <TeachersTab requests={requests.data ?? []} />}
      </div>
    </div>
  )
}
