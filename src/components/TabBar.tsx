import { useDashboardStore } from '../store/useDashboardStore'
import type { AppTab } from '../types'

const TABS: { id: AppTab; label: string; icon: React.ReactNode; gerencialOnly?: boolean }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'comparacao',
    label: 'Comparação',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    id: 'devolucoes',
    label: 'Devoluções',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
      </svg>
    ),
  },
  {
    id: 'historico',
    label: 'Histórico',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    id: 'gerencial',
    label: 'Gerencial',
    gerencialOnly: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    id: 'tutorial',
    label: 'Ajuda',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
]

export default function TabBar() {
  const activeTab = useDashboardStore((s) => s.activeTab)
  const setActiveTab = useDashboardStore((s) => s.setActiveTab)
  const report = useDashboardStore((s) => s.report)
  const gerencial = useDashboardStore((s) => s.gerencial)
  const gerencialViews = useDashboardStore((s) => s.gerencialViews)
  const categories = report?.categories ?? []

  const returnCount = categories
    .flatMap((c) => c.products)
    .filter((p) => p.isReturn).length

  return (
    <div id="tour-tabbar" style={{
      position: 'sticky',
      top: '60px',
      zIndex: 100,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        gap: '2px',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          // Gerencial: habilitada somente quando gerencial !== null
          // Tutorial: sempre habilitada
          // Demais: habilitadas quando report !== null
          let isDisabled = false
          if (tab.id === 'tutorial') isDisabled = false
          else if (tab.gerencialOnly) isDisabled = !gerencial && Object.keys(gerencialViews).length === 0
          else isDisabled = !report

          const showBadge = tab.id === 'devolucoes' && returnCount > 0

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '12px 16px',
                background: isActive ? 'var(--surface-2)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                borderRadius: isActive ? 'var(--radius-sm) var(--radius-sm) 0 0' : 0,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.4 : 1,
                color: isActive ? 'var(--navy)' : 'var(--text-dim)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && !isActive) e.currentTarget.style.background = 'var(--surface-2)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              {tab.icon}
              {tab.label}
              {showBadge && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#fff',
                  background: 'var(--negative)',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  lineHeight: 1.4,
                }}>
                  {returnCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
