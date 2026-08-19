import { useDashboardStore } from '../store/useDashboardStore'
import type { GerencialData } from '../types'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtPct(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
}

function fmtQty(v: number) {
  return v.toLocaleString('pt-BR')
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string
  value: string
  sub?: string
  accent?: 'positive' | 'negative' | 'warning' | 'neutral'
  wide?: boolean
}

function KpiCard({ label, value, sub, accent = 'neutral', wide }: KpiCardProps) {
  const accentColor: Record<string, string> = {
    positive: 'var(--positive)',
    negative: 'var(--negative)',
    warning: 'var(--warning)',
    neutral: 'var(--text-dim)',
  }
  const accentBg: Record<string, string> = {
    positive: 'rgba(16,185,129,0.06)',
    negative: 'rgba(244,63,94,0.06)',
    warning: 'rgba(245,158,11,0.06)',
    neutral: 'var(--surface-2)',
  }
  return (
    <div style={{
      background: accentBg[accent],
      border: `1px solid ${accent === 'neutral' ? 'var(--border)' : accentColor[accent]}22`,
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      gridColumn: wide ? 'span 2' : undefined,
      minWidth: 0,
    }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {label}
      </span>
      <span style={{ fontSize: '20px', fontWeight: 800, color: accentColor[accent], letterSpacing: '-0.5px' }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</span>
      )}
    </div>
  )
}

// ── Seção ─────────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{
        fontSize: '13px', fontWeight: 700, color: 'var(--text-dim)',
        textTransform: 'uppercase', letterSpacing: '0.8px',
        marginBottom: '12px', paddingBottom: '8px',
        borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '12px',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Tab principal ─────────────────────────────────────────────────────────────
export default function TabGerencial() {
  const gerencial = useDashboardStore((s) => s.gerencial) as GerencialData

  if (!gerencial) return null

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>
            Relatório Gerencial
          </h1>
          {gerencial.period && (
            <span style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--text-dim)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '3px 10px',
            }}>
              {gerencial.period}
            </span>
          )}
        </div>
        {gerencial.generatedAt && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            Gerado em {gerencial.generatedAt}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ── Seção 1: Vendas ─────────────────────────────────────────────── */}
        <Section title="Vendas">
          <KpiCard
            label="Fat. Bruto"
            value={fmtBRL(gerencial.grossRevenue)}
            accent="neutral"
          />
          <KpiCard
            label="Fat. Líquido"
            value={fmtBRL(gerencial.netRevenue)}
            accent="positive"
          />
          <KpiCard
            label="Custo"
            value={fmtBRL(gerencial.cost)}
            accent="neutral"
          />
          <KpiCard
            label="Lucro (R$)"
            value={fmtBRL(gerencial.profitValue)}
            accent={gerencial.profitValue >= 0 ? 'positive' : 'negative'}
          />
          <KpiCard
            label="Margem (%)"
            value={fmtPct(gerencial.profitPct)}
            accent={gerencial.profitPct >= 30 ? 'positive' : gerencial.profitPct >= 15 ? 'warning' : 'negative'}
          />
          <KpiCard
            label="Pedidos"
            value={fmtQty(gerencial.orderCount)}
            sub={`${fmtQty(gerencial.itemCount)} itens`}
            accent="neutral"
          />
          {gerencial.pdvRevenue > 0 && (
            <KpiCard
              label="Vendas PDV"
              value={fmtBRL(gerencial.pdvRevenue)}
              sub={gerencial.pdvCount > 0 ? `${fmtQty(gerencial.pdvCount)} pedidos` : undefined}
              accent="neutral"
            />
          )}
          {gerencial.bonifications > 0 && (
            <KpiCard
              label="Bonificações"
              value={fmtBRL(gerencial.bonifications)}
              accent="warning"
            />
          )}
          {gerencial.discounts !== 0 && (
            <KpiCard
              label="Descontos"
              value={fmtBRL(Math.abs(gerencial.discounts))}
              accent="warning"
            />
          )}
        </Section>

        {/* ── Seção 2: Devoluções ─────────────────────────────────────────── */}
        {(gerencial.returnsValue > 0 || gerencial.returnsCount > 0) && (
          <Section title="Devoluções">
            <KpiCard
              label="Valor devolvido"
              value={fmtBRL(gerencial.returnsValue)}
              sub={gerencial.returnsCount > 0 ? `${fmtQty(gerencial.returnsCount)} devoluções` : undefined}
              accent="negative"
            />
            {gerencial.returnsFreight !== 0 && (
              <KpiCard
                label="Frete devoluções"
                value={fmtBRL(gerencial.returnsFreight)}
                accent="negative"
              />
            )}
          </Section>
        )}

        {/* ── Seção 3: Títulos / Recebíveis ───────────────────────────────── */}
        <Section title="Títulos e Recebíveis">
          {gerencial.titlesOpen !== 0 && (
            <KpiCard
              label="Títulos em aberto"
              value={fmtBRL(gerencial.titlesOpen)}
              sub={gerencial.titlesOpenCount > 0 ? `${fmtQty(gerencial.titlesOpenCount)} títulos` : undefined}
              accent="negative"
            />
          )}
          {gerencial.titlesPaid !== 0 && (
            <KpiCard
              label="Títulos quitados"
              value={fmtBRL(gerencial.titlesPaid)}
              sub={gerencial.titlesPaidCount > 0 ? `${fmtQty(gerencial.titlesPaidCount)} títulos` : undefined}
              accent="positive"
            />
          )}
          {gerencial.titlesLoose !== 0 && (
            <KpiCard
              label="Títulos avulsos"
              value={fmtBRL(gerencial.titlesLoose)}
              sub={gerencial.titlesLooseCount > 0 ? `${fmtQty(gerencial.titlesLooseCount)} títulos` : undefined}
              accent="neutral"
            />
          )}
          {gerencial.checkReceivable !== 0 && (
            <KpiCard
              label="Cheques a receber"
              value={fmtBRL(gerencial.checkReceivable)}
              accent="neutral"
            />
          )}
          {gerencial.cardReceivable !== 0 && (
            <KpiCard
              label="Cartão a receber"
              value={fmtBRL(gerencial.cardReceivable)}
              accent="neutral"
            />
          )}
          {gerencial.openOrders !== 0 && (
            <KpiCard
              label="Pedidos em aberto"
              value={fmtBRL(gerencial.openOrders)}
              sub={gerencial.openOrdersCount > 0 ? `${fmtQty(gerencial.openOrdersCount)} pedidos` : undefined}
              accent="warning"
            />
          )}
          {gerencial.totalReceivable !== 0 && (
            <KpiCard
              label="Total a receber"
              value={fmtBRL(gerencial.totalReceivable)}
              accent="positive"
            />
          )}
        </Section>

        {/* ── Seção 4: Contas ─────────────────────────────────────────────── */}
        <Section title="Contas">
          {gerencial.totalAccountsReceivable !== 0 && (
            <KpiCard
              label="Total c. a receber"
              value={fmtBRL(gerencial.totalAccountsReceivable)}
              sub={gerencial.totalAccountsReceivableCount > 0 ? `${fmtQty(gerencial.totalAccountsReceivableCount)} contas` : undefined}
              accent="positive"
            />
          )}
          {gerencial.totalAccountsPayable !== 0 && (
            <KpiCard
              label="Total c. a pagar"
              value={fmtBRL(gerencial.totalAccountsPayable)}
              sub={gerencial.totalAccountsPayableCount > 0 ? `${fmtQty(gerencial.totalAccountsPayableCount)} contas` : undefined}
              accent="negative"
            />
          )}
          {gerencial.accountsPaid !== 0 && (
            <KpiCard
              label="Contas pagas"
              value={fmtBRL(gerencial.accountsPaid)}
              sub={gerencial.accountsPaidCount > 0 ? `${fmtQty(gerencial.accountsPaidCount)} contas` : undefined}
              accent="positive"
            />
          )}
          {gerencial.paymentAdjustment !== 0 && (
            <KpiCard
              label="Ajuste de pagamento"
              value={fmtBRL(gerencial.paymentAdjustment)}
              accent="neutral"
            />
          )}
          {gerencial.valueReceived !== 0 && (
            <KpiCard
              label="Valor recebido"
              value={fmtBRL(gerencial.valueReceived)}
              accent="positive"
            />
          )}
          {gerencial.stockBalance !== 0 && (
            <KpiCard
              label="Saldo em estoque"
              value={fmtBRL(gerencial.stockBalance)}
              accent="neutral"
            />
          )}
        </Section>

      </div>
    </div>
  )
}
