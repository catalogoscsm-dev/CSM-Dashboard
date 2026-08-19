import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { Category } from '../types'
import { fmtBRL, fmtPct } from '../utils/format'

interface Props {
  categories: Category[]
  totalRevenue: number
  activeCategory?: string | null
  onCategoryClick?: (name: string | null) => void
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16']

interface TooltipPayloadItem {
  name: string
  value: number
  payload: { pct: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const { name, value, payload: { pct } } = payload[0]
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-md)',
      fontSize: '13px',
    }}>
      <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{name}</p>
      <p style={{ color: 'var(--text-dim)' }}>{fmtBRL(value)}</p>
      <p style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmtPct(pct)}</p>
    </div>
  )
}

export default function ChartDistribution({ categories, totalRevenue, activeCategory, onCategoryClick }: Props) {
  const data = categories.map((c, i) => ({
    name: c.name,
    value: c.totals.revenue,
    pct: totalRevenue > 0 ? (c.totals.revenue / totalRevenue) * 100 : 0,
    color: COLORS[i % COLORS.length],
  }))

  function handleSliceClick(entry: { name: string }) {
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
      <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '20px' }}>
        Distribuição por Categoria
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ pct }) => `${pct.toFixed(1)}%`}
            labelLine={false}
            cursor={onCategoryClick ? 'pointer' : 'default'}
            onClick={handleSliceClick}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color}
                opacity={activeCategory && entry.name !== activeCategory ? 0.35 : 1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ fontSize: '12px', color: 'var(--text)' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
