import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { buttonClass } from '../components/ui'
import { Compass } from 'lucide-react'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-lavender-100 text-lavender-800">
        <Compass size={40} />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold">{t('errors.notFound')}</h1>
      <Link to="/" className={buttonClass('primary', 'md', 'mt-6')}>
        {t('errors.goHome')}
      </Link>
    </div>
  )
}
