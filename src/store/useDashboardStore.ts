// ============================================================
// CSM Dashboard — Store Zustand
// ============================================================
import { create } from 'zustand'
import type {
  ReportData, AppTab, MonthlyGoal, AlertThresholds,
  HistoryEntry, CompanyProfile, GerencialData,
  GerencialView, GerencialViewType,
} from '../types'
import { parseVinhasoftHTML } from '../utils/parser'
import { parseGerencialHTML } from '../utils/parserGerencial'
import { parseGerencialViewHTML } from '../utils/parserGerencialViews'

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) ?? fallback
  } catch {
    return fallback
  }
}

const DEFAULT_GOAL: MonthlyGoal = { revenue: 0, profit: 0 }
const DEFAULT_THRESHOLDS: AlertThresholds = { lowMarginPct: 120, highMarginPct: 200 }

function historyKey(id: string) { return `csm-history-${id}` }
function goalKey(id: string)    { return `csm-goal-${id}` }
function thresholdsKey(id: string) { return `csm-thresholds-${id}` }

interface DashboardStore {
  report: ReportData | null
  reportB: ReportData | null
  isComparing: boolean
  activeCategory: string | null
  searchQuery: string
  showReturnsOnly: boolean

  // Navigation
  activeTab: AppTab
  isPresentationMode: boolean

  // Multi-company
  companies: CompanyProfile[]
  activeCompanyId: string | null
  gerencial: GerencialData | null
  gerencialViews: Partial<Record<GerencialViewType, GerencialView>>

  // Per-company persistence
  history: HistoryEntry[]
  goal: MonthlyGoal
  thresholds: AlertThresholds

  // Core actions
  loadReport: (html: string) => void
  loadReportB: (html: string) => void
  clearReportB: () => void
  loadGerencial: (html: string) => void
  loadGerencialView: (html: string) => void
  clearGerencial: () => void
  setActiveCategory: (cat: string | null) => void
  setSearchQuery: (q: string) => void
  toggleReturnsOnly: () => void
  reset: () => void

  // Navigation actions
  setActiveTab: (tab: AppTab) => void
  togglePresentationMode: () => void

  // Company actions
  ensureCompany: (name: string) => string
  setActiveCompany: (id: string) => void

  // History actions
  saveToHistory: (label?: string) => void
  deleteFromHistory: (id: string) => void
  setHistoryLabel: (id: string, label: string) => void
  loadFromHistory: (id: string) => void

  // Goal & thresholds
  setGoal: (g: Partial<MonthlyGoal>) => void
  setThresholds: (t: Partial<AlertThresholds>) => void
}

const initialCompanies = loadLS<CompanyProfile[]>('csm-companies', [])
const initialCompanyId = initialCompanies[0]?.id ?? null
const initialHistory   = initialCompanyId ? loadLS<HistoryEntry[]>(historyKey(initialCompanyId), []) : []
const initialGoal      = initialCompanyId ? loadLS<MonthlyGoal>(goalKey(initialCompanyId), DEFAULT_GOAL) : DEFAULT_GOAL
const initialThresholds= initialCompanyId ? loadLS<AlertThresholds>(thresholdsKey(initialCompanyId), DEFAULT_THRESHOLDS) : DEFAULT_THRESHOLDS

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  report: null,
  reportB: null,
  isComparing: false,
  activeCategory: null,
  searchQuery: '',
  showReturnsOnly: false,

  activeTab: 'dashboard',
  isPresentationMode: false,

  companies: initialCompanies,
  activeCompanyId: initialCompanyId,
  gerencial: null,
  gerencialViews: {},

  history: initialHistory,
  goal: initialGoal,
  thresholds: initialThresholds,

  // ── Company ────────────────────────────────────────────────────────────

  ensureCompany: (name: string) => {
    const { companies } = get()
    const existing = companies.find((c) => c.name === name)
    if (existing) return existing.id
    const id = crypto.randomUUID()
    const updated = [...companies, { id, name }]
    localStorage.setItem('csm-companies', JSON.stringify(updated))
    set({ companies: updated })
    return id
  },

  setActiveCompany: (id: string) => {
    const history   = loadLS<HistoryEntry[]>(historyKey(id), [])
    const goal      = loadLS<MonthlyGoal>(goalKey(id), DEFAULT_GOAL)
    const thresholds= loadLS<AlertThresholds>(thresholdsKey(id), DEFAULT_THRESHOLDS)
    set({
      activeCompanyId: id,
      history,
      goal,
      thresholds,
      report: null,
      reportB: null,
      gerencial: null,
      gerencialViews: {},
      isComparing: false,
      activeCategory: null,
      searchQuery: '',
      showReturnsOnly: false,
      activeTab: 'dashboard',
    })
  },

  // ── Core ───────────────────────────────────────────────────────────────

  loadReport: (html: string) => {
    const report = parseVinhasoftHTML(html)
    const companyId = get().ensureCompany(report.company)
    const history   = loadLS<HistoryEntry[]>(historyKey(companyId), [])
    const goal      = loadLS<MonthlyGoal>(goalKey(companyId), DEFAULT_GOAL)
    const thresholds= loadLS<AlertThresholds>(thresholdsKey(companyId), DEFAULT_THRESHOLDS)
    set((state) => ({
      report,
      reportB: state.report ?? null,
      isComparing: !!state.report,
      activeCategory: null,
      searchQuery: '',
      showReturnsOnly: false,
      activeTab: 'dashboard',
      activeCompanyId: companyId,
      history,
      goal,
      thresholds,
    }))
  },

  loadReportB: (html: string) => {
    const reportB = parseVinhasoftHTML(html)
    set({ reportB, isComparing: true })
  },

  clearReportB: () => set({ reportB: null, isComparing: false }),

  loadGerencial: (html: string) => {
    const gerencial = parseGerencialHTML(html)
    const companyId = get().ensureCompany(gerencial.company)
    const history   = loadLS<HistoryEntry[]>(historyKey(companyId), [])
    const goal      = loadLS<MonthlyGoal>(goalKey(companyId), DEFAULT_GOAL)
    const thresholds= loadLS<AlertThresholds>(thresholdsKey(companyId), DEFAULT_THRESHOLDS)
    set({
      gerencial,
      activeCompanyId: companyId,
      history,
      goal,
      thresholds,
      activeTab: 'gerencial',
    })
  },

  loadGerencialView: (html: string) => {
    const view = parseGerencialViewHTML(html)
    if (!view) return
    if (view.company) get().ensureCompany(view.company)
    set((state) => ({
      gerencialViews: { ...state.gerencialViews, [view.type]: view },
      activeTab: 'gerencial',
    }))
  },

  clearGerencial: () => set({ gerencial: null, gerencialViews: {} }),

  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleReturnsOnly: () => set((state) => ({ showReturnsOnly: !state.showReturnsOnly })),

  reset: () =>
    set({
      report: null,
      reportB: null,
      isComparing: false,
      activeCategory: null,
      searchQuery: '',
      showReturnsOnly: false,
      activeTab: 'dashboard',
      isPresentationMode: false,
      gerencial: null,
      gerencialViews: {},
    }),

  // ── Navigation ─────────────────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),
  togglePresentationMode: () =>
    set((state) => ({ isPresentationMode: !state.isPresentationMode })),

  // ── History ────────────────────────────────────────────────────────────

  saveToHistory: (label?: string) => {
    const { report, history, activeCompanyId } = get()
    if (!report || !activeCompanyId) return
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      companyId: activeCompanyId,
      label: label ?? report.period ?? new Date().toLocaleDateString('pt-BR'),
      savedAt: new Date().toISOString(),
      report: JSON.parse(JSON.stringify(report)),
    }
    const filtered = history.filter((e) => e.label !== entry.label)
    const updated = [entry, ...filtered].slice(0, 24)
    localStorage.setItem(historyKey(activeCompanyId), JSON.stringify(updated))
    set({ history: updated })
  },

  deleteFromHistory: (id: string) => {
    const { activeCompanyId } = get()
    set((state) => {
      const updated = state.history.filter((e) => e.id !== id)
      if (activeCompanyId) localStorage.setItem(historyKey(activeCompanyId), JSON.stringify(updated))
      return { history: updated }
    })
  },

  setHistoryLabel: (id: string, label: string) => {
    const { activeCompanyId } = get()
    set((state) => {
      const updated = state.history.map((e) => (e.id === id ? { ...e, label } : e))
      if (activeCompanyId) localStorage.setItem(historyKey(activeCompanyId), JSON.stringify(updated))
      return { history: updated }
    })
  },

  loadFromHistory: (id: string) => {
    const entry = get().history.find((e) => e.id === id)
    if (!entry) return
    set({
      report: entry.report,
      reportB: null,
      isComparing: false,
      activeCategory: null,
      searchQuery: '',
      showReturnsOnly: false,
      activeTab: 'dashboard',
    })
  },

  // ── Goal & Thresholds ──────────────────────────────────────────────────

  setGoal: (g) => {
    const { activeCompanyId } = get()
    set((state) => {
      const updated = { ...state.goal, ...g }
      if (activeCompanyId) localStorage.setItem(goalKey(activeCompanyId), JSON.stringify(updated))
      return { goal: updated }
    })
  },

  setThresholds: (t) => {
    const { activeCompanyId } = get()
    set((state) => {
      const updated = { ...state.thresholds, ...t }
      if (activeCompanyId) localStorage.setItem(thresholdsKey(activeCompanyId), JSON.stringify(updated))
      return { thresholds: updated }
    })
  },
}))
