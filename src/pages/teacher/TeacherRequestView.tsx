import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getTeacherRequest, respondToRequest } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { useErrorText } from '../../lib/useErrorText'
import { ChildProfileView } from '../../features/child/ChildProfileView'
import { RequestStatusBadge } from '../../features/child/ChildTabs'
import { Alert, Button, Card, InfoRow, PageSpinner } from '../../components/ui'
import { ArrowLeft, Check, Eye, Lock, ShieldCheck } from 'lucide-react'

export default function TeacherRequestView() {
  const { t, i18n } = useTranslation()
  const errorText = useErrorText()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const req = useQuery({ queryKey: ['teacher-request', id], queryFn: () => getTeacherRequest(id!), enabled: Boolean(id) })
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (req.isLoading) return <PageSpinner />
  const r = req.data
  if (!r) return <Alert tone="berry">{t('errors.notFound')}</Alert>
  const active = r.status === 'pending' || r.status === 'accepted'

  const respond = async (accept: boolean) => {
    if (!accept && !window.confirm(t('teacher.confirmReject'))) return
    setBusy(accept ? 'accept' : 'reject')
    setError(null)
    try {
      await respondToRequest(r.id, accept)
      void queryClient.invalidateQueries({ queryKey: ['teacher-request', id] })
      void queryClient.invalidateQueries({ queryKey: ['teacher-requests'] })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <Link to="/t" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
        <ArrowLeft size={16} /> {t('teacher.dashboardTitle')}
      </Link>

      <Card className="mt-4 mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <RequestStatusBadge status={r.status} />
              <span className="text-sm text-ink-500">{formatDate(r.created_at, i18n.language)}</span>
            </div>
            <dl className="mt-3 divide-y divide-ink-100">
              <InfoRow
                label={t('teacher.parent')}
                value={
                  r.parent
                    ? `${r.parent.full_name}${r.parent.parent_relation ? ` (${t(`auth.relations.${r.parent.parent_relation}`)})` : ''}`
                    : '—'
                }
              />
              {r.parent?.phone && <InfoRow label={t('auth.phone')} value={r.parent.phone} />}
              {r.parent?.city && <InfoRow label={t('auth.city')} value={r.parent.city} />}
              {r.message && <InfoRow label={t('market.message')} value={r.message} />}
            </dl>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-mint-700"><ShieldCheck size={14} /> {t('teacher.consentGiven', { date: formatDate(r.consent_at, i18n.language) })}</p>
          </div>
          {r.status === 'pending' && (
            <div className="flex gap-2">
              <Button variant="secondary" loading={busy === 'reject'} disabled={busy !== null} onClick={() => void respond(false)}>
                {t('teacher.reject')}
              </Button>
              <Button variant="success" loading={busy === 'accept'} disabled={busy !== null} onClick={() => void respond(true)}>
                <Check size={18} /> {t('teacher.accept')}
              </Button>
            </div>
          )}
        </div>
        {error && <Alert tone="berry" className="mt-4">{error}</Alert>}
      </Card>

      {active ? (
        <>
          <Alert tone="brand" className="mb-6"><span className="inline-flex items-center gap-1.5"><Eye size={16} /> {t('teacher.readOnly')}</span></Alert>
          <ChildProfileView childId={r.child_id} readOnly />
        </>
      ) : (
        <Alert tone="peach"><span className="inline-flex items-center gap-1.5"><Lock size={16} /> {t('teacher.accessClosed')}</span></Alert>
      )}
    </div>
  )
}
