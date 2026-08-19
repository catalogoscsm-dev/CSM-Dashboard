import type { AlertThresholds } from '../types'

interface Props {
  margin: number
  thresholds: AlertThresholds
}

export default function MarginAlertBadge({ margin, thresholds }: Props) {
  if (margin < thresholds.lowMarginPct) {
    return (
      <span style={{
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--negative)',
        background: 'var(--negative-bg)',
        padding: '1px 5px',
        borderRadius: '4px',
        marginLeft: '4px',
        whiteSpace: 'nowrap',
      }}>
        ⚠ Baixa
      </span>
    )
  }
  if (margin >= thresholds.highMarginPct) {
    return (
      <span style={{
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--warning)',
        background: 'var(--warning-bg)',
        padding: '1px 5px',
        borderRadius: '4px',
        marginLeft: '4px',
        whiteSpace: 'nowrap',
      }}>
        ↑ Revisar
      </span>
    )
  }
  return null
}
