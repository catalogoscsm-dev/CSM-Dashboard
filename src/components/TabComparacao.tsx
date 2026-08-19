import { useRef, useState } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { fmtBRL, fmtPct, fmtQty } from '../utils/format'
import { readFileAsWindows1252 } from '../utils/parser'
import ChartRevenueByCategory from './ChartRevenueByCategory'
import type { ReportData } from '../types'

function calcDelta(a: number, b: number): { pct: number; positive: boolean } {
  if (b === 0) return { pct: 0, positive: true }
  const pct = ((a - b) / Math.abs(b)) * 100
  return { pct, positive: pct >= 0 }
}

function DeltaBadge({ a, b }: { a: number; b: number }) {
  const { pct, positive } = calcDelta(a, b)
  if (b === 0) return null
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      color: positive ? 'var(--positive)' : 'var(--negative)',
      background: positive ? 'var(--positive-bg)' : 'var(--negative-bg)',
      padding: '2px 6px',
      borderRadius: '4px',
      fontFamily: 'var(--font-mono)',
    }}>
      {positive ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function CompareKPICard({
  label, valueA, valueB, format, icon,
}: {
  label: string
  valueA: number
  valueB: number
  format: (v: number) => string
  icon: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '18px 20px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
      flex: '1 1 180px',
      minWidth: '160px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      animation: 'fadeSlideUp 0.4s ease both',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span style={{ color: 'var(--text-dim)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
        {format(valueA)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {format(valueB)}
        </span>
        <DeltaBadge a={valueA} b={valueB} />
      </div>
    </div>
  )
}

function DropZone({ onLoad }: { onLoad: (html: string) => void }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.match(/\.html?$/i)) return
    setLoading(true)
    try {
      const html = await readFileAsWindows1252(file)
      onLoad(html)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '32px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? '#FFFBEB' : 'var(--bg)',
        transition: 'all 0.2s ease',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}
    >
      <input ref={inputRef} type="file" accept=".htm,.html" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <div style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 500 }}>
        {loading ? 'Carregando…' : 'Arraste o relatório do Período B'}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ou clique para selecionar</div>
    </div>
  )
}

function PeriodSummaryCard({ report, label }: { report: ReportData; label: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      border: '2px solid var(--gold)',
      flex: 1,
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
        {report.period}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Faturamento</span>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>{fmtBRL(report.grandTotal.revenue)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Lucro</span>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--positive)' }}>{fmtBRL(report.grandTotal.profit)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Margem</span>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fmtPct(report.grandTotal.margin)}</span>
        </div>
      </div>
    </div>
  )
}

export default function TabComparacao() {
  const report = useDashboardStore((s) => s.report)!
  const reportB = useDashboardStore((s) => s.reportB)
  const loadReportB = useDashboardStore((s) => s.loadReportB)
  const clearReportB = useDashboardStore((s) => s.clearReportB)

  const STYLE = {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  }

  if (!reportB) {
    return (
      <div style={STYLE}>
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '6px' }}>
            Comparação de Períodos
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '20px' }}>
            Carregue um segundo relatório para comparar os resultados lado a lado com delta ▲▼.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            <PeriodSummaryCard report={report} label="Período A (atual)" />
            <DropZone onLoad={loadReportB} />
          </div>
        </div>
      </div>
    )
  }

  const a = report.grandTotal
  const b = reportB.grandTotal

  // All categories from both reports merged
  const allCatNames = Array.from(new Set([
    ...report.categories.map((c) => c.name),
    ...reportB.categories.map((c) => c.name),
  ]))

  return (
    <div style={STYLE}>
      {/* Period labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700, background: 'var(--navy)', color: '#fff',
            padding: '3px 10px', borderRadius: '4px',
          }}>
            A: {report.period}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>vs</span>
          <span style={{
            fontSize: '12px', fontWeight: 700, background: 'var(--surface-2)', color: 'var(--text-dim)',
            padding: '3px 10px', borderRadius: '4px', border: '1px solid var(--border)',
          }}>
            B: {reportB.period}
          </span>
        </div>
        <button
          onClick={clearReportB}
          style={{
            fontSize: '12px', color: 'var(--negative)', background: 'transparent',
            border: '1px solid var(--negative)', borderRadius: 'var(--radius-sm)',
            padding: '5px 12px', cursor: 'pointer', fontWeight: 600,
          }}
        >
          Remover Período B
        </button>
      </div>

      {/* KPI comparison */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        {[
          { label: 'Faturamento', vA: a.revenue, vB: b.revenue, fmt: fmtBRL,
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
          { label: 'Lucro', vA: a.profit, vB: b.profit, fmt: fmtBRL,
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> },
          { label: 'Margem Média', vA: a.margin, vB: b.margin, fmt: fmtPct,
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg> },
          { label: 'Itens Vendidos', vA: a.qty, vB: b.qty, fmt: (v: number) => fmtQty(Math.round(v)),
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/></svg> },
        ].map((kpi) => (
          <CompareKPICard
            key={kpi.label}
            label={kpi.label}
            valueA={kpi.vA}
            valueB={kpi.vB}
            format={kpi.fmt}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Charts side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Período A — {report.period}
          </div>
          <ChartRevenueByCategory categories={report.categories} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Período B — {reportB.period}
          </div>
          <ChartRevenueByCategory categories={reportB.categories} />
        </div>
      </div>

      {/* Category comparison table */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>
          Comparativo por Categoria
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Categoria', 'Rev. A', 'Rev. B', 'Δ Rev.', 'Margem A', 'Margem B', 'Δ Margem'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Categoria' ? 'left' : 'right', color: 'var(--text-dim)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allCatNames.map((name, i) => {
                const catA = report.categories.find((c) => c.name === name)
                const catB = reportB.categories.find((c) => c.name === name)
                const revA = catA?.totals.revenue ?? 0
                const revB = catB?.totals.revenue ?? 0
                const marA = catA?.totals.margin ?? 0
                const marB = catB?.totals.margin ?? 0
                const { pct: marPct, positive: marPos } = calcDelta(marA, marB)
                const isEven = i % 2 === 0
                return (
                  <tr key={name} style={{ background: isEven ? 'var(--surface)' : 'var(--surface-2)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>{name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: catA ? 'var(--text)' : 'var(--text-muted)' }}>
                      {catA ? fmtBRL(revA) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: catB ? 'var(--text-dim)' : 'var(--text-muted)' }}>
                      {catB ? fmtBRL(revB) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {catA && catB && <DeltaBadge a={revA} b={revB} />}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: catA ? 'var(--text)' : 'var(--text-muted)' }}>
                      {catA ? fmtPct(marA) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: catB ? 'var(--text-dim)' : 'var(--text-muted)' }}>
                      {catB ? fmtPct(marB) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {catA && catB && revB !== 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: marPos ? 'var(--positive)' : 'var(--negative)' }}>
                          {marPos ? '+' : ''}{marPct.toFixed(1)} pp
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
