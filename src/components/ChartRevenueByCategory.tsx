import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import type { Category } from '../types'
import { fmtBRL, fmtPct } from '../utils/format'

interface Props {
  categories: Category[]
  activeCategory?: string | null
  onCategoryClick?: (name: string | null) => void
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16']

interface TooltipPayloadItem {
  color: string
  name: string
  value: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  const revenue = payload.find((p) => p.name === 'Faturamento')?.value ?? 0
  const cost = payload.find((p) => p.name === 'Custo')?.value ?? 0
  const profit = revenue - cost
  const margin = cost > 0 ? (profit / cost) * 100 : 0
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
          {p.name}: <strong>{fmtBRL(p.value)}</strong>
        </p>
      ))}
      <p style={{ color: 'var(--positive)', marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
        Lucro: <strong>{fmtBRL(profit)}</strong>
      </p>
      <p style={{ color: 'var(--text-dim)' }}>
        Margem: <strong>{fmtPct(margin)}</strong>
      </p>
    </div>
  )
}

export default function ChartRevenueByCategory({ categories, activeCategory, onCategoryClick }: Props) {
  const data = categories.map((c, i) => ({
    name: c.name,
    Faturamento: c.totals.revenue,
    Custo: c.totals.cost,
    color: COLORS[i % COLORS.length],
  }))

  function handleBarClick(entry: { name: string }) {
    if (!onCategoryClick) return
    onCategoryClick(entry.name === activeCategory ? null : entry.name)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
          Faturamento por Categoria
        </h3>
        {activeCategory && onCategoryClick && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Clique na barra para desselecionar
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={130}
            tick={{ fontSize: 12, fill: 'var(--text)', fontWeight: 500 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar
            dataKey="Faturamento"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            cursor={onCategoryClick ? 'pointer' : 'default'}
            onClick={handleBarClick}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color}
                opacity={activeCategory && entry.name !== activeCategory ? 0.35 : 1}
              />
            ))}
          </Bar>
          <Bar dataKey="Custo" fill="#CBD5E1" radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
