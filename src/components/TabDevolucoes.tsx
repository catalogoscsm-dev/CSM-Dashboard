import { useDashboardStore } from '../store/useDashboardStore'
import { fmtBRL, fmtPct, truncate } from '../utils/format'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { Product } from '../types'

interface ReturnProduct extends Product {
  categoryName: string
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px',
      gap: '16px',
    }}>
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="1.5">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--positive)' }}>
        Nenhuma devolução neste período
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Todos os itens foram vendidos sem retorno.
      </div>
    </div>
  )
}

export default function TabDevolucoes() {
  const report = useDashboardStore((s) => s.report)!

  const returns: ReturnProduct[] = report.categories.flatMap((c) =>
    c.products
      .filter((p) => p.isReturn)
      .map((p) => ({ ...p, categoryName: c.name }))
  )

  const STYLE = {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  }

  if (returns.length === 0) {
    return (
      <div style={STYLE}>
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}>
          <EmptyState />
        </div>
      </div>
    )
  }

  const totalReturnValue = Math.abs(returns.reduce((s, p) => s + p.revenue, 0))
  const totalReturnProfit = Math.abs(returns.reduce((s, p) => s + p.profit, 0))
  const totalItems = report.grandTotal.qty + returns.length
  const returnRate = totalItems > 0 ? (returns.length / totalItems) * 100 : 0

  // Return rate by category
  const catData = report.categories.map((c) => {
    const catReturns = c.products.filter((p) => p.isReturn)
    const catTotal = c.products.length
    const rate = catTotal > 0 ? (catReturns.length / catTotal) * 100 : 0
    return { name: c.name, rate, count: catReturns.length }
  }).filter((d) => d.count > 0)

  // Top returned products sorted by absolute value
  const topReturns = [...returns].sort((a, b) => Math.abs(b.revenue) - Math.abs(a.revenue)).slice(0, 10)
  const maxReturnValue = Math.abs(topReturns[0]?.revenue ?? 1)

  return (
    <div style={STYLE}>
      {/* KPI cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Valor Total Devolvido', value: `−${fmtBRL(totalReturnValue)}`, color: 'var(--negative)', bg: 'var(--negative-bg)' },
          { label: 'Qtd. Devoluções', value: String(returns.length), color: 'var(--negative)', bg: 'var(--negative-bg)' },
          { label: 'Taxa de Devolução', value: fmtPct(returnRate), color: returnRate > 10 ? 'var(--negative)' : 'var(--warning)', bg: returnRate > 10 ? 'var(--negative-bg)' : 'var(--warning-bg)' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            flex: '1 1 200px',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            animation: 'fadeSlideUp 0.4s ease both',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: kpi.color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + top list side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Rate by category */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>
            Taxa de Devolução por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} layout="vertical" margin={{ left: 8, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} fontSize={11} tick={{ fill: 'var(--text-dim)' }} />
              <YAxis type="category" dataKey="name" width={110} fontSize={11} tick={{ fill: 'var(--text-dim)' }} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de devolução']}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="rate" maxBarSize={18} radius={[0, 4, 4, 0]}>
                {catData.map((_, i) => (
                  <Cell key={i} fill="var(--negative)" fillOpacity={0.75 + i * 0.03} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top returned products */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>
            Maiores Devoluções por Valor
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topReturns.map((p, i) => {
              const barPct = maxReturnValue > 0 ? (Math.abs(p.revenue) / maxReturnValue) * 100 : 0
              return (
                <div key={p.code + i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: i === 0 ? 'var(--negative)' : 'var(--text-muted)', width: '18px', textAlign: 'right', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={p.name}>
                        {truncate(p.name, 28)}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--negative)', flexShrink: 0, marginLeft: '8px' }}>
                        −{fmtBRL(Math.abs(p.revenue))}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barPct}%`, background: 'var(--negative)', borderRadius: '2px', transition: 'width 0.8s ease' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>{p.categoryName}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Financial impact */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>Impacto Financeiro</h3>
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Receita Perdida
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--negative)' }}>
              −{fmtBRL(totalReturnValue)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Lucro Perdido
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--negative)' }}>
              −{fmtBRL(totalReturnProfit)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Ticket Médio de Devolução
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
              {fmtBRL(returns.length > 0 ? totalReturnValue / returns.length : 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
