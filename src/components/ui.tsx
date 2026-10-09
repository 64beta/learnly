import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { X } from 'lucide-react'

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'soft'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-white text-ink-800 ring-1 ring-ink-200 hover:ring-ink-300 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
  danger: 'bg-berry-600 text-white hover:bg-berry-700',
  success: 'bg-mint-600 text-white hover:bg-mint-700',
  soft: 'bg-lavender-100 text-lavender-900 hover:bg-lavender-200',
}
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    extra,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner small />}
      {children}
    </button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-3xl bg-white p-6 ring-1 ring-ink-200/70', className)}>{children}</div>
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-bold text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-berry-600">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-bold text-berry-600">{error}</span>}
    </label>
  )
}

const inputClass =
  'block w-full rounded-2xl border-0 bg-white px-4 py-3 text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500 focus:outline-none'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, 'min-h-24', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClass, 'pr-8', className)} {...rest}>
      {children}
    </select>
  )
}

export function Checkbox({ label, checked, onChange, className }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-ink-300 accent-brand-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-ink-800">{label}</span>
    </label>
  )
}

export type Tone = 'ink' | 'brand' | 'mint' | 'peach' | 'berry' | 'lavender'
const TONES: Record<Tone, string> = {
  ink: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  mint: 'bg-mint-50 text-mint-800 ring-1 ring-mint-200',
  peach: 'bg-peach-50 text-peach-800 ring-1 ring-peach-200',
  berry: 'bg-berry-50 text-berry-700 ring-1 ring-berry-200',
  lavender: 'bg-lavender-50 text-lavender-800 ring-1 ring-lavender-200',
}

export function Badge({ tone = 'ink', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', TONES[tone], className)}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'mint' | 'peach' }) {
  const color = tone === 'mint' ? 'bg-mint-500' : tone === 'peach' ? 'bg-peach-500' : 'bg-brand-600'
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-lavender-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Spinner({ small }: { small?: boolean }) {
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', small ? 'h-4 w-4' : 'h-8 w-8 text-brand-600')}
      aria-hidden
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

export function Alert({ tone = 'brand', children, className }: { tone?: 'brand' | 'peach' | 'berry' | 'mint' | 'lavender'; children: ReactNode; className?: string }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-900 ring-brand-200',
    peach: 'bg-peach-50 text-peach-900 ring-peach-200',
    berry: 'bg-berry-50 text-berry-800 ring-berry-200',
    mint: 'bg-mint-50 text-mint-900 ring-mint-200',
    lavender: 'bg-lavender-50 text-lavender-900 ring-lavender-200',
  }
  return <div className={cn('rounded-2xl px-4 py-3 text-sm ring-1', tones[tone], className)}>{children}</div>
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-4 sm:items-center" onClick={onClose}>
      <div className="pop-in w-full max-w-md rounded-3xl bg-white p-6" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-extrabold text-ink-900">{title}</h2>
          <button type="button" onClick={onClose} className="-m-1 rounded-full p-1 text-ink-500 hover:bg-ink-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="inline-flex min-w-max gap-1 rounded-full bg-lavender-100/70 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors',
              tab.id === active ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Seçim çipləri. `multi` olmadıqda tək seçimdir və eyni çipə toxunmaq seçimi ləğv edir. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  multi,
}: {
  options: { value: T; label: ReactNode }[]
  value: T[]
  onChange: (value: T[]) => void
  multi?: boolean
}) {
  const toggle = (v: T) => {
    if (multi) onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
    else onChange(value.includes(v) ? [] : [v])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            aria-pressed={on}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ring-1 transition-colors',
              on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-700 ring-ink-200 hover:ring-ink-300',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function IconBubble({ children, tone = 'brand', size = 'md' }: { children: ReactNode; tone?: Tone; size?: 'sm' | 'md' | 'lg' }) {
  const tones: Record<Tone, string> = {
    ink: 'bg-ink-100 text-ink-700',
    brand: 'bg-brand-100 text-brand-700',
    mint: 'bg-mint-100 text-mint-700',
    peach: 'bg-peach-100 text-peach-800',
    berry: 'bg-berry-100 text-berry-700',
    lavender: 'bg-lavender-100 text-lavender-800',
  }
  const sizes = { sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-16 w-16' }
  return <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full', tones[tone], sizes[size])}>{children}</span>
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-lavender-300 bg-white/60 px-6 py-12 text-center">
      <IconBubble tone="lavender" size="lg">
        {icon}
      </IconBubble>
      <h3 className="mt-4 text-lg font-extrabold text-ink-900">{title}</h3>
      {text && <p className="mt-1 max-w-md text-sm text-ink-600">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-ink-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function InfoRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm font-bold text-ink-500">{label}</dt>
      <dd className="text-sm whitespace-pre-line text-ink-900">{value}</dd>
    </div>
  )
}

/** Addan baş hərflər və sabit rəng (emoji avatar əvəzinə). */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const palette = ['bg-brand-600 text-white', 'bg-lavender-400 text-lavender-900', 'bg-mint-500 text-white', 'bg-peach-400 text-peach-900', 'bg-violet-500 text-white']
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-2xl font-extrabold',
        palette[hash % palette.length],
        size === 'lg' ? 'h-16 w-16 text-2xl' : 'h-12 w-12 text-lg',
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/** Arxa planda dekorativ həndəsi formalar (Wada №218 palitrası). */
export function Shapes({ className }: { className?: string }) {
  return (
    <svg className={cn('pointer-events-none absolute', className)} viewBox="0 0 400 400" aria-hidden>
      <circle cx="300" cy="90" r="70" fill="#b5b1d8" opacity="0.55" />
      <path d="M40 360 A120 120 0 0 1 280 360 Z" fill="#005b8d" opacity="0.08" />
      <circle cx="90" cy="120" r="18" fill="#fdbf68" opacity="0.8" />
      <rect x="320" y="250" width="56" height="56" rx="14" fill="#78cdd0" opacity="0.45" transform="rotate(14 348 278)" />
    </svg>
  )
}
