// ============================================================
// CSM Dashboard — Store Zustand
// ============================================================
import { create } from 'zustand'
import type { ReportData, AppTab, MonthlyGoal, AlertThresholds, HistoryEntry } from '../types'
import { parseVinhasoftHTML } from '../utils/parser'

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

  // Persistence
  history: HistoryEntry[]
  goal: MonthlyGoal
  thresholds: AlertThresholds

  // Core actions
  loadReport: (html: string) => void
  loadReportB: (html: string) => void
  clearReportB: () => void
  setActiveCategory: (cat: string | null) => void
  setSearchQuery: (q: string) => void
  toggleReturnsOnly: () => void
  reset: () => void

  // Navigation actions
  setActiveTab: (tab: AppTab) => void
  togglePresentationMode: () => void

  // History actions
  saveToHistory: (label?: string) => void
  deleteFromHistory: (id: string) => void
  setHistoryLabel: (id: string, label: string) => void
  loadFromHistory: (id: string) => void

  // Goal & thresholds
  setGoal: (g: Partial<MonthlyGoal>) => void
  setThresholds: (t: Partial<AlertThresholds>) => void
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  report: null,
  reportB: null,
  isComparing: false,
  activeCategory: null,
  searchQuery: '',
  showReturnsOnly: false,

  activeTab: 'dashboard',
  isPresentationMode: false,

  history: loadLS<HistoryEntry[]>('csm-history', []),
  goal: loadLS<MonthlyGoal>('csm-goal', DEFAULT_GOAL),
  thresholds: loadLS<AlertThresholds>('csm-thresholds', DEFAULT_THRESHOLDS),

  // ── Core ───────────────────────────────────────────────────────────────

  loadReport: (html: string) => {
    const report = parseVinhasoftHTML(html)
    set((state) => ({
      report,
      reportB: state.report ?? null,
      isComparing: !!state.report,
      activeCategory: null,
      searchQuery: '',
      showReturnsOnly: false,
      activeTab: 'dashboard',
    }))
  },

  loadReportB: (html: string) => {
    const reportB = parseVinhasoftHTML(html)
    set({ reportB, isComparing: true })
  },

  clearReportB: () => set({ reportB: null, isComparing: false }),

  setActiveCategory: (cat) => set({ activeCategory: cat }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  toggleReturnsOnly: () =>
    set((state) => ({ showReturnsOnly: !state.showReturnsOnly })),

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
    }),

  // ── Navigation ─────────────────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),

  togglePresentationMode: () =>
    set((state) => ({ isPresentationMode: !state.isPresentationMode })),

  // ── History ────────────────────────────────────────────────────────────

  saveToHistory: (label?: string) => {
    const { report, history } = get()
    if (!report) return
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      label: label ?? report.period ?? new Date().toLocaleDateString('pt-BR'),
      savedAt: new Date().toISOString(),
      report: JSON.parse(JSON.stringify(report)),
    }
    // Remove any existing entry with same period label to avoid duplicates
    const filtered = history.filter((e) => e.label !== entry.label)
    const updated = [entry, ...filtered].slice(0, 24)
    set({ history: updated })
  },

  deleteFromHistory: (id: string) => {
    set((state) => ({ history: state.history.filter((e) => e.id !== id) }))
  },

  setHistoryLabel: (id: string, label: string) => {
    set((state) => ({
      history: state.history.map((e) => (e.id === id ? { ...e, label } : e)),
    }))
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

  setGoal: (g) =>
    set((state) => ({ goal: { ...state.goal, ...g } })),

  setThresholds: (t) =>
    set((state) => ({ thresholds: { ...state.thresholds, ...t } })),
}))

// ── localStorage persistence ───────────────────────────────────────────
useDashboardStore.subscribe((state) => {
  localStorage.setItem('csm-history', JSON.stringify(state.history))
})

useDashboardStore.subscribe((state) => {
  localStorage.setItem('csm-goal', JSON.stringify(state.goal))
})

useDashboardStore.subscribe((state) => {
  localStorage.setItem('csm-thresholds', JSON.stringify(state.thresholds))
})
