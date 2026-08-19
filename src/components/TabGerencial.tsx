import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useDashboardStore } from '../store/useDashboardStore'
import type { GerencialData, GerencialView, GerencialViewRow, GerencialViewType } from '../types'

// ── Formatters ────────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtBRLShort(v: number) {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000)    return `R$ ${(v / 1_000).toFixed(0)}k`
  return fmtBRL(v)
}
function fmtPct(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}
function fmtQty(v: number) { return v.toLocaleString('pt-BR') }

// ── ABC colors ────────────────────────────────────────────────────────────
const ABC_COLOR = { A: '#10B981', B: '#F59E0B', C: '#F43F5E' } as const
const ABC_BG    = { A: 'rgba(16,185,129,0.12)', B: 'rgba(245,158,11,0.12)', C: 'rgba(244,63,94,0.12)' } as const

// ── Ordered view list ─────────────────────────────────────────────────────
const VIEW_ORDER: { type: GerencialViewType; label: string }[] = [
  { type: 'clientes',      label: 'Clientes' },
  { type: 'vendedores',    label: 'Vendedores' },
  { type: 'linhasProdutos', label: 'Linha de Produtos' },
  { type: 'segmento',      label: 'Segmento' },
  { type: 'cidades',       label: 'Cidades' },
  { type: 'area',          label: 'Área' },
  { type: 'condicaoPgto',  label: 'Cond. Pgto.' },
  { type: 'fornecedores',  label: 'Fornecedores' },
  { type: 'supervisores',  label: 'Supervisores' },
]

// ── KPI Card (para aba Geral) ─────────────────────────────────────────────
interface KpiCardProps {
  label: string; value: string; sub?: string
  accent?: 'positive' | 'negative' | 'warning' | 'neutral'
}
function KpiCard({ label, value, sub, accent = 'neutral' }: KpiCardProps) {
  const colors: Record<string, string> = {
    positive: 'var(--positive)', negative: 'var(--negative)',
    warning: 'var(--warning)', neutral: 'var(--text-dim)',
  }
  const bgs: Record<string, string> = {
    positive: 'rgba(16,185,129,0.06)', negative: 'rgba(244,63,94,0.06)',
    warning: 'rgba(245,158,11,0.06)', neutral: 'var(--surface-2)',
  }
  return (
    <div style={{
      background: bgs[accent],
      border: `1px solid ${accent === 'neutral' ? 'var(--border)' : colors[accent] + '33'}`,
      borderRadius: 'var(--radius-md)', padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {label}
      </span>
      <span style={{ fontSize: '20px', fontWeight: 800, color: colors[accent], letterSpacing: '-0.5px' }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  )
}

// ── Seção (para aba Geral) ────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{
        fontSize: '13px', fontWeight: 700, color: 'var(--text-dim)',
        textTransform: 'uppercase', letterSpacing: '0.8px',
        marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {children}
      </div>
    </div>
  )
}

// ── Aba Geral — KPI cards ─────────────────────────────────────────────────
function GeralView({ g }: { g: GerencialData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      <Section title="Vendas">
        <KpiCard label="Fat. Bruto"  value={fmtBRL(g.grossRevenue)} />
        <KpiCard label="Fat. Líquido" value={fmtBRL(g.netRevenue)} accent="positive" />
        <KpiCard label="Custo"        value={fmtBRL(g.cost)} />
        <KpiCard label="Lucro (R$)"  value={fmtBRL(g.profitValue)}
          accent={g.profitValue >= 0 ? 'positive' : 'negative'} />
        <KpiCard label="Margem (%)"  value={fmtPct(g.profitPct)}
          accent={g.profitPct >= 30 ? 'positive' : g.profitPct >= 15 ? 'warning' : 'negative'} />
        <KpiCard label="Pedidos"     value={fmtQty(g.orderCount)} sub={`${fmtQty(g.itemCount)} itens`} />
        {g.pdvRevenue > 0 && <KpiCard label="Vendas PDV" value={fmtBRL(g.pdvRevenue)}
          sub={g.pdvCount > 0 ? `${fmtQty(g.pdvCount)} pedidos` : undefined} />}
        {g.bonifications > 0 && <KpiCard label="Bonificações" value={fmtBRL(g.bonifications)} accent="warning" />}
        {g.discounts !== 0 && <KpiCard label="Descontos" value={fmtBRL(Math.abs(g.discounts))} accent="warning" />}
      </Section>

      {(g.returnsValue > 0 || g.returnsCount > 0) && (
        <Section title="Devoluções">
          <KpiCard label="Valor devolvido" value={fmtBRL(g.returnsValue)}
            sub={g.returnsCount > 0 ? `${fmtQty(g.returnsCount)} devoluções` : undefined} accent="negative" />
          {g.returnsFreight !== 0 && <KpiCard label="Frete devoluções" value={fmtBRL(g.returnsFreight)} accent="negative" />}
        </Section>
      )}

      <Section title="Títulos e Recebíveis">
        {g.titlesOpen !== 0 && <KpiCard label="Títulos em aberto" value={fmtBRL(g.titlesOpen)}
          sub={g.titlesOpenCount > 0 ? `${fmtQty(g.titlesOpenCount)} títulos` : undefined} accent="negative" />}
        {g.titlesPaid !== 0 && <KpiCard label="Títulos quitados" value={fmtBRL(g.titlesPaid)}
          sub={g.titlesPaidCount > 0 ? `${fmtQty(g.titlesPaidCount)} títulos` : undefined} accent="positive" />}
        {g.titlesLoose !== 0 && <KpiCard label="Títulos avulsos" value={fmtBRL(g.titlesLoose)}
          sub={g.titlesLooseCount > 0 ? `${fmtQty(g.titlesLooseCount)} títulos` : undefined} />}
        {g.checkReceivable !== 0 && <KpiCard label="Cheques a receber" value={fmtBRL(g.checkReceivable)} />}
        {g.cardReceivable !== 0 && <KpiCard label="Cartão a receber" value={fmtBRL(g.cardReceivable)} />}
        {g.openOrders !== 0 && <KpiCard label="Pedidos em aberto" value={fmtBRL(g.openOrders)}
          sub={g.openOrdersCount > 0 ? `${fmtQty(g.openOrdersCount)} pedidos` : undefined} accent="warning" />}
        {g.totalReceivable !== 0 && <KpiCard label="Total a receber" value={fmtBRL(g.totalReceivable)} accent="positive" />}
      </Section>

      <Section title="Contas">
        {g.totalAccountsReceivable !== 0 && <KpiCard label="Total c. a receber" value={fmtBRL(g.totalAccountsReceivable)}
          sub={g.totalAccountsReceivableCount > 0 ? `${fmtQty(g.totalAccountsReceivableCount)} contas` : undefined} accent="positive" />}
        {g.totalAccountsPayable !== 0 && <KpiCard label="Total c. a pagar" value={fmtBRL(g.totalAccountsPayable)}
          sub={g.totalAccountsPayableCount > 0 ? `${fmtQty(g.totalAccountsPayableCount)} contas` : undefined} accent="negative" />}
        {g.accountsPaid !== 0 && <KpiCard label="Contas pagas" value={fmtBRL(g.accountsPaid)}
          sub={g.accountsPaidCount > 0 ? `${fmtQty(g.accountsPaidCount)} contas` : undefined} accent="positive" />}
        {g.paymentAdjustment !== 0 && <KpiCard label="Ajuste pagamento" value={fmtBRL(g.paymentAdjustment)} />}
        {g.valueReceived !== 0 && <KpiCard label="Valor recebido" value={fmtBRL(g.valueReceived)} accent="positive" />}
        {g.stockBalance !== 0 && <KpiCard label="Saldo estoque" value={fmtBRL(g.stockBalance)} />}
      </Section>

    </div>
  )
}

// ── KPI Strip (para visões detalhadas) ────────────────────────────────────
function KpiStrip({ rows }: { rows: GerencialViewRow[] }) {
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0)
  const totalOrders = rows.reduce((s, r) => s + (r.orders ?? 0), 0)
  const totalItems = rows.reduce((s, r) => s + r.items, 0)
  const avgMargin = rows.length > 0
    ? rows.reduce((s, r) => s + r.margin, 0) / rows.length
    : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
      {[
        { label: 'Faturamento Total', value: fmtBRL(totalRev), accent: 'positive' },
        { label: 'Total de Pedidos',  value: totalOrders > 0 ? fmtQty(totalOrders) : '—', accent: 'neutral' },
        { label: 'Qtd. de Itens',     value: fmtQty(totalItems), accent: 'neutral' },
        { label: 'Margem Média',      value: fmtPct(avgMargin),
          accent: avgMargin >= 120 ? 'positive' : avgMargin >= 80 ? 'warning' : 'negative' },
      ].map((kpi) => (
        <div key={kpi.label} style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: '3px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {kpi.label}
          </span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {kpi.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Tabela de visão ───────────────────────────────────────────────────────
type SortKey = 'revenue' | 'margin' | 'profit' | 'items' | 'pctTotal' | 'name'

function ViewTable({ rows }: { rows: GerencialViewRow[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [hovered, setHovered] = useState<number | null>(null)

  const sorted = [...rows].sort((a, b) => {
    const va = a[sortBy] as number | string
    const vb = b[sortBy] as number | string
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb)
    }
    return sortDir === 'desc' ? (vb as number) - (va as number) : (va as number) - (vb as number)
  })

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortBy(key); setSortDir('desc') }
  }

  const thStyle = (key: SortKey): React.CSSProperties => ({
    padding: '10px 12px', fontSize: '11px', fontWeight: 700,
    color: sortBy === key ? 'var(--gold)' : 'var(--text-dim)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    textAlign: key === 'name' ? 'left' : 'right',
    background: 'var(--surface-2)',
    borderBottom: '2px solid var(--border)',
  })

  const tdStyle = (align: 'left' | 'right' = 'right'): React.CSSProperties => ({
    padding: '9px 12px', fontSize: '13px', color: 'var(--text)',
    textAlign: align, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
  })

  const sortArrow = (key: SortKey) => sortBy === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''

  const hasCode = rows.some((r) => r.code)
  const hasOrders = rows.some((r) => r.orders !== undefined)

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle('name'), textAlign: 'center', width: '36px' }}>#</th>
            <th style={{ ...thStyle('name'), textAlign: 'center', width: '44px' }}>ABC</th>
            <th style={{ ...thStyle('name'), textAlign: 'left' }} onClick={() => handleSort('name')}>
              Nome{sortArrow('name')}
            </th>
            {hasCode && <th style={thStyle('name')}>Cód.</th>}
            {hasOrders && <th style={thStyle('items')}>Pedidos</th>}
            <th style={thStyle('items')} onClick={() => handleSort('items')}>
              Itens{sortArrow('items')}
            </th>
            <th style={thStyle('revenue')} onClick={() => handleSort('revenue')}>
              Faturamento{sortArrow('revenue')}
            </th>
            <th style={thStyle('revenue')}>Custo</th>
            <th style={thStyle('profit')} onClick={() => handleSort('profit')}>
              Lucro R${sortArrow('profit')}
            </th>
            <th style={thStyle('margin')} onClick={() => handleSort('margin')}>
              Margem %{sortArrow('margin')}
            </th>
            <th style={thStyle('pctTotal')} onClick={() => handleSort('pctTotal')}>
              % Total{sortArrow('pctTotal')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => {
            const isHovered = hovered === idx
            return (
              <tr
                key={idx}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                style={{ background: isHovered ? 'rgba(201,168,76,0.06)' : idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}
              >
                <td style={{ ...tdStyle(), textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {idx + 1}
                </td>
                <td style={{ ...tdStyle(), textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 7px', borderRadius: '999px',
                    fontSize: '11px', fontWeight: 700,
                    color: ABC_COLOR[row.abcClass],
                    background: ABC_BG[row.abcClass],
                  }}>
                    {row.abcClass}
                  </span>
                </td>
                <td style={{ ...tdStyle('left'), fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.name}
                </td>
                {hasCode && <td style={{ ...tdStyle(), color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{row.code ?? '—'}</td>}
                {hasOrders && <td style={tdStyle()}>{row.orders !== undefined ? fmtQty(row.orders) : '—'}</td>}
                <td style={tdStyle()}>{fmtQty(row.items)}</td>
                <td style={{ ...tdStyle(), fontWeight: 700, color: 'var(--text)' }}>{fmtBRL(row.revenue)}</td>
                <td style={{ ...tdStyle(), color: 'var(--text-muted)' }}>{fmtBRL(row.cost)}</td>
                <td style={{ ...tdStyle(), color: row.profit >= 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 600 }}>
                  {fmtBRL(row.profit)}
                </td>
                <td style={{ ...tdStyle(), color: row.margin >= 120 ? 'var(--positive)' : row.margin >= 80 ? 'var(--warning)' : 'var(--negative)', fontWeight: 700 }}>
                  {fmtPct(row.margin)}
                </td>
                <td style={{ ...tdStyle(), color: 'var(--text-dim)' }}>{fmtPct(row.pctTotal)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Gráfico ABC horizontal ────────────────────────────────────────────────
interface TooltipPayload {
  payload?: { name: string; revenue: number; margin: number; abcClass: 'A' | 'B' | 'C' }
}
function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px',
      boxShadow: 'var(--shadow-md)', fontSize: '12px',
    }}>
      <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px', maxWidth: '180px' }}>{d.name}</p>
      <p style={{ color: 'var(--text-dim)' }}>Fat: <strong style={{ color: 'var(--text)' }}>{fmtBRL(d.revenue)}</strong></p>
      <p style={{ color: 'var(--text-dim)' }}>Margem: <strong style={{ color: ABC_COLOR[d.abcClass] }}>{fmtPct(d.margin)}</strong></p>
    </div>
  )
}

function ViewChart({ rows }: { rows: GerencialViewRow[] }) {
  const top10 = [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  const chartData = top10.map((r) => ({
    name: r.name.length > 22 ? r.name.slice(0, 20) + '…' : r.name,
    revenue: r.revenue,
    margin: r.margin,
    abcClass: r.abcClass,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Legenda ABC */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
        {(['A', 'B', 'C'] as const).map((cls) => (
          <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-dim)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: ABC_COLOR[cls] }} />
            {cls === 'A' ? '≤75%' : cls === 'B' ? '75–95%' : '>95%'}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <XAxis
            type="number" dataKey="revenue" hide={false}
            tickFormatter={fmtBRLShort}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            type="category" dataKey="name" width={140}
            tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(201,168,76,0.06)' }} />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={22}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={ABC_COLOR[entry.abcClass]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Visão detalhada completa ──────────────────────────────────────────────
function DetailView({ view }: { view: GerencialView }) {
  return (
    <div>
      {view.period && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
          {view.period}{view.generatedAt ? ` — gerado em ${view.generatedAt}` : ''}
        </p>
      )}
      <KpiStrip rows={view.rows} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '20px', alignItems: 'start' }}>
        <ViewTable rows={view.rows} />
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '16px',
          position: 'sticky', top: '12px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Top 10 — Faturamento
          </p>
          <ViewChart rows={view.rows} />
        </div>
      </div>
    </div>
  )
}

// ── Sub-tab bar ───────────────────────────────────────────────────────────
type ActiveSubTab = 'geral' | GerencialViewType

function SubTabBar({
  active, onChange, hasGeral, loadedViews,
}: {
  active: ActiveSubTab
  onChange: (t: ActiveSubTab) => void
  hasGeral: boolean
  loadedViews: Set<GerencialViewType>
}) {
  const btnStyle = (isActive: boolean, isDisabled: boolean): React.CSSProperties => ({
    padding: '8px 14px', fontSize: '12px', fontWeight: isActive ? 700 : 500,
    background: isActive ? 'var(--surface)' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
    color: isActive ? 'var(--navy)' : isDisabled ? 'var(--text-muted)' : 'var(--text-dim)',
    cursor: isDisabled ? 'default' : 'pointer',
    opacity: isDisabled ? 0.45 : 1,
    whiteSpace: 'nowrap', transition: 'background 0.12s ease, color 0.12s ease',
    fontFamily: 'var(--font-sans)',
  })

  return (
    <div style={{
      display: 'flex', gap: '2px', flexWrap: 'wrap',
      borderBottom: '1px solid var(--border)',
      marginBottom: '20px', paddingBottom: '0',
    }}>
      <button
        style={btnStyle(active === 'geral', !hasGeral)}
        onClick={() => hasGeral && onChange('geral')}
        onMouseEnter={(e) => { if (active !== 'geral' && hasGeral) e.currentTarget.style.background = 'var(--surface-2)' }}
        onMouseLeave={(e) => { if (active !== 'geral') e.currentTarget.style.background = 'transparent' }}
      >
        Geral
      </button>
      {VIEW_ORDER.map(({ type, label }) => {
        const loaded = loadedViews.has(type)
        const isActive = active === type
        return (
          <button
            key={type}
            style={btnStyle(isActive, !loaded)}
            onClick={() => loaded && onChange(type)}
            onMouseEnter={(e) => { if (!isActive && loaded) e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            {label}
            {loaded && (
              <span style={{
                marginLeft: '5px', width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--positive)', display: 'inline-block', verticalAlign: 'middle',
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Tab principal ─────────────────────────────────────────────────────────
export default function TabGerencial() {
  const gerencial = useDashboardStore((s) => s.gerencial)
  const gerencialViews = useDashboardStore((s) => s.gerencialViews)

  const loadedViews = new Set(Object.keys(gerencialViews) as GerencialViewType[])
  const defaultTab: ActiveSubTab = gerencial ? 'geral' : (loadedViews.values().next().value ?? 'geral')
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>(defaultTab)

  if (!gerencial && loadedViews.size === 0) return null

  const activeView = activeSubTab !== 'geral' ? gerencialViews[activeSubTab as GerencialViewType] : undefined

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>
            Relatório Gerencial
          </h1>
          {(gerencial?.period || activeView?.period) && (
            <span style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--text-dim)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '3px 10px',
            }}>
              {gerencial?.period ?? activeView?.period}
            </span>
          )}
        </div>
        {gerencial?.generatedAt && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            Gerado em {gerencial.generatedAt}
          </p>
        )}
      </div>

      {/* Sub-abas */}
      <SubTabBar
        active={activeSubTab}
        onChange={setActiveSubTab}
        hasGeral={!!gerencial}
        loadedViews={loadedViews}
      />

      {/* Conteúdo */}
      {activeSubTab === 'geral' && gerencial && <GeralView g={gerencial} />}
      {activeSubTab !== 'geral' && activeView && <DetailView view={activeView} />}

      {/* Estado vazio: sub-aba sem dados */}
      {activeSubTab !== 'geral' && !activeView && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '15px' }}>Importe o HTML desta visão do Vinhasoft para visualizar os dados.</p>
          <p style={{ fontSize: '13px', marginTop: '8px', opacity: 0.7 }}>
            No Vinhasoft: Relatório Gerencial → selecione a aba → Imprimir → salvar como HTML
          </p>
        </div>
      )}

    </div>
  )
}
