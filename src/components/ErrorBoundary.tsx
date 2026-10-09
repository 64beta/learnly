import { Component, type ReactNode } from 'react'
import i18n from '../i18n'
import { LogoMark } from './Layout'

/** Gözlənilməz render xətasında boş ekran əvəzinə izah və yenidən yükləmə düyməsi göstərir. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <LogoMark size={56} />
        <h1 className="mt-4 text-xl font-extrabold text-ink-900">{i18n.t('errors.generic')}</h1>
        <p className="mt-2 max-w-md text-sm text-ink-500">{this.state.error.message}</p>
        <button
          type="button"
          onClick={() => window.location.assign('/')}
          className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700"
        >
          {i18n.t('errors.goHome')}
        </button>
      </div>
    )
  }
}
