// ============================================================
// CSM Dashboard — Tipos principais
// ============================================================

export type AppTab = 'dashboard' | 'comparacao' | 'devolucoes' | 'historico' | 'tutorial'

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
  label: string
  savedAt: string
  report: ReportData
}

export interface Product {
  code: string
  name: string
  qty: number
  unit: string
  revenue: number      // Valor total
  cost: number         // Vr. compr.
  profit: number       // Lucro
  margin: number       // Lucro %
  isReturn: boolean    // qty < 0
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
  company: string        // Nome da empresa
  period: string         // "01/08/2026 a 31/08/2026"
  generatedAt: string    // Data/hora de geração
  categories: Category[]
  grandTotal: {
    qty: number
    revenue: number
    cost: number
    profit: number
    margin: number
  }
}
