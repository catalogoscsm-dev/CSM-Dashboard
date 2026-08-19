import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { Category } from '../types'
import { fmtBRL, fmtPct } from '../utils/format'

interface Props {
  categories: Category[]
}

interface TooltipPayloadItem {
  color: string
  name: string
  value: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-md)',
      fontSize: '13px',
    }}>
      <p style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, marginBottom: '4px' }}>
          {p.name}: <strong>
            {p.name === 'Margem %' ? fmtPct(p.value) : fmtBRL(p.value)}
          </strong>
        </p>
      ))}
    </div>
  )
}

export default function ChartProfitVsCost({ categories }: Props) {
  const data = categories.map((c) => ({
    name: c.name,
    Custo: c.totals.cost,
    Lucro: c.totals.profit,
    'Margem %': c.totals.margin,
  }))

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
    }}>
      <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '20px' }}>
        Lucro vs Custo — com margem %
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ left: 8, right: 40, top: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Bar yAxisId="left" dataKey="Custo" fill="#FDA4AF" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar yAxisId="left" dataKey="Lucro" fill="var(--positive)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Margem %"
            stroke="var(--gold)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--gold)', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
