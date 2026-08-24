import { useState, useRef, useEffect } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { exportDashboardPdf } from '../utils/exportPdf' // v2
import { exportExcel, exportGerencialExcel } from '../utils/exportExcel'
import CsmLogo from './CsmLogo'

// Cores para identificar cada empresa no dropdown
const COMPANY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function Header() {
  const report = useDashboardStore((s) => s.report)
  const gerencial = useDashboardStore((s) => s.gerencial)
  const reset = useDashboardStore((s) => s.reset)
  const saveToHistory = useDashboardStore((s) => s.saveToHistory)
  const togglePresentationMode = useDashboardStore((s) => s.togglePresentationMode)
  const gerencialViews = useDashboardStore((s) => s.gerencialViews)
  const companies = useDashboardStore((s) => s.companies)
  const activeCompanyId = useDashboardStore((s) => s.activeCompanyId)
  const setActiveCompany = useDashboardStore((s) => s.setActiveCompany)
  const [exporting, setExporting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasContent = !!(report || gerencial || Object.keys(gerencialViews ?? {}).length > 0)

  const handleExportPdf = async () => {
    if (!hasContent || exporting) return
    setExporting(true)
    try {
      const meta = gerencial
        ? { company: gerencial.company, period: gerencial.period }
        : { company: report?.company, period: report?.period, generatedAt: report?.generatedAt }
      await exportDashboardPdf(meta)
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = () => {
    if (!report) return
    exportExcel(report)
  }

  const handleExportGerencialExcel = () => {
    exportGerencialExcel(gerencial, gerencialViews)
  }

  const handleSave = () => {
    saveToHistory()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activeCompany = companies.find((c) => c.id === activeCompanyId)
  const activeCompanyIndex = companies.findIndex((c) => c.id === activeCompanyId)
  const activeColor = COMPANY_COLORS[activeCompanyIndex % COMPANY_COLORS.length] ?? '#3B82F6'

  // Nome e período a exibir no centro (gerencial ou vendas)
  const centerName = gerencial ? gerencial.company : report?.company
  const centerPeriod = gerencial ? gerencial.period : report?.period

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      borderTop: '3px solid var(--gold)',
      boxShadow: '0 2px 16px rgba(249,115,22,0.10)',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      overflow: 'hidden',
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
        {/* Linha de brilho que varre o header */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '60px', height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.12), transparent)',
          animation: 'headerSheen 6s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Left: logo + company dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <CsmLogo size={36} />
          <span className="brand-shimmer" style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.3px' }}>
            CSM Dashboard
          </span>

          {/* Dropdown de empresa — aparece quando há ≥1 empresa conhecida */}
          {companies.length > 0 && (
            <div ref={dropdownRef} style={{ position: 'relative', marginLeft: '8px' }}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  maxWidth: '180px',
                  transition: 'border-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {/* Bolinha de cor da empresa ativa */}
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: activeColor, flexShrink: 0,
                }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeCompany?.name ?? 'Empresa'}
                </span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ flexShrink: 0, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 300,
                  minWidth: '200px',
                  overflow: 'hidden',
                }}>
                  {companies.map((company, idx) => {
                    const color = COMPANY_COLORS[idx % COMPANY_COLORS.length]
                    const isActive = company.id === activeCompanyId
                    return (
                      <button
                        key={company.id}
                        onClick={() => { setActiveCompany(company.id); setDropdownOpen(false) }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          background: isActive ? 'var(--surface-2)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? 'var(--text)' : 'var(--text-dim)',
                          textAlign: 'left',
                          transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)' }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: color, flexShrink: 0,
                        }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {company.name}
                        </span>
                        {isActive && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: company + period */}
        {centerName && (
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
              {centerName}
            </span>
            {centerPeriod && (
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{centerPeriod}</span>
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

          {/* Salvar + Excel — só para relatório de Vendas */}
          {report && (
            <>
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
            </>
          )}

          {/* Excel — relatório Gerencial (aparece quando há qualquer dado gerencial e sem relatório de vendas) */}
          {!report && hasContent && (
            <button
              onClick={handleExportGerencialExcel}
              title="Exportar Gerencial para Excel (.xlsx)"
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
          )}

          {/* PDF — disponível para qualquer conteúdo carregado */}
          {hasContent && (
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              title="Exportar como PDF"
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
          )}

          {/* Apresentar — só quando há dados estruturados (vendas OU resumo gerencial) */}
          {(report || gerencial) && (
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
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Apresentar
            </button>
          )}

          {/* Importar novo */}
          <button
            onClick={reset}
            style={{
              background: 'linear-gradient(135deg, var(--gold) 0%, #C2410C 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 12px rgba(249,115,22,0.35)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,115,22,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(249,115,22,0.35)'; e.currentTarget.style.transform = 'translateY(0)' }}
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
