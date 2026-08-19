import { useState } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { fmtBRL, fmtPct } from '../utils/format'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import CsmLogo from './CsmLogo'
import type { HistoryEntry } from '../types'

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px',
      gap: '16px',
    }}>
      <CsmLogo size={64} />
      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
        Nenhum relatório salvo ainda
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '320px' }}>
        Após importar um relatório, clique em <strong>Salvar</strong> no cabeçalho para guardar o período no histórico e acompanhar a tendência ao longo dos meses.
      </div>
    </div>
  )
}

function HistoryCard({ entry, onLoad, onDelete, onLabelChange }: {
  entry: HistoryEntry
  onLoad: () => void
  onDelete: () => void
  onLabelChange: (label: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.label)

  const date = new Date(entry.savedAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      animation: 'fadeSlideUp 0.35s ease both',
    }}>
      <div style={{ flex: 1, minWidth: '160px' }}>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { onLabelChange(draft); setEditing(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onLabelChange(draft); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
            style={{
              fontSize: '14px', fontWeight: 700, color: 'var(--navy)',
              border: '1px solid var(--gold)', borderRadius: '4px',
              padding: '2px 8px', background: 'var(--bg)', outline: 'none',
              fontFamily: 'var(--font-sans)', width: '100%',
            }}
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            title="Clique para editar o rótulo"
            style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)', cursor: 'text', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {entry.label}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
        )}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{date}</div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Faturamento</div>
          <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>
            {fmtBRL(entry.report.grandTotal.revenue)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Margem</div>
          <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--positive)' }}>
            {fmtPct(entry.report.grandTotal.margin)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Lucro</div>
          <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--positive)' }}>
            {fmtBRL(entry.report.grandTotal.profit)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={onLoad}
          style={{
            fontSize: '12px', fontWeight: 600, color: 'var(--gold)',
            background: 'transparent', border: '1px solid var(--gold)',
            borderRadius: 'var(--radius-sm)', padding: '6px 14px', cursor: 'pointer',
          }}
        >
          Carregar
        </button>
        <button
          onClick={onDelete}
          title="Excluir"
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1,
          }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}

export default function TabHistorico() {
  const history = useDashboardStore((s) => s.history)
  const deleteFromHistory = useDashboardStore((s) => s.deleteFromHistory)
  const setHistoryLabel = useDashboardStore((s) => s.setHistoryLabel)
  const loadFromHistory = useDashboardStore((s) => s.loadFromHistory)

  const STYLE = {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  }

  if (history.length === 0) {
    return (
      <div style={STYLE}>
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}>
          <EmptyState />
        </div>
      </div>
    )
  }

  // Trend chart: oldest first
  const chartData = [...history]
    .sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime())
    .map((e) => ({
      label: e.label,
      Faturamento: e.report.grandTotal.revenue,
      Lucro: e.report.grandTotal.profit,
    }))

  function handleDelete(id: string) {
    if (window.confirm('Remover este relatório do histórico?')) {
      deleteFromHistory(id)
    }
  }

  const nearCap = history.length >= 20

  return (
    <div style={STYLE}>
      {nearCap && (
        <div style={{
          background: 'var(--warning-bg)',
          border: '1px solid var(--warning)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          fontSize: '13px',
          color: '#92400E',
          fontWeight: 500,
        }}>
          ⚠ Você tem {history.length}/24 relatórios salvos. Exclua entradas antigas para liberar espaço.
        </div>
      )}

      {/* Trend chart */}
      {history.length >= 2 && (
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '20px' }}>
            Tendência Histórica
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--text-dim)' }} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} fontSize={11} tick={{ fill: 'var(--text-dim)' }} />
              <Tooltip
                formatter={(value: number, name: string) => [fmtBRL(value), name]}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend formatter={(value) => <span style={{ fontSize: '12px', color: 'var(--text)' }}>{value}</span>} />
              <Line type="monotone" dataKey="Faturamento" stroke="var(--navy)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Lucro" stroke="var(--positive)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {history.length === 1 && (
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          border: '1px dashed var(--border)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}>
          Adicione mais relatórios para ver a tendência histórica.
        </div>
      )}

      {/* History list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map((entry) => (
          <HistoryCard
            key={entry.id}
            entry={entry}
            onLoad={() => loadFromHistory(entry.id)}
            onDelete={() => handleDelete(entry.id)}
            onLabelChange={(label) => setHistoryLabel(entry.id, label)}
          />
        ))}
      </div>
    </div>
  )
}
