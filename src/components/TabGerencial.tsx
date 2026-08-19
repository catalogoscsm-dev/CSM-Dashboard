import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import { useDashboardStore } from '../store/useDashboardStore'
import type {
  GerencialData, GerencialView, GerencialViewRow,
  GerencialViewType, MonthlyGoal,
} from '../types'

// ── Formatters ────────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtBRLShort(v: number) {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return fmtBRL(v)
}
function fmtPct(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}
function fmtQty(v: number) { return v.toLocaleString('pt-BR') }

// ── ABC colors (visões detalhadas) ────────────────────────────────────────
const ABC_COLOR = { A: '#10B981', B: '#F59E0B', C: '#F43F5E' } as const
const ABC_BG = { A: 'rgba(16,185,129,0.12)', B: 'rgba(245,158,11,0.12)', C: 'rgba(244,63,94,0.12)' } as const

const VIEW_ORDER: { type: GerencialViewType; label: string }[] = [
  { type: 'clientes', label: 'Clientes' },
  { type: 'vendedores', label: 'Vendedores' },
  { type: 'linhasProdutos', label: 'Linha de Produtos' },
  { type: 'segmento', label: 'Segmento' },
  { type: 'cidades', label: 'Cidades' },
  { type: 'area', label: 'Área' },
  { type: 'condicaoPgto', label: 'Cond. Pgto.' },
  { type: 'fornecedores', label: 'Fornecedores' },
  { type: 'supervisores', label: 'Supervisores' },
]

// ═══════════════════════════════════════════════════════════════════════════
// ABA GERAL — componentes
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Insights automáticos ───────────────────────────────────────────────
interface Insight {
  level: 'good' | 'warn' | 'bad' | 'info'
  icon: string
  label: string
  value: string
}

function buildInsights(g: GerencialData): Insight[] {
  const out: Insight[] = []
  const base = g.grossRevenue || g.netRevenue || 1

  // Ticket médio
  if (g.orderCount > 0) {
    const ticket = (g.netRevenue > 0 ? g.netRevenue : g.grossRevenue) / g.orderCount
    out.push({ level: 'info', icon: '🧾', label: 'Ticket médio', value: fmtBRL(ticket) })
  }

  // Margem
  if (g.profitPct > 0) {
    const level = g.profitPct >= 120 ? 'good' : g.profitPct >= 80 ? 'warn' : 'bad'
    const label = g.profitPct >= 120 ? 'Margem excelente' : g.profitPct >= 80 ? 'Margem aceitável' : 'Margem baixa — atenção'
    out.push({ level, icon: level === 'good' ? '📈' : level === 'warn' ? '⚠️' : '🔻', label, value: fmtPct(g.profitPct) })
  }

  // Taxa de devolução
  if (g.returnsValue > 0) {
    const rate = (g.returnsValue / base) * 100
    const level = rate <= 5 ? 'good' : rate <= 10 ? 'warn' : 'bad'
    out.push({ level, icon: level === 'good' ? '✅' : '↩️', label: 'Taxa de devolução', value: fmtPct(rate) })
  }

  // Descontos
  if (g.discounts !== 0) {
    const rate = (Math.abs(g.discounts) / base) * 100
    const level = rate <= 10 ? 'info' : rate <= 20 ? 'warn' : 'bad'
    out.push({ level, icon: '🏷️', label: 'Taxa de desconto', value: fmtPct(rate) })
  }

  // Saldo financeiro
  if (g.totalAccountsReceivable > 0 || g.totalAccountsPayable > 0) {
    const balance = g.totalAccountsReceivable - g.totalAccountsPayable
    const level = balance >= 0 ? 'good' : 'bad'
    out.push({
      level,
      icon: balance >= 0 ? '💚' : '🔴',
      label: balance >= 0 ? 'Saldo financeiro positivo' : 'Saldo financeiro negativo',
      value: fmtBRL(Math.abs(balance)),
    })
  }

  // Cobertura de títulos
  const totalTitles = g.titlesOpen + g.titlesPaid
  if (totalTitles > 0) {
    const coverage = (g.titlesPaid / totalTitles) * 100
    const level = coverage >= 80 ? 'good' : coverage >= 50 ? 'warn' : 'bad'
    out.push({ level, icon: '📋', label: 'Títulos já quitados', value: fmtPct(coverage) })
  }

  // Recebido vs a pagar
  if (g.valueReceived > 0 && g.totalAccountsPayable > 0) {
    const ratio = (g.valueReceived / g.totalAccountsPayable) * 100
    const level = ratio >= 100 ? 'good' : ratio >= 60 ? 'warn' : 'bad'
    out.push({ level, icon: ratio >= 100 ? '💰' : '⚡', label: 'Recebido vs. a pagar', value: fmtPct(ratio) })
  }

  return out
}

const INSIGHT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  good: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', text: '#059669' },
  warn: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', text: '#B45309' },
  bad:  { bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.3)',  text: '#BE123C' },
  info: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.3)', text: '#4338CA' },
}

function InsightsStrip({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {insights.map((ins, i) => {
        const c = INSIGHT_COLORS[ins.level]
        return (
          <div key={i} style={{
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 'var(--radius-md)', padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            minWidth: '200px', flex: '1 1 200px',
          }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{ins.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {ins.label}
              </span>
              <span style={{ fontSize: '17px', fontWeight: 800, color: c.text, letterSpacing: '-0.3px' }}>
                {ins.value}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 2. Gauge de margem (SVG semicírculo) ──────────────────────────────────
function MarginGauge({ pct }: { pct: number }) {
  const displayPct = Math.min(Math.max(pct, 0), 200)
  const fraction = displayPct / 200
  const cx = 85, cy = 78, r = 58
  // Semicírculo: ângulo vai de π (esquerda) até 0 (direita) no SVG
  const angle = Math.PI - fraction * Math.PI
  const ex = cx + r * Math.cos(angle)
  const ey = cy - r * Math.sin(angle)
  const largeArc = fraction > 0.5 ? 1 : 0
  const color = pct < 80 ? '#F43F5E' : pct < 120 ? '#F59E0B' : '#10B981'
  const label = pct < 80 ? 'Baixa' : pct < 120 ? 'Boa' : 'Excelente'

  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '20px 16px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Margem de Lucro
      </span>
      <svg width="170" height="100" viewBox="0 0 170 100">
        {/* Zonas coloridas de fundo */}
        <path d={`M 27,78 A 58,58 0 0,1 85,20`} stroke="#F43F5E" fill="none" strokeWidth="10" strokeLinecap="round" opacity="0.15"/>
        <path d={`M 85,20 A 58,58 0 0,1 120,30`} stroke="#F59E0B" fill="none" strokeWidth="10" strokeLinecap="round" opacity="0.15"/>
        <path d={`M 120,30 A 58,58 0 0,1 143,78`} stroke="#10B981" fill="none" strokeWidth="10" strokeLinecap="round" opacity="0.15"/>
        {/* Track cinza */}
        <path d={`M 27,78 A 58,58 0 0,1 143,78`} stroke="#e5e7eb" fill="none" strokeWidth="10" strokeLinecap="round"/>
        {/* Arco de valor */}
        {fraction > 0.01 && (
          <path d={`M 27,78 A 58,58 0 ${largeArc},1 ${ex.toFixed(1)},${ey.toFixed(1)}`}
            stroke={color} fill="none" strokeWidth="10" strokeLinecap="round"/>
        )}
        {/* Ponteiro */}
        {fraction > 0.01 && (
          <circle cx={ex.toFixed(1)} cy={ey.toFixed(1)} r="6" fill={color} stroke="white" strokeWidth="2"/>
        )}
        {/* Labels zona */}
        <text x="20" y="94" fontSize="9" fill="#9ca3af" textAnchor="middle">0%</text>
        <text x="85" y="16" fontSize="9" fill="#9ca3af" textAnchor="middle">100%</text>
        <text x="150" y="94" fontSize="9" fill="#9ca3af" textAnchor="middle">200%</text>
        {/* Valor central */}
        <text x="85" y="68" fontSize="24" fontWeight="800" fill={color} textAnchor="middle">
          {pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
        </text>
        <text x="85" y="84" fontSize="10" fontWeight="600" fill={color} textAnchor="middle">{label}</text>
      </svg>
    </div>
  )
}

// ── 3. Donut lucro vs custo ───────────────────────────────────────────────
interface DonutTooltipProps { active?: boolean; payload?: Array<{ name: string; value: number }> }
function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.[0]) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '12px',
    }}>
      <strong>{payload[0].name}</strong>: {fmtBRL(payload[0].value)}
    </div>
  )
}

function RevenueDonut({ g }: { g: GerencialData }) {
  const base = g.netRevenue > 0 ? g.netRevenue : g.grossRevenue
  const profit = g.profitValue > 0 ? g.profitValue : base - g.cost
  const cost = g.cost
  const returns = g.returnsValue
  const discounts = Math.abs(g.discounts)

  const data = [
    { name: 'Lucro', value: Math.max(profit, 0), color: '#10B981' },
    { name: 'Custo', value: Math.max(cost, 0), color: '#60A5FA' },
    ...(returns > 0 ? [{ name: 'Devoluções', value: returns, color: '#F43F5E' }] : []),
    ...(discounts > 0 ? [{ name: 'Descontos', value: discounts, color: '#F59E0B' }] : []),
  ].filter(d => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '20px 16px 12px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Composição do Faturamento
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={34} outerRadius={54} paddingAngle={2} strokeWidth={0}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {data.map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', flex: 1 }}>{d.name}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>
                {total > 0 ? fmtPct((d.value / total) * 100) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 4. Posição financeira ─────────────────────────────────────────────────
function FinancialPosition({ g }: { g: GerencialData }) {
  const receber = g.totalAccountsReceivable
  const pagar = g.totalAccountsPayable
  const recebido = g.valueReceived
  const max = Math.max(receber, pagar, recebido, 1)
  const balance = receber - pagar

  const Bar = ({ value, color, label }: { value: number; color: string; label: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color }}>{fmtBRLShort(value)}</span>
      </div>
      <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${(value / max) * 100}%`,
          background: color, borderRadius: '4px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )

  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '20px 20px 16px',
      display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Posição Financeira
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Bar value={receber}  color="#10B981" label="A Receber" />
        <Bar value={pagar}    color="#F43F5E" label="A Pagar" />
        <Bar value={recebido} color="#60A5FA" label="Já Recebido" />
      </div>
      <div style={{
        marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Saldo líquido</span>
        <span style={{ fontSize: '15px', fontWeight: 800, color: balance >= 0 ? '#10B981' : '#F43F5E' }}>
          {balance >= 0 ? '+' : ''}{fmtBRL(balance)}
        </span>
      </div>
    </div>
  )
}

// ── 5. Barra de meta ──────────────────────────────────────────────────────
function GoalProgress({ g, goal }: { g: GerencialData; goal: MonthlyGoal }) {
  if (goal.revenue <= 0 && goal.profit <= 0) return null
  const rev = g.netRevenue > 0 ? g.netRevenue : g.grossRevenue
  const revPct = goal.revenue > 0 ? Math.min((rev / goal.revenue) * 100, 120) : 0
  const profPct = goal.profit > 0 ? Math.min((g.profitValue / goal.profit) * 100, 120) : 0

  const BarItem = ({ label, current, target, pct, color }: {
    label: string; current: number; target: number; pct: number; color: string
  }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)' }}>{label}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {fmtBRLShort(current)} / {fmtBRLShort(target)}
        </span>
      </div>
      <div style={{ position: 'relative', height: '12px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: '6px',
          background: pct >= 100 ? '#10B981' : pct >= 70 ? '#F59E0B' : '#F43F5E',
          transition: 'width 0.7s ease',
        }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 700, color }}>
        {pct.toFixed(0)}% da meta
      </div>
    </div>
  )

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(13,27,42,0.04) 0%, rgba(201,168,76,0.06) 100%)',
      border: '1px solid var(--gold)',
      borderRadius: 'var(--radius-md)', padding: '18px 20px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '14px' }}>
        Progresso da Meta Mensal
      </p>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {goal.revenue > 0 && (
          <BarItem
            label="Faturamento"
            current={rev}
            target={goal.revenue}
            pct={revPct}
            color={revPct >= 100 ? '#10B981' : revPct >= 70 ? '#F59E0B' : '#F43F5E'}
          />
        )}
        {goal.profit > 0 && (
          <BarItem
            label="Lucro"
            current={g.profitValue}
            target={goal.profit}
            pct={profPct}
            color={profPct >= 100 ? '#10B981' : profPct >= 70 ? '#F59E0B' : '#F43F5E'}
          />
        )}
      </div>
    </div>
  )
}

// ── 6. KPI card compacto ─────────────────────────────────────────────────
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
      borderRadius: 'var(--radius-md)', padding: '14px 18px',
      display: 'flex', flexDirection: 'column', gap: '3px',
    }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {label}
      </span>
      <span style={{ fontSize: '18px', fontWeight: 800, color: colors[accent], letterSpacing: '-0.4px' }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{
        fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)',
        textTransform: 'uppercase', letterSpacing: '0.8px',
        marginBottom: '10px', paddingBottom: '7px', borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
        {children}
      </div>
    </div>
  )
}

// ── GeralView principal ───────────────────────────────────────────────────
function GeralView({ g, goal }: { g: GerencialData; goal: MonthlyGoal }) {
  const insights = buildInsights(g)
  const revBase = g.netRevenue > 0 ? g.netRevenue : g.grossRevenue
  const ticketMedio = g.orderCount > 0 ? revBase / g.orderCount : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Strip de KPIs principais ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
        <KpiCard label="Fat. Bruto"   value={fmtBRL(g.grossRevenue)} />
        <KpiCard label="Fat. Líquido" value={fmtBRL(g.netRevenue > 0 ? g.netRevenue : g.grossRevenue)} accent="positive" />
        <KpiCard label="Lucro (R$)"   value={fmtBRL(g.profitValue)} accent={g.profitValue >= 0 ? 'positive' : 'negative'} />
        <KpiCard label="Margem (%)"   value={fmtPct(g.profitPct)}
          accent={g.profitPct >= 120 ? 'positive' : g.profitPct >= 80 ? 'warning' : 'negative'} />
        <KpiCard label="Pedidos"      value={fmtQty(g.orderCount)} sub={`${fmtQty(g.itemCount)} itens`} />
        {ticketMedio > 0 && <KpiCard label="Ticket Médio" value={fmtBRL(ticketMedio)} />}
        {g.discounts !== 0 && <KpiCard label="Descontos"  value={fmtBRL(Math.abs(g.discounts))} accent="warning" />}
        {g.bonifications > 0 && <KpiCard label="Bonificações" value={fmtBRL(g.bonifications)} accent="warning" />}
      </div>

      {/* ── Insights automáticos ─────────────────────────────────────── */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
          Análise Automática
        </p>
        <InsightsStrip insights={insights} />
      </div>

      {/* ── Charts ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        <RevenueDonut g={g} />
        <MarginGauge pct={g.profitPct} />
        {(g.totalAccountsReceivable > 0 || g.totalAccountsPayable > 0) && (
          <FinancialPosition g={g} />
        )}
      </div>

      {/* ── Meta mensal ──────────────────────────────────────────────── */}
      <GoalProgress g={g} goal={goal} />

      {/* ── Devoluções ───────────────────────────────────────────────── */}
      {(g.returnsValue > 0 || g.returnsCount > 0) && (
        <Section title="Devoluções">
          <KpiCard label="Valor devolvido" value={fmtBRL(g.returnsValue)}
            sub={g.returnsCount > 0 ? `${fmtQty(g.returnsCount)} devoluções` : undefined} accent="negative" />
          {g.returnsFreight !== 0 && (
            <KpiCard label="Frete devoluções" value={fmtBRL(g.returnsFreight)} accent="negative" />
          )}
        </Section>
      )}

      {/* ── Títulos e recebíveis ─────────────────────────────────────── */}
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

      {/* ── Contas ───────────────────────────────────────────────────── */}
      <Section title="Contas">
        {g.totalAccountsReceivable !== 0 && <KpiCard label="Total c. a receber" value={fmtBRL(g.totalAccountsReceivable)}
          sub={g.totalAccountsReceivableCount > 0 ? `${fmtQty(g.totalAccountsReceivableCount)} contas` : undefined} accent="positive" />}
        {g.totalAccountsPayable !== 0 && <KpiCard label="Total c. a pagar" value={fmtBRL(g.totalAccountsPayable)}
          sub={g.totalAccountsPayableCount > 0 ? `${fmtQty(g.totalAccountsPayableCount)} contas` : undefined} accent="negative" />}
        {g.accountsPaid !== 0 && <KpiCard label="Contas pagas" value={fmtBRL(g.accountsPaid)}
          sub={g.accountsPaidCount > 0 ? `${fmtQty(g.accountsPaidCount)} contas` : undefined} accent="positive" />}
        {g.paymentAdjustment !== 0 && <KpiCard label="Ajuste pagamento" value={fmtBRL(g.paymentAdjustment)} />}
        {g.valueReceived !== 0 && <KpiCard label="Valor recebido" value={fmtBRL(g.valueReceived)} accent="positive" />}
        {g.stockBalance !== 0 && <KpiCard label="Saldo estoque" value={fmtBRL(g.stockBalance)}
          accent={g.stockBalance >= 0 ? 'neutral' : 'negative'} />}
      </Section>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VISÕES DETALHADAS — componentes
// ═══════════════════════════════════════════════════════════════════════════

function KpiStrip({ rows }: { rows: GerencialViewRow[] }) {
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0)
  const totalOrders = rows.reduce((s, r) => s + (r.orders ?? 0), 0)
  const totalItems = rows.reduce((s, r) => s + r.items, 0)
  const avgMargin = rows.length > 0 ? rows.reduce((s, r) => s + r.margin, 0) / rows.length : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
      {[
        { label: 'Faturamento Total', value: fmtBRL(totalRev) },
        { label: 'Total de Pedidos', value: totalOrders > 0 ? fmtQty(totalOrders) : '—' },
        { label: 'Qtd. de Itens', value: fmtQty(totalItems) },
        { label: 'Margem Média', value: fmtPct(avgMargin) },
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
    background: 'var(--surface-2)', borderBottom: '2px solid var(--border)',
  })

  const tdStyle = (align: 'left' | 'right' = 'right'): React.CSSProperties => ({
    padding: '9px 12px', fontSize: '13px', color: 'var(--text)',
    textAlign: align, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
  })

  const arrow = (key: SortKey) => sortBy === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''
  const hasCode = rows.some((r) => r.code)
  const hasOrders = rows.some((r) => r.orders !== undefined)

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle('name'), textAlign: 'center', width: '36px' }}>#</th>
            <th style={{ ...thStyle('name'), textAlign: 'center', width: '44px' }}>ABC</th>
            <th style={{ ...thStyle('name'), textAlign: 'left' }} onClick={() => handleSort('name')}>Nome{arrow('name')}</th>
            {hasCode && <th style={thStyle('name')}>Cód.</th>}
            {hasOrders && <th style={thStyle('items')}>Pedidos</th>}
            <th style={thStyle('items')} onClick={() => handleSort('items')}>Itens{arrow('items')}</th>
            <th style={thStyle('revenue')} onClick={() => handleSort('revenue')}>Faturamento{arrow('revenue')}</th>
            <th style={thStyle('revenue')}>Custo</th>
            <th style={thStyle('profit')} onClick={() => handleSort('profit')}>Lucro R${arrow('profit')}</th>
            <th style={thStyle('margin')} onClick={() => handleSort('margin')}>Margem %{arrow('margin')}</th>
            <th style={thStyle('pctTotal')} onClick={() => handleSort('pctTotal')}>% Total{arrow('pctTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr
              key={idx}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              style={{ background: hovered === idx ? 'rgba(201,168,76,0.06)' : idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}
            >
              <td style={{ ...tdStyle(), textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>{idx + 1}</td>
              <td style={{ ...tdStyle(), textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block', padding: '2px 7px', borderRadius: '999px',
                  fontSize: '11px', fontWeight: 700,
                  color: ABC_COLOR[row.abcClass], background: ABC_BG[row.abcClass],
                }}>{row.abcClass}</span>
              </td>
              <td style={{ ...tdStyle('left'), fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</td>
              {hasCode && <td style={{ ...tdStyle(), color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{row.code ?? '—'}</td>}
              {hasOrders && <td style={tdStyle()}>{row.orders !== undefined ? fmtQty(row.orders) : '—'}</td>}
              <td style={tdStyle()}>{fmtQty(row.items)}</td>
              <td style={{ ...tdStyle(), fontWeight: 700 }}>{fmtBRL(row.revenue)}</td>
              <td style={{ ...tdStyle(), color: 'var(--text-muted)' }}>{fmtBRL(row.cost)}</td>
              <td style={{ ...tdStyle(), color: row.profit >= 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 600 }}>{fmtBRL(row.profit)}</td>
              <td style={{ ...tdStyle(), color: row.margin >= 120 ? 'var(--positive)' : row.margin >= 80 ? 'var(--warning)' : 'var(--negative)', fontWeight: 700 }}>{fmtPct(row.margin)}</td>
              <td style={{ ...tdStyle(), color: 'var(--text-dim)' }}>{fmtPct(row.pctTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ViewTooltipProps { active?: boolean; payload?: Array<{ payload: { name: string; revenue: number; margin: number; abcClass: 'A' | 'B' | 'C' } }> }
function ViewTooltip({ active, payload }: ViewTooltipProps) {
  if (!active || !payload?.[0]?.payload) return null
  const d = payload[0].payload
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: '12px' }}>
      <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px', maxWidth: '180px' }}>{d.name}</p>
      <p style={{ color: 'var(--text-dim)' }}>Fat: <strong style={{ color: 'var(--text)' }}>{fmtBRL(d.revenue)}</strong></p>
      <p style={{ color: 'var(--text-dim)' }}>Margem: <strong style={{ color: ABC_COLOR[d.abcClass] }}>{fmtPct(d.margin)}</strong></p>
    </div>
  )
}

function ViewChart({ rows }: { rows: GerencialViewRow[] }) {
  const top10 = [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((r) => ({
    name: r.name.length > 22 ? r.name.slice(0, 20) + '…' : r.name,
    revenue: r.revenue, margin: r.margin, abcClass: r.abcClass,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
        {(['A', 'B', 'C'] as const).map((cls) => (
          <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-dim)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: ABC_COLOR[cls] }} />
            {cls === 'A' ? '≤75%' : cls === 'B' ? '75–95%' : '>95%'}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" dataKey="revenue" tickFormatter={fmtBRLShort}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={140}
            tick={{ fontSize: 11, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ViewTooltip />} cursor={{ fill: 'rgba(201,168,76,0.06)' }} />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={22}>
            {top10.map((entry, idx) => <Cell key={idx} fill={ABC_COLOR[entry.abcClass]} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

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

// ═══════════════════════════════════════════════════════════════════════════
// SUB-TAB BAR
// ═══════════════════════════════════════════════════════════════════════════
type ActiveSubTab = 'geral' | GerencialViewType

function SubTabBar({ active, onChange, hasGeral, loadedViews }: {
  active: ActiveSubTab; onChange: (t: ActiveSubTab) => void
  hasGeral: boolean; loadedViews: Set<GerencialViewType>
}) {
  const btnStyle = (isActive: boolean, isDisabled: boolean): React.CSSProperties => ({
    padding: '8px 14px', fontSize: '12px', fontWeight: isActive ? 700 : 500,
    background: isActive ? 'var(--surface)' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
    color: isActive ? 'var(--navy)' : isDisabled ? 'var(--text-muted)' : 'var(--text-dim)',
    cursor: isDisabled ? 'default' : 'pointer',
    opacity: isDisabled ? 0.4 : 1,
    whiteSpace: 'nowrap', transition: 'background 0.12s ease, color 0.12s ease',
    fontFamily: 'var(--font-sans)',
  })

  return (
    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
      <button style={btnStyle(active === 'geral', !hasGeral)} onClick={() => hasGeral && onChange('geral')}
        onMouseEnter={(e) => { if (active !== 'geral' && hasGeral) e.currentTarget.style.background = 'var(--surface-2)' }}
        onMouseLeave={(e) => { if (active !== 'geral') e.currentTarget.style.background = 'transparent' }}>
        Geral
      </button>
      {VIEW_ORDER.map(({ type, label }) => {
        const loaded = loadedViews.has(type)
        const isActive = active === type
        return (
          <button key={type} style={btnStyle(isActive, !loaded)}
            onClick={() => loaded && onChange(type)}
            onMouseEnter={(e) => { if (!isActive && loaded) e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
            {label}
            {loaded && <span style={{ marginLeft: '5px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--positive)', display: 'inline-block', verticalAlign: 'middle' }} />}
          </button>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function TabGerencial() {
  const gerencial = useDashboardStore((s) => s.gerencial)
  const gerencialViews = useDashboardStore((s) => s.gerencialViews)
  const goal = useDashboardStore((s) => s.goal)

  const loadedViews = new Set(Object.keys(gerencialViews) as GerencialViewType[])
  const defaultTab: ActiveSubTab = gerencial ? 'geral' : (loadedViews.values().next().value ?? 'geral')
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>(defaultTab)

  if (!gerencial && loadedViews.size === 0) return null

  const activeView = activeSubTab !== 'geral' ? gerencialViews[activeSubTab as GerencialViewType] : undefined

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>

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

      <SubTabBar
        active={activeSubTab}
        onChange={setActiveSubTab}
        hasGeral={!!gerencial}
        loadedViews={loadedViews}
      />

      {activeSubTab === 'geral' && gerencial && <GeralView g={gerencial} goal={goal} />}
      {activeSubTab !== 'geral' && activeView && <DetailView view={activeView} />}
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
