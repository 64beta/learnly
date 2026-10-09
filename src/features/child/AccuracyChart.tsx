import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { SKILL_COLOR } from '../../content/lessons'
import { SKILL_CODES, type SessionSummary } from '../../lib/types'
import { dailyAccuracy } from './dailyAccuracy'

export function AccuracyChart({ summaries }: { summaries: SessionSummary[] }) {
  const { t } = useTranslation()
  const data = dailyAccuracy(summaries)
  const present = SKILL_CODES.filter((code) => data.some((r) => r[code] !== undefined))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => `${String(v)}%`} />
          <Legend />
          {present.map((code) => (
            <Line
              key={code}
              type="monotone"
              dataKey={code}
              name={t(`skills.${code}`)}
              stroke={SKILL_COLOR[code]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
