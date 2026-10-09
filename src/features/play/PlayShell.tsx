import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { clearChildMode } from '../../lib/childMode'
import { VerifyPinModal } from '../../components/PinModal'

/** Uşaq rejiminin çərçivəsi: sakit fon, minimal elementlər, çıxış yalnız PIN ilə. */
export function PlayShell({ childId, children, top }: { childId: string; children: ReactNode; top?: ReactNode }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pinOpen, setPinOpen] = useState(false)

  return (
    <div className="relative min-h-screen overflow-hidden bg-lavender-50">
      {/* Sakit fon formaları (hərəkətsiz) */}
      <svg className="pointer-events-none absolute -top-24 -left-24 h-80 w-80" viewBox="0 0 200 200" aria-hidden>
        <circle cx="100" cy="100" r="100" fill="#b5b1d8" opacity="0.35" />
      </svg>
      <svg className="pointer-events-none absolute -right-20 -bottom-28 h-96 w-96" viewBox="0 0 200 200" aria-hidden>
        <path d="M0 200 A100 100 0 0 1 200 200 Z" fill="#78cdd0" opacity="0.3" />
      </svg>

      <div className="relative mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pt-5">
        <div className="min-w-0 flex-1">{top}</div>
        <button
          type="button"
          onClick={() => setPinOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-2 text-xs font-bold text-ink-500 ring-1 ring-lavender-200 hover:text-ink-800"
        >
          <Lock size={14} /> {t('play.exit')}
        </button>
      </div>
      <main className="relative mx-auto max-w-4xl px-4 py-8">{children}</main>
      <VerifyPinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={() => {
          clearChildMode()
          navigate(`/app/children/${childId}`, { replace: true })
        }}
      />
    </div>
  )
}
