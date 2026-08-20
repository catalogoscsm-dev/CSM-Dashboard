import type { ReportData } from '../types'
import { fmtBRL, fmtPct, fmtQty } from '../utils/format'
import { useCountUp } from '../utils/animations'

interface Props {
  report: ReportData
}

function KPICard({
  label,
  value: _value,
  formatted,
  icon,
  color,
  bg,
  delay,
}: {
  label: string
  value: number
  formatted: string
  icon: React.ReactNode
  color: string
  bg?: string
  delay: number
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
      flex: '1 1 180px',
      minWidth: '160px',
      animation: `fadeSlideUp 0.5s ease ${delay}ms both`,
      transition: 'box-shadow 0.25s ease, transform 0.2s ease, border-color 0.25s ease',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = `var(--shadow-md), 0 4px 16px ${color}28`
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.borderColor = color + '66'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.borderColor = 'var(--border)'
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <div style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
          background: bg || 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 800, color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
        {formatted}
      </div>
    </div>
  )
}

export default function KPIRow({ report }: Props) {
  const { grandTotal, categories } = report

  const returns = categories
    .flatMap((c) => c.products)
    .filter((p) => p.isReturn)

  const returnCount = Math.abs(returns.length)
  const returnValue = Math.abs(returns.reduce((s, p) => s + p.revenue, 0))

  const animRevenue = useCountUp(grandTotal.revenue)
  const animProfit = useCountUp(grandTotal.profit)
  const animMargin = useCountUp(grandTotal.margin)
  const animQty = useCountUp(grandTotal.qty)

  const marginColor = grandTotal.margin >= 150 ? 'var(--positive)' : grandTotal.margin >= 120 ? 'var(--warning)' : 'var(--negative)'
  const marginBg = grandTotal.margin >= 150 ? 'var(--positive-bg)' : grandTotal.margin >= 120 ? 'var(--warning-bg)' : 'var(--negative-bg)'

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <KPICard
        label="Faturamento Total"
        value={grandTotal.revenue}
        formatted={fmtBRL(animRevenue)}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
        color="var(--navy)"
        bg="var(--surface-2)"
        delay={0}
      />
      <KPICard
        label="Lucro Total"
        value={grandTotal.profit}
        formatted={fmtBRL(animProfit)}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
        color="var(--positive)"
        bg="var(--positive-bg)"
        delay={50}
      />
      <KPICard
        label="Margem Média"
        value={grandTotal.margin}
        formatted={fmtPct(animMargin)}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>}
        color={marginColor}
        bg={marginBg}
        delay={100}
      />
      <KPICard
        label="Itens Vendidos"
        value={grandTotal.qty}
        formatted={fmtQty(Math.round(animQty))}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
        color="var(--navy)"
        bg="var(--surface-2)"
        delay={150}
      />
      <KPICard
        label="Devoluções"
        value={returnCount}
        formatted={returnCount === 0 ? '0' : `${returnCount} (${fmtBRL(-returnValue)})`}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>}
        color={returnCount > 0 ? 'var(--negative)' : 'var(--text-dim)'}
        bg={returnCount > 0 ? 'var(--negative-bg)' : 'var(--surface-2)'}
        delay={200}
      />
    </div>
  )
}
