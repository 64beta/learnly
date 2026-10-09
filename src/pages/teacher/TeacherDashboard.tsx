import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { getTeacherProfile, listTeacherRequests, type TeacherRequestRow } from '../../lib/api'
import { ageInYears, formatDate } from '../../lib/format'
import { RequestStatusBadge } from '../../features/child/ChildTabs'
import { Alert, Avatar, Badge, Card, EmptyState, PageHeader, PageSpinner, buttonClass } from '../../components/ui'
import { HeartHandshake, Inbox, Sprout } from 'lucide-react'

function RequestItem({ r }: { r: TeacherRequestRow }) {
  const { t, i18n } = useTranslation()
  const c = r.children
  return (
    <li>
      <Link to={`/t/requests/${r.id}`} className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-200 transition hover:ring-brand-300">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar name={c?.first_name ?? '?'} />
            <span className="font-extrabold text-ink-900">{c?.first_name ?? '—'}</span>
            {c && <span className="text-sm text-ink-500">{t('child.ageYears', { age: ageInYears(c.birth_date) })}</span>}
          </div>
          <RequestStatusBadge status={r.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {c && <Badge tone="lavender">{t(`child.diagnosisStatus.${c.diagnosis_status}`)}</Badge>}
          {c?.support_level && <Badge tone="brand">{t('child.supportLevelN', { level: c.support_level })}</Badge>}
        </div>
        {r.message && <p className="mt-2 line-clamp-2 text-sm text-ink-600">“{r.message}”</p>}
        <p className="mt-2 text-xs text-ink-400">
          {t('teacher.parent')}: {r.parent?.full_name ?? '—'} · {formatDate(r.created_at, i18n.language)}
        </p>
      </Link>
    </li>
  )
}

export default function TeacherDashboard() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const requests = useQuery({ queryKey: ['teacher-requests'], queryFn: listTeacherRequests })
  const me = useQuery({ queryKey: ['teacher', profile?.id], queryFn: () => getTeacherProfile(profile!.id), enabled: Boolean(profile) })

  if (requests.isLoading) return <PageSpinner />
  const all = requests.data ?? []
  const pending = all.filter((r) => r.status === 'pending')
  const active = all.filter((r) => r.status === 'accepted')
  const history = all.filter((r) => !['pending', 'accepted'].includes(r.status))
  const incomplete = me.data && (me.data.specializations.length === 0 || !me.data.bio)

  return (
    <div>
      <PageHeader title={t('teacher.dashboardTitle')} subtitle={profile?.full_name} />
      {incomplete && (
        <Alert tone="peach" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{t('teacher.profileHint')}</span>
          <Link to="/t/profile" className={buttonClass('primary', 'sm')}>
            {t('teacher.completeProfile')}
          </Link>
        </Alert>
      )}
      {requests.error && <Alert tone="berry" className="mb-4">{(requests.error as Error).message}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-ink-900">
            <Inbox size={20} className="text-brand-600" /> {t('teacher.pending')} {pending.length > 0 && <Badge tone="peach">{pending.length}</Badge>}
          </h2>
          {pending.length === 0 ? <EmptyState icon={<Inbox size={28} />} title={t('teacher.noPending')} /> : <ul className="space-y-3">{pending.map((r) => <RequestItem key={r.id} r={r} />)}</ul>}
        </section>
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-ink-900"><HeartHandshake size={20} className="text-mint-600" /> {t('teacher.active')}</h2>
          {active.length === 0 ? <EmptyState icon={<Sprout size={28} />} title={t('teacher.noActive')} /> : <ul className="space-y-3">{active.map((r) => <RequestItem key={r.id} r={r} />)}</ul>}
        </section>
      </div>

      {history.length > 0 && (
        <Card className="mt-8">
          <h2 className="mb-3 font-extrabold text-ink-700">{t('teacher.history')}</h2>
          <ul className="divide-y divide-ink-100">
            {history.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-semibold text-ink-700">{r.children?.first_name ?? '—'}</span>
                <RequestStatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
