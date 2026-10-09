export function ageInYears(birthDate: string, now = new Date()): number {
  const b = new Date(birthDate)
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return Math.max(0, age)
}

export function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export function seconds(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—'
  return `${(ms / 1000).toFixed(1)} s`
}

export function formatDate(iso: string | null | undefined, locale = 'az'): string {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  const tag = locale === 'az' ? 'az-Latn-AZ' : locale === 'ru' ? 'ru-RU' : 'en-GB'
  try {
    return d.toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

export function todayIso(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function errorMessage(err: unknown): string {
  if (!err) return ''
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return String(err)
}
