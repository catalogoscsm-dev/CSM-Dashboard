// ============================================================
// CSM Dashboard — Tipos principais
// ============================================================

export type AppTab = 'dashboard' | 'comparacao' | 'devolucoes' | 'historico' | 'gerencial' | 'tutorial'

export interface CompanyProfile {
  id: string    // crypto.randomUUID()
  name: string  // extraído automaticamente do HTML
}

export interface MonthlyGoal {
  revenue: number
  profit: number
}

export interface AlertThresholds {
  lowMarginPct: number
  highMarginPct: number
}

export interface HistoryEntry {
  id: string
  companyId: string
  label: string
  savedAt: string
  report: ReportData
}

// ── Relatório Gerencial — KPIs financeiros planos ─────────────────────────
export interface GerencialData {
  company: string
  period: string
  generatedAt: string
  // Vendas
  orderCount: number
  itemCount: number
  grossRevenue: number
  netRevenue: number
  cost: number
  profitValue: number
  profitPct: number
  bonifications: number
  discounts: number
  pdvRevenue: number
  pdvCount: number
  // Devoluções
  returnsValue: number
  returnsCount: number
  returnsFreight: number
  // Financeiro
  titlesOpen: number
  titlesOpenCount: number
  titlesPaid: number
  titlesPaidCount: number
  titlesLoose: number
  titlesLooseCount: number
  checkReceivable: number
  cardReceivable: number
  openOrders: number
  openOrdersCount: number
  totalReceivable: number
  // Contas
  totalAccountsReceivable: number
  totalAccountsReceivableCount: number
  totalAccountsPayable: number
  totalAccountsPayableCount: number
  accountsPaid: number
  accountsPaidCount: number
  // Pagamento
  paymentAdjustment: number
  valueReceived: number
  // Estoque
  stockBalance: number
}

// ── Relatório Gerencial — Visões detalhadas (Clientes, Vendedores, etc.) ──
export type GerencialViewType =
  | 'clientes'
  | 'vendedores'
  | 'linhasProdutos'
  | 'segmento'
  | 'cidades'
  | 'area'
  | 'condicaoPgto'
  | 'fornecedores'
  | 'supervisores'

export interface GerencialViewRow {
  code?: string       // código do cliente/fornecedor (ausente em algumas visões)
  name: string
  orders?: number     // pedidos ("2pd" → 2)
  items: number
  revenue: number     // faturamento
  cost: number
  profit: number      // lucro R$
  margin: number      // lucro %
  pctTotal: number    // % do total
  abcClass: 'A' | 'B' | 'C'  // A≤75%, B≤95%, C>95% do acumulado
}

export interface GerencialView {
  type: GerencialViewType
  label: string       // "Clientes", "Vendedores", etc.
  rows: GerencialViewRow[]
  period: string
  company: string
  generatedAt: string
}

// ── Relatório de Vendas ───────────────────────────────────────────────────
export interface Product {
  code: string
  name: string
  qty: number
  unit: string
  revenue: number
  cost: number
  profit: number
  margin: number
  isReturn: boolean
}

export interface CategoryTotals {
  qty: number
  revenue: number
  cost: number
  profit: number
  margin: number
}

export interface Category {
  name: string
  products: Product[]
  totals: CategoryTotals
}

export interface ReportData {
  company: string
  period: string
  generatedAt: string
  categories: Category[]
  grandTotal: {
    qty: number
    revenue: number
    cost: number
    profit: number
    margin: number
  }
}
