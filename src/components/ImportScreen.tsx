import { useRef, useState, useCallback } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { readFileAsWindows1252 } from '../utils/parser'
import { detectReportType } from '../utils/parserGerencial'
import CsmLogo from './CsmLogo'
import { fmtBRL } from '../utils/format'

export default function ImportScreen() {
  const loadReport = useDashboardStore((s) => s.loadReport)
  const loadGerencial = useDashboardStore((s) => s.loadGerencial)
  const history = useDashboardStore((s) => s.history)
  const activeCompanyId = useDashboardStore((s) => s.activeCompanyId)
  const loadFromHistory = useDashboardStore((s) => s.loadFromHistory)
  const setActiveTab = useDashboardStore((s) => s.setActiveTab)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.htm') && !file.name.toLowerCase().endsWith('.html')) {
      setError('Selecione um arquivo .HTM exportado pelo Vinhasoft.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const html = await readFileAsWindows1252(file)
      const type = detectReportType(html)
      if (type === 'gerencial') loadGerencial(html)
      else loadReport(html)
    } catch {
      setError('Erro ao ler o arquivo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [loadReport, loadGerencial])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const loadExample = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/reference/Vendas.htm')
      const buffer = await res.arrayBuffer()
      const html = new TextDecoder('windows-1252').decode(buffer)
      loadReport(html)
    } catch {
      setError('Erro ao carregar o arquivo de exemplo.')
    } finally {
      setLoading(false)
    }
  }

  // Filtra histórico pela empresa ativa (ou mostra tudo se ainda não há empresa ativa)
  const filteredHistory = activeCompanyId
    ? history.filter((e) => e.companyId === activeCompanyId)
    : history

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '32px',
      padding: '24px',
      animation: 'fadeSlideUp 0.5s ease both',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ animation: 'fadeSlideUp 0.6s ease 0.1s both' }}>
          <CsmLogo size={80} />
        </div>
        <h1 style={{
          color: 'var(--gold)',
          fontSize: '32px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          animation: 'fadeSlideUp 0.6s ease 0.2s both',
        }}>
          CSM Dashboard
        </h1>
        <p style={{
          color: 'var(--text-on-dark)',
          opacity: 0.6,
          fontSize: '14px',
          animation: 'fadeSlideUp 0.6s ease 0.3s both',
        }}>
          Campinas Shopping Móveis — Business Intelligence
        </p>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          width: '100%',
          maxWidth: '480px',
          border: `2px dashed ${dragging ? 'var(--gold-light)' : 'var(--gold)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '48px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          cursor: 'pointer',
          background: dragging ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.03)',
          transition: 'all 0.2s ease',
          animation: dragging ? 'none' : 'importPulse 3s ease-in-out infinite',
          boxShadow: dragging ? '0 0 32px rgba(201,168,76,0.2)' : 'none',
        }}
        onClick={() => inputRef.current?.click()}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p style={{ color: 'var(--text-on-dark)', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>
          Arraste o relatório <span style={{ color: 'var(--gold)', fontWeight: 700 }}>.HTM</span> do Vinhasoft aqui
        </p>
        <p style={{ color: 'var(--text-on-dark)', opacity: 0.5, fontSize: '13px' }}>
          ou clique para selecionar (Vendas ou Gerencial)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".htm,.html"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {loading && (
        <p style={{ color: 'var(--gold)', fontSize: '14px', animation: 'pulse 1s ease-in-out infinite' }}>
          Processando relatório…
        </p>
      )}

      {error && (
        <p style={{ color: 'var(--negative)', fontSize: '14px', background: 'var(--negative-bg)', padding: '10px 16px', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </p>
      )}

      <button
        onClick={loadExample}
        disabled={loading}
        style={{
          background: 'transparent',
          border: '1px solid rgba(201,168,76,0.3)',
          color: 'var(--gold)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 24px',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.5 : 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)', e.currentTarget.style.background = 'rgba(201,168,76,0.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)', e.currentTarget.style.background = 'transparent')}
      >
        Carregar exemplo (Agosto 2026)
      </button>

      {filteredHistory.length > 0 && (
        <div style={{
          width: '100%',
          maxWidth: '480px',
          animation: 'fadeSlideUp 0.6s ease 0.5s both',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', textAlign: 'center' }}>
            Relatórios recentes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredHistory.slice(0, 5).map((entry) => (
              <button
                key={entry.id}
                onClick={() => loadFromHistory(entry.id)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: 'var(--text-on-dark)',
                  fontSize: '13px',
                  transition: 'background 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                <span style={{ fontWeight: 600 }}>{entry.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                  {fmtBRL(entry.report.grandTotal.revenue)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ajuda link */}
      <button
        onClick={() => setActiveTab('tutorial')}
        style={{
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.35)', fontSize: '12px',
          cursor: 'pointer', padding: '4px 8px',
          display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Ajuda &amp; Tutorial
      </button>

      <style>{`
        @keyframes importPulse {
          0%, 100% { border-color: var(--gold); }
          50% { border-color: rgba(201,168,76,0.4); }
        }
      `}</style>
    </div>
  )
}
