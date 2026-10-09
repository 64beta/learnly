// Dərslər üçün sadə, vahid stilli SVG illüstrasiyalar (emoji əvəzinə).
// Rənglər Wada №218 palitrasından və onun cütlərindəndir.

const INK = '#2c2e4c'
const P = {
  blue: '#005b8d',
  lavender: '#b5b1d8',
  plumbeous: '#70727c',
  sea: '#099197',
  calamine: '#78cdd0',
  cream: '#fdbf68',
  khaki: '#bc892b',
  lake: '#802626',
  aconite: '#a36aa5',
}

export type FaceKind = 'happy' | 'sad' | 'angry' | 'scared' | 'sleepy' | 'neutral'

/** Emosiya üzü. Autizmli uşaqlar üçün ifadələr aydın və şişirdilmiş çəkilib. */
export function Face({ kind, size = 64 }: { kind: FaceKind; size?: number }) {
  const mouth: Record<FaceKind, string> = {
    happy: 'M20 38 Q32 50 44 38',
    sad: 'M21 46 Q32 36 43 46',
    angry: 'M22 45 Q32 39 42 45',
    scared: '',
    sleepy: 'M27 43 Q32 46 37 43',
    neutral: 'M23 42 L41 42',
  }
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <circle cx="32" cy="32" r="28" fill={P.cream} />
      <circle cx="32" cy="32" r="28" fill="none" stroke={P.khaki} strokeWidth="2" opacity="0.5" />
      {kind === 'sleepy' ? (
        <>
          <path d="M18 27 Q22 30 26 27" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M38 27 Q42 30 46 27" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="22" cy="27" r={kind === 'scared' ? 4.5 : 3.5} fill={INK} />
          <circle cx="42" cy="27" r={kind === 'scared' ? 4.5 : 3.5} fill={INK} />
        </>
      )}
      {kind === 'angry' && (
        <>
          <path d="M15 18 L27 23" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M49 18 L37 23" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === 'sad' && (
        <>
          <path d="M16 21 L26 18" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M48 21 L38 18" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M44 33 q2 5 0 7 q-2 -2 0 -7" fill={P.calamine} />
        </>
      )}
      {kind === 'scared' && (
        <>
          <path d="M16 17 Q22 13 27 17" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M37 17 Q42 13 48 17" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="32" cy="44" rx="6" ry="7" fill={INK} />
        </>
      )}
      {kind === 'happy' && (
        <>
          <circle cx="15" cy="37" r="4" fill={P.lake} opacity="0.18" />
          <circle cx="49" cy="37" r="4" fill={P.lake} opacity="0.18" />
        </>
      )}
      {mouth[kind] && <path d={mouth[kind]} stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />}
    </svg>
  )
}

export type Light = 'red' | 'yellow' | 'green' | 'all'

/** Svetofor; seçilmiş işıq yanır, qalanları sönükdür. */
export function TrafficLight({ on, size = 64 }: { on: Light; size?: number }) {
  const lamp = (cy: number, color: string, lit: boolean) => (
    <circle cx="32" cy={cy} r="8.5" fill={lit ? color : '#4a4c66'} opacity={lit ? 1 : 0.55} />
  )
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect x="18" y="4" width="28" height="56" rx="10" fill={INK} />
      {lamp(16, '#d94a3d', on === 'red' || on === 'all')}
      {lamp(32, P.cream, on === 'yellow' || on === 'all')}
      {lamp(48, '#3fb27f', on === 'green' || on === 'all')}
    </svg>
  )
}

export function Germs({ size = 64 }: { size?: number }) {
  const germ = (x: number, y: number, r: number, c: string) => (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4
        return <line key={i} x1={Math.cos(a) * r} y1={Math.sin(a) * r} x2={Math.cos(a) * (r + 4)} y2={Math.sin(a) * (r + 4)} stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      })}
      <circle r={r} fill={c} />
      <circle cx={-r / 3} cy={-r / 4} r={r / 5} fill="white" />
      <circle cx={r / 3} cy={-r / 4} r={r / 5} fill="white" />
    </g>
  )
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      {germ(22, 24, 10, P.sea)}
      {germ(44, 40, 8, P.aconite)}
      {germ(20, 48, 5, P.khaki)}
    </svg>
  )
}

export function Toothbrush({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect x="10" y="38" width="44" height="9" rx="4.5" fill={P.blue} transform="rotate(-30 32 42)" />
      <g transform="rotate(-30 32 42)">
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={36 + i * 3} y="27" width="2" height="11" rx="1" fill={P.lavender} />
        ))}
      </g>
      <circle cx="47" cy="17" r="3" fill={P.calamine} />
      <circle cx="53" cy="23" r="2" fill={P.calamine} />
    </svg>
  )
}

export function Crosswalk({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect x="4" y="10" width="56" height="44" rx="8" fill={P.plumbeous} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={10 + i * 10.5} y="16" width="6" height="32" rx="2" fill="white" />
      ))}
    </svg>
  )
}

export function Dot({ color, size = 64 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <circle cx="32" cy="32" r="22" fill={color} />
      <circle cx="25" cy="25" r="6" fill="white" opacity="0.35" />
    </svg>
  )
}

export const DOT_COLORS = { red: '#c0453b', blue: P.blue } as const
