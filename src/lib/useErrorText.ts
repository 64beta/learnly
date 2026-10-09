import { useTranslation } from 'react-i18next'
import { errorMessage } from './format'

/** RPC xəta kodlarını (məs. "consent_required") tərcümə olunmuş mətnə çevirir. */
export function useErrorText() {
  const { t, i18n } = useTranslation()
  return (err: unknown): string => {
    const raw = errorMessage(err)
    if (!raw) return t('errors.generic')
    if (/invalid login credentials/i.test(raw)) return t('errors.invalidLogin')
    const code = raw.match(/^[a-z_]+$/)?.[0]
    if (code && i18n.exists(`errors.${code}`)) return t(`errors.${code}`)
    return raw
  }
}
