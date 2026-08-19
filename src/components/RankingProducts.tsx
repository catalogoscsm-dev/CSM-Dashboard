import type { Category, Product } from '../types'
import { fmtBRL, fmtPct, truncate } from '../utils/format'

interface Props {
  categories: Category[]
}

interface RankedProduct extends Product {
  categoryName: string
}

function marginBadge(margin: number): { label: string; color: string; bg: string } {
  if (margin >= 200) return { label: '🏆 Ouro', color: '#92400E', bg: '#FEF3C7' }
  if (margin >= 150) return { label: 'Ótima', color: 'var(--positive)', bg: 'var(--positive-bg)' }
  if (margin >= 120) return { label: 'Boa', color: '#1D4ED8', bg: '#DBEAFE' }
  return { label: 'Regular', color: 'var(--text-dim)', bg: 'var(--surface-2)' }
}

function RankList({
  title,
  products,
  valueKey,
  formatValue,
  showBadge,
  maxValue,
}: {
  title: string
  products: RankedProduct[]
  valueKey: keyof RankedProduct
  formatValue: (v: number) => string
  showBadge?: boolean
  maxValue: number
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
      flex: 1,
    }}>
      <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {products.map((p, i) => {
          const val = p[valueKey] as number
          const badge = showBadge ? marginBadge(val) : null
          const barPct = maxValue > 0 ? (val / maxValue) * 100 : 0
          return (
            <div key={p.code + i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                color: i === 0 ? 'var(--gold)' : 'var(--text-muted)',
                width: '18px',
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                  }} title={p.name}>
                    {truncate(p.name, 32)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {badge && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: badge.color,
                        background: badge.bg,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        {badge.label}
                      </span>
                    )}
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {formatValue(val)}
                    </span>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${barPct}%`,
                    background: i === 0 ? 'var(--gold)' : 'var(--navy)',
                    borderRadius: '2px',
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  {p.categoryName}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RankingProducts({ categories }: Props) {
  const allProducts: RankedProduct[] = categories.flatMap((c) =>
    c.products
      .filter((p) => !p.isReturn)
      .map((p) => ({ ...p, categoryName: c.name }))
  )

  const byProfit = [...allProducts]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)

  const byMargin = [...allProducts]
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 10)

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <RankList
        title="🏆 Top 10 — Maior Lucro"
        products={byProfit}
        valueKey="profit"
        formatValue={fmtBRL}
        maxValue={byProfit[0]?.profit ?? 1}
      />
      <RankList
        title="📈 Top 10 — Maior Margem %"
        products={byMargin}
        valueKey="margin"
        formatValue={fmtPct}
        showBadge
        maxValue={byMargin[0]?.margin ?? 1}
      />
    </div>
  )
}
