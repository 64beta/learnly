import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listChildren } from '../../lib/api'
import { computeCompleteness } from '../../lib/completeness'
import { ageInYears } from '../../lib/format'
import { useStartChildMode } from '../../features/child/useStartChildMode'
import { Alert, Avatar, Badge, Button, Card, EmptyState, PageHeader, PageSpinner, ProgressBar, buttonClass } from '../../components/ui'
import { Baby, Play, Plus, Users } from 'lucide-react'

export default function ParentDashboard() {
  const { t } = useTranslation()
  const { data: children, isLoading, error } = useQuery({ queryKey: ['children'], queryFn: listChildren })
  const childMode = useStartChildMode()

  if (isLoading) return <PageSpinner />

  return (
    <div>
      <PageHeader
        title={t('parent.dashboardTitle')}
        subtitle={t('parent.dashboardSubtitle')}
        actions={
          <>
            <Link to="/app/teachers" className={buttonClass('secondary')}>
              <Users size={18} /> {t('parent.findTeacher')}
            </Link>
            <Link to="/app/children/new" className={buttonClass('primary')}>
              <Plus size={18} /> {t('parent.addChild')}
            </Link>
          </>
        }
      />
      {error && <Alert tone="berry" className="mb-4">{String((error as Error).message)}</Alert>}

      {!children?.length ? (
        <EmptyState
          icon={<Baby size={30} />}
          title={t('parent.noChildrenTitle')}
          text={t('parent.noChildrenText')}
          action={
            <Link to="/app/children/new" className={buttonClass('primary', 'lg')}>
              <Plus size={18} /> {t('parent.addChild')}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => {
            const c = computeCompleteness(child, child.medical_opinions.length)
            return (
              <Card key={child.id} className="flex flex-col">
                <div className="flex items-start gap-4">
                  <Avatar name={child.first_name} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-ink-900">{child.first_name}</h2>
                    <p className="text-sm text-ink-500">{t('child.ageYears', { age: ageInYears(child.birth_date) })}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone="lavender">{t(`child.diagnosisStatus.${child.diagnosis_status}`)}</Badge>
                      {child.support_level && <Badge tone="brand">{t('child.supportLevelN', { level: child.support_level })}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-1.5 text-xs font-bold text-ink-500">{t('parent.completeness', { percent: c.percent })}</div>
                  <ProgressBar value={c.percent} tone={c.percent === 100 ? 'mint' : 'brand'} />
                </div>
                <div className="mt-5 flex gap-2 pt-1">
                  <Link to={`/app/children/${child.id}`} className={buttonClass('secondary', 'md', 'flex-1')}>
                    {t('parent.profile')}
                  </Link>
                  <Button variant="success" className="flex-1" loading={childMode.checking} onClick={() => void childMode.start(child.id)}>
                    <Play size={18} /> {t('parent.play')}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {childMode.modal}
    </div>
  )
}
