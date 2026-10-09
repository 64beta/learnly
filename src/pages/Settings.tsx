import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { LOCALES, changeLocale } from '../i18n'
import { updateLocale } from '../lib/api'
import type { Locale } from '../lib/types'
import { SetPinModal } from '../components/PinModal'
import { Alert, Button, Card, Field, InfoRow, PageHeader, Select } from '../components/ui'

const LOCALE_NAMES: Record<Locale, string> = { az: 'Azərbaycan dili', en: 'English', ru: 'Русский' }

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { profile, refreshProfile } = useAuth()
  const [pinOpen, setPinOpen] = useState(false)
  const [pinDone, setPinDone] = useState(false)

  if (!profile) return null

  const onLocale = async (l: Locale) => {
    changeLocale(l)
    await updateLocale(profile.id, l)
    await refreshProfile()
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('settings.title')} />
      <div className="space-y-5">
        <Card>
          <Field label={t('settings.language')} hint={t('settings.languageHelp')}>
            <Select value={i18n.language} onChange={(e) => void onLocale(e.target.value as Locale)}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </Select>
          </Field>
        </Card>

        {profile.role === 'parent' && (
          <Card>
            <h2 className="font-extrabold text-ink-900">{t('settings.pinTitle')}</h2>
            <p className="mt-1 mb-4 text-sm text-ink-600">{t('pin.setText')}</p>
            {pinDone && <Alert tone="mint" className="mb-4">{t('settings.pinSet')}</Alert>}
            <Button variant="secondary" onClick={() => setPinOpen(true)}>
              {t('pin.change')}
            </Button>
            <SetPinModal
              open={pinOpen}
              onClose={() => setPinOpen(false)}
              onDone={() => {
                setPinOpen(false)
                setPinDone(true)
              }}
            />
          </Card>
        )}

        <Card>
          <h2 className="mb-2 font-extrabold text-ink-900">{t('settings.account')}</h2>
          <dl className="divide-y divide-ink-100">
            <InfoRow label={t('auth.fullName')} value={profile.full_name || '—'} />
            <InfoRow label={t('auth.phone')} value={profile.phone || '—'} />
            <InfoRow label={t('auth.city')} value={profile.city || '—'} />
            {profile.parent_relation && <InfoRow label={t('auth.relation')} value={t(`auth.relations.${profile.parent_relation}`)} />}
          </dl>
        </Card>
      </div>
    </div>
  )
}
