import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChildProfileView } from '../../features/child/ChildProfileView'
import { useStartChildMode } from '../../features/child/useStartChildMode'
import { Button, buttonClass } from '../../components/ui'
import { ArrowLeft, NotebookPen, Pencil, Play } from 'lucide-react'

export default function ChildDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const childMode = useStartChildMode()
  if (!id) return null

  return (
    <>
      <Link to="/app" className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
        <ArrowLeft size={16} /> {t('parent.dashboardTitle')}
      </Link>
      <ChildProfileView
        childId={id}
        readOnly={false}
        onStartChildMode={() => void childMode.start(id)}
        actions={
          <>
            <Button variant="success" loading={childMode.checking} onClick={() => void childMode.start(id)}>
              <Play size={18} /> {t('child.childMode')}
            </Button>
            <Link to={`/app/children/${id}/observe`} className={buttonClass('secondary')}>
              <NotebookPen size={18} /> {t('child.observe')}
            </Link>
            <Link to={`/app/children/${id}/edit`} className={buttonClass('ghost')}>
              <Pencil size={18} /> {t('child.editProfile')}
            </Link>
          </>
        }
      />
      {childMode.modal}
    </>
  )
}
