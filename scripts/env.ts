// Lokal skriptlər üçün mühit dəyişənləri (.env faylından `tsx --env-file=.env` ilə yüklənir)
export function requireEnv(...names: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  const missing: string[] = []
  for (const n of names) {
    const v = process.env[n]
    if (!v) missing.push(n)
    else out[n] = v
  }
  if (missing.length) {
    console.error(`❌ .env faylında bu dəyişənlər yoxdur: ${missing.join(', ')}  (bax: .env.example)`)
    process.exit(1)
  }
  return out
}
