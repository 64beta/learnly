import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cancelRequest, listParentRequests } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { useErrorText } from '../../lib/useErrorText'
import { RequestStatusBadge } from '../../features/child/ChildTabs'
import { Alert, Button, Card, EmptyState, PageHeader, PageSpinner, buttonClass } from '../../components/ui'
import { HeartHandshake, Lock, LockOpen, Phone, Users } from 'lucide-react'

export default function ParentRequests() {
  const { t, i18n } = useTranslation()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['requests', 'all'], queryFn: () => listParentRequests() })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onCancel = async (id: string) => {
    if (!window.confirm(t('requests.confirmCancel'))) return
    setBusyId(id)
    setError(null)
    try {
      await cancelRequest(id)
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div>
      <PageHeader
        title={t('requests.title')}
        actions={
          <Link to="/app/teachers" className={buttonClass('primary')}>
            <Users size={18} /> {t('parent.findTeacher')}
          </Link>
        }
      />
      {error && <Alert tone="berry" className="mb-4">{error}</Alert>}
      {!data?.length ? (
        <EmptyState icon={<HeartHandshake size={28} />} title={t('requests.empty')} />
      ) : (
        <ul className="space-y-3">
          {data.map((r) => {
            const active = r.status === 'pending' || r.status === 'accepted'
            return (
              <li key={r.id}>
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/app/teachers/${r.teacher_id}`} className="font-extrabold text-ink-900 hover:underline">
                        {r.teacher?.display_name ?? '—'}
                      </Link>
                      <RequestStatusBadge status={r.status} />
                    </div>
                    <div className="mt-1 text-sm text-ink-500">
                      {t('requests.child')}: <span className="font-bold text-ink-700">{r.children?.first_name ?? '—'}</span> ·{' '}
                      {t('requests.sentAt')}: {formatDate(r.created_at, i18n.language)}
                    </div>
                    {r.status === 'accepted' && r.teacher?.profile?.phone && (
                      <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-mint-700">
                        <Phone size={14} /> {t('requests.contact')}: {r.teacher.profile.phone}
                      </div>
                    )}
                    <div className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500">{active ? <><LockOpen size={12} /> {t('requests.accessOpen')}</> : <><Lock size={12} /> {t('requests.accessClosed')}</>}</div>
                  </div>
                  {active && (
                    <Button variant="secondary" size="sm" loading={busyId === r.id} onClick={() => void onCancel(r.id)}>
                      {r.status === 'pending' ? t('requests.cancel') : t('requests.end')}
                    </Button>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
