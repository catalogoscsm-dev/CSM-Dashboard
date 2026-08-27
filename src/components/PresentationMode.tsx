import { useEffect } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { fmtBRL, fmtPct, fmtQty } from '../utils/format'
import CsmLogo from './CsmLogo'
import type { GerencialData } from '../types'

function BigKPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px 28px',
      border: '1px solid rgba(201,168,76,0.25)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      animation: 'fadeSlideUp 0.5s ease both',
    }}>
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '40px',
        fontWeight: 800,
        fontFamily: 'var(--font-mono)',
        color: 'var(--gold)',
        lineHeight: 1.1,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>
          {sub}
        </span>
      )}
    </div>
  )
}

function PresentationHeader({ company, period, onClose }: { company: string; period: string; onClose: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 32px',
      borderBottom: '1px solid rgba(201,168,76,0.2)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <CsmLogo size={40} />
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gold)', letterSpacing: '-0.3px' }}>
            {company}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
            {period}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--positive)',
            animation: 'pulse 2s ease infinite',
          }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>ao vivo</span>
        </div>
        <button
          onClick={onClose}
          title="Fechar apresentação (ESC)"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-sm)',
            color: 'rgba(255,255,255,0.6)',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          ✕ ESC
        </button>
      </div>
    </div>
  )
}

function GerencialPresentation({ gerencial, onClose }: { gerencial: GerencialData; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--navy)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeSlideUp 0.3s ease both',
    }}>
      <PresentationHeader company={gerencial.company} period={gerencial.period} onClose={onClose} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', gap: '24px', overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <BigKPI
            label="Faturamento Bruto"
            value={fmtBRL(gerencial.grossRevenue)}
          />
          <BigKPI
            label="Faturamento Líquido"
            value={fmtBRL(gerencial.netRevenue)}
          />
          <BigKPI
            label="Lucro"
            value={fmtBRL(gerencial.profitValue)}
            sub={`${fmtPct(gerencial.profitPct)} de margem`}
          />
          <BigKPI
            label="Pedidos"
            value={String(gerencial.orderCount)}
            sub={`${fmtQty(gerencial.itemCount)} itens vendidos`}
          />
          <BigKPI
            label="Devoluções"
            value={gerencial.returnsCount === 0 ? '0' : `${gerencial.returnsCount} dev.`}
            sub={gerencial.returnsValue > 0 ? `−${fmtBRL(gerencial.returnsValue)}` : 'Nenhuma devolução'}
          />
          <BigKPI
            label="Estoque"
            value={fmtBRL(gerencial.stockBalance)}
          />
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.4 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {([
            ['Descontos', fmtBRL(gerencial.discounts)],
            ['Bonificações', fmtBRL(gerencial.bonifications)],
            ['Títulos em Aberto', fmtBRL(gerencial.titlesOpen)],
            ['Total a Receber', fmtBRL(gerencial.totalReceivable)],
            ['PDV Faturamento', fmtBRL(gerencial.pdvRevenue)],
            ['Pedidos em Aberto', fmtBRL(gerencial.openOrders)],
          ] as [string, string][]).map(([label, value], i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {label}
              </span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PresentationMode() {
  const togglePresentationMode = useDashboardStore((s) => s.togglePresentationMode)
  const report = useDashboardStore((s) => s.report)
  const gerencial = useDashboardStore((s) => s.gerencial)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') togglePresentationMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePresentationMode])

  if (!report && gerencial) {
    return <GerencialPresentation gerencial={gerencial} onClose={togglePresentationMode} />
  }

  if (!report) return null

  const { grandTotal, categories, company, period } = report

  const returns = categories.flatMap((c) => c.products).filter((p) => p.isReturn)
  const returnCount = returns.length
  const returnValue = Math.abs(returns.reduce((s, p) => s + p.revenue, 0))

  const topCategory = [...categories].sort((a, b) => b.totals.revenue - a.totals.revenue)[0]
  const topCategoryPct = grandTotal.revenue > 0
    ? (topCategory.totals.revenue / grandTotal.revenue) * 100
    : 0

  const marginColor = grandTotal.margin >= 150 ? 'var(--positive)'
    : grandTotal.margin >= 120 ? 'var(--warning)'
    : 'var(--negative)'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--navy)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeSlideUp 0.3s ease both',
    }}>
      <PresentationHeader company={company} period={period} onClose={togglePresentationMode} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '32px',
        gap: '24px',
        overflow: 'auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          <BigKPI
            label="Faturamento Total"
            value={fmtBRL(grandTotal.revenue)}
          />
          <BigKPI
            label="Lucro Total"
            value={fmtBRL(grandTotal.profit)}
          />
          <BigKPI
            label="Margem Média"
            value={fmtPct(grandTotal.margin)}
            sub={grandTotal.margin >= 150 ? '▲ Excelente' : grandTotal.margin >= 120 ? '~ Adequada' : '▼ Atenção'}
          />
          <BigKPI
            label="Itens Vendidos"
            value={fmtQty(grandTotal.qty)}
          />
          <BigKPI
            label="Categoria Líder"
            value={topCategory?.name ?? '—'}
            sub={`${fmtPct(topCategoryPct)} do faturamento`}
          />
          <BigKPI
            label="Devoluções"
            value={returnCount === 0 ? '0' : `${returnCount} itens`}
            sub={returnCount > 0 ? `−${fmtBRL(returnValue)}` : 'Nenhuma devolução'}
          />
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.4 }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {categories.slice(0, 6).map((cat, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {cat.name}
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                  {fmtBRL(cat.totals.revenue)}
                </div>
                <div style={{ fontSize: '11px', color: marginColor, fontFamily: 'var(--font-mono)' }}>
                  {fmtPct(cat.totals.margin)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
