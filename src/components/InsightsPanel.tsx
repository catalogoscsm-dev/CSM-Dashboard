import { useState } from 'react'
import type { ReportData, AlertThresholds } from '../types'
import { fmtBRL, fmtPct } from '../utils/format'
import { useDashboardStore } from '../store/useDashboardStore'

interface Props {
  report: ReportData
}

interface Insight {
  icon: string
  text: string
  type: 'positive' | 'warning' | 'negative' | 'info'
}

function generateInsights(report: ReportData, thresholds: AlertThresholds): Insight[] {
  const insights: Insight[] = []
  const { categories, grandTotal } = report

  const allProducts = categories.flatMap((c) =>
    c.products.filter((p) => !p.isReturn).map((p) => ({ ...p, categoryName: c.name }))
  )

  const topProfit = allProducts.slice().sort((a, b) => b.profit - a.profit)[0]
  if (topProfit) {
    insights.push({
      icon: '🏆',
      text: `Produto mais lucrativo: <strong>${topProfit.name}</strong> com ${fmtBRL(topProfit.profit)} de lucro`,
      type: 'positive',
    })
  }

  const catByMargin = [...categories].sort((a, b) => b.totals.margin - a.totals.margin)[0]
  if (catByMargin) {
    insights.push({
      icon: '📈',
      text: `Categoria mais eficiente: <strong>${catByMargin.name}</strong> com ${fmtPct(catByMargin.totals.margin)} de margem média`,
      type: 'positive',
    })
  }

  const catByRev = [...categories].sort((a, b) => b.totals.revenue - a.totals.revenue)[0]
  if (catByRev && grandTotal.revenue > 0) {
    const pct = (catByRev.totals.revenue / grandTotal.revenue) * 100
    insights.push({
      icon: '🏠',
      text: `Categoria dominante: <strong>${catByRev.name}</strong> representou ${fmtPct(pct)} do faturamento`,
      type: 'info',
    })
  }

  // Exceptional margins (configurable)
  const exceptional = allProducts
    .slice()
    .sort((a, b) => b.margin - a.margin)
    .filter((p) => p.margin >= thresholds.highMarginPct)
    .slice(0, 3)
  for (const p of exceptional) {
    insights.push({
      icon: '💎',
      text: `Margem excepcional: <strong>${p.name}</strong> com ${fmtPct(p.margin)} — revisar precificação`,
      type: 'warning',
    })
  }

  // Low margin products (configurable)
  const lowMargin = allProducts.filter((p) => p.margin < thresholds.lowMarginPct && p.profit > 0)
  if (lowMargin.length > 0) {
    const names = lowMargin.slice(0, 2).map((p) => p.name).join(', ')
    insights.push({
      icon: '⚠️',
      text: `${lowMargin.length} produto(s) com margem abaixo de ${fmtPct(thresholds.lowMarginPct)}: <strong>${names}</strong>${lowMargin.length > 2 ? '…' : ''}`,
      type: 'negative',
    })
  }

  // Returns
  const returns = categories.flatMap((c) => c.products.filter((p) => p.isReturn))
  if (returns.length > 0) {
    const returnTotal = Math.abs(returns.reduce((s, p) => s + p.revenue, 0))
    const names = returns
      .slice()
      .sort((a, b) => Math.abs(a.revenue) - Math.abs(b.revenue))
      .slice(0, 3)
      .map((p) => p.name)
      .join(', ')
    insights.push({
      icon: '🔄',
      text: `${returns.length} devolução(ões) totalizando ${fmtBRL(returnTotal)}: <strong>${names}</strong>${returns.length > 3 ? '…' : ''}`,
      type: 'negative',
    })
  }

  return insights
}

const typeColors: Record<string, { border: string; bg: string }> = {
  positive: { border: 'var(--positive)', bg: 'var(--positive-bg)' },
  warning:  { border: 'var(--warning)',  bg: 'var(--warning-bg)'  },
  negative: { border: 'var(--negative)', bg: 'var(--negative-bg)' },
  info:     { border: 'var(--navy)',     bg: '#EFF6FF'             },
}

export default function InsightsPanel({ report }: Props) {
  const thresholds = useDashboardStore((s) => s.thresholds)
  const setThresholds = useDashboardStore((s) => s.setThresholds)
  const [configOpen, setConfigOpen] = useState(false)
  const [lowDraft, setLowDraft] = useState(String(thresholds.lowMarginPct))
  const [highDraft, setHighDraft] = useState(String(thresholds.highMarginPct))

  const insights = generateInsights(report, thresholds)

  function handleSaveThresholds() {
    setThresholds({ lowMarginPct: parseFloat(lowDraft) || 120, highMarginPct: parseFloat(highDraft) || 200 })
    setConfigOpen(false)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
          Insights Automáticos
        </h3>
        <button
          onClick={() => {
            setLowDraft(String(thresholds.lowMarginPct))
            setHighDraft(String(thresholds.highMarginPct))
            setConfigOpen((v) => !v)
          }}
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 0',
            textDecoration: 'underline',
          }}
        >
          ⚙ Configurar alertas
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {insights.map((ins, i) => {
          const colors = typeColors[ins.type]
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: colors.bg,
              borderLeft: `3px solid ${colors.border}`,
              fontSize: '13px',
              color: 'var(--text)',
              lineHeight: 1.5,
              animation: `fadeSlideUp 0.4s ease ${i * 60}ms both`,
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{ins.icon}</span>
              <span dangerouslySetInnerHTML={{ __html: ins.text }} />
            </div>
          )
        })}
      </div>

      {configOpen && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
              Margem baixa — abaixo de (%)
            </label>
            <input
              type="number"
              value={lowDraft}
              onChange={(e) => setLowDraft(e.target.value)}
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '6px 10px', fontSize: '13px', fontFamily: 'var(--font-mono)',
                color: 'var(--text)', background: 'var(--bg)', outline: 'none', width: '120px',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
              Margem suspeita — acima de (%)
            </label>
            <input
              type="number"
              value={highDraft}
              onChange={(e) => setHighDraft(e.target.value)}
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '6px 10px', fontSize: '13px', fontFamily: 'var(--font-mono)',
                color: 'var(--text)', background: 'var(--bg)', outline: 'none', width: '120px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSaveThresholds}
              style={{
                background: 'var(--navy)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Salvar
            </button>
            <button
              onClick={() => setConfigOpen(false)}
              style={{
                background: 'transparent', color: 'var(--text-dim)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '7px 14px', fontSize: '13px', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
