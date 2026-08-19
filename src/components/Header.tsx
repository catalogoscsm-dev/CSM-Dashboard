import { useState } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { exportDashboardPdf } from '../utils/exportPdf'
import { exportExcel } from '../utils/exportExcel'
import CsmLogo from './CsmLogo'

export default function Header() {
  const report = useDashboardStore((s) => s.report)
  const reset = useDashboardStore((s) => s.reset)
  const saveToHistory = useDashboardStore((s) => s.saveToHistory)
  const togglePresentationMode = useDashboardStore((s) => s.togglePresentationMode)
  const [exporting, setExporting] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleExportPdf = async () => {
    if (!report || exporting) return
    setExporting(true)
    try {
      await exportDashboardPdf(report)
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = () => {
    if (!report) return
    exportExcel(report)
  }

  const handleSave = () => {
    saveToHistory()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Left: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <CsmLogo size={32} />
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--gold)', letterSpacing: '-0.3px' }}>
            CSM Dashboard
          </span>
        </div>

        {/* Center: company + period */}
        {report && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1px',
            overflow: 'hidden',
          }}>
            <span style={{
              fontWeight: 600, fontSize: '14px', color: 'var(--text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
            }}>
              {report.company}
            </span>
            {report.period && (
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{report.period}</span>
            )}
          </div>
        )}

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
          {report?.generatedAt && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>
              {report.generatedAt}
            </span>
          )}

          {report && (
            <>
              {/* Salvar no histórico */}
              <button
                onClick={handleSave}
                title="Salvar no histórico"
                style={{
                  background: saved ? 'var(--positive-bg)' : 'transparent',
                  color: saved ? 'var(--positive)' : 'var(--text-dim)',
                  border: `1px solid ${saved ? 'var(--positive)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 13px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                </svg>
                {saved ? 'Salvo!' : 'Salvar'}
              </button>

              {/* Exportar Excel */}
              <button
                onClick={handleExportExcel}
                title="Exportar para Excel (.xlsx)"
                style={{
                  background: 'var(--warning-bg)',
                  color: '#92400E',
                  border: '1px solid var(--warning)',
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 13px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FDE68A')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--warning-bg)')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
                Excel
              </button>

              {/* Exportar PDF */}
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                title="Exportar dashboard como PDF"
                style={{
                  background: exporting ? 'var(--surface-2)' : 'var(--positive-bg)',
                  color: exporting ? 'var(--text-muted)' : 'var(--positive)',
                  border: `1px solid ${exporting ? 'var(--border)' : 'var(--positive)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 13px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  opacity: exporting ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.background = '#A7F3D0' }}
                onMouseLeave={(e) => { if (!exporting) e.currentTarget.style.background = 'var(--positive-bg)' }}
              >
                {exporting ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    Exportando…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    PDF
                  </>
                )}
              </button>

              {/* Modo Apresentação */}
              <button
                onClick={togglePresentationMode}
                title="Modo apresentação (TV/reunião)"
                style={{
                  background: 'transparent',
                  color: 'var(--navy)',
                  border: '1px solid var(--gold)',
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 13px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.borderColor = 'var(--gold)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                Apresentar
              </button>
            </>
          )}

          {/* Importar novo */}
          <button
            onClick={reset}
            style={{
              background: 'var(--navy)',
              color: 'var(--gold)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-l)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--navy)')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importar
          </button>
        </div>
      </div>
    </header>
  )
}
