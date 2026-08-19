import { useState } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import { fmtBRL } from '../utils/format'

function barColor(pct: number): string {
  if (pct >= 100) return 'var(--positive)'
  if (pct >= 80) return 'var(--warning)'
  return 'var(--navy)'
}

function ProgressBar({ label, current, target }: { label: string; current: number; target: number }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const truePct = target > 0 ? (current / target) * 100 : 0
  const color = barColor(truePct)
  const isOver = truePct >= 100

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
          {truePct.toFixed(1)}% {isOver && '🏆'}
        </span>
      </div>
      <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '4px',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {fmtBRL(current)}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          meta: {fmtBRL(target)}
        </span>
      </div>
    </div>
  )
}

export default function GoalProgressBar() {
  const goal = useDashboardStore((s) => s.goal)
  const setGoal = useDashboardStore((s) => s.setGoal)
  const report = useDashboardStore((s) => s.report)
  const [open, setOpen] = useState(false)
  const [revInput, setRevInput] = useState(String(goal.revenue || ''))
  const [profInput, setProfInput] = useState(String(goal.profit || ''))

  const hasGoal = goal.revenue > 0 || goal.profit > 0
  const current = report?.grandTotal ?? { revenue: 0, profit: 0 }

  if (!hasGoal && !open) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            background: 'transparent',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          + Definir metas mensais
        </button>
      </div>
    )
  }

  function handleSave() {
    setGoal({ revenue: parseFloat(revInput) || 0, profit: parseFloat(profInput) || 0 })
    setOpen(false)
  }

  function handleClear() {
    setGoal({ revenue: 0, profit: 0 })
    setRevInput('')
    setProfInput('')
    setOpen(false)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>Metas do Mês</h3>
        <button
          onClick={() => {
            setRevInput(String(goal.revenue || ''))
            setProfInput(String(goal.profit || ''))
            setOpen((v) => !v)
          }}
          title="Configurar metas"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-dim)',
            fontSize: '16px',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          ⚙
        </button>
      </div>

      {hasGoal && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: open ? '16px' : 0 }}>
          {goal.revenue > 0 && (
            <ProgressBar label="Faturamento" current={current.revenue} target={goal.revenue} />
          )}
          {goal.profit > 0 && (
            <ProgressBar label="Lucro" current={current.profit} target={goal.profit} />
          )}
        </div>
      )}

      {open && (
        <div style={{
          borderTop: hasGoal ? '1px solid var(--border)' : 'none',
          paddingTop: hasGoal ? '16px' : 0,
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Meta Faturamento (R$)</label>
            <input
              type="number"
              value={revInput}
              onChange={(e) => setRevInput(e.target.value)}
              placeholder="Ex: 150000"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text)',
                background: 'var(--bg)',
                outline: 'none',
                width: '160px',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Meta Lucro (R$)</label>
            <input
              type="number"
              value={profInput}
              onChange={(e) => setProfInput(e.target.value)}
              placeholder="Ex: 80000"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text)',
                background: 'var(--bg)',
                outline: 'none',
                width: '160px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                background: 'var(--navy)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Salvar
            </button>
            <button
              onClick={handleClear}
              style={{
                background: 'transparent',
                color: 'var(--negative)',
                border: '1px solid var(--negative)',
                borderRadius: 'var(--radius-sm)',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
