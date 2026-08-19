// ============================================================
// CSM Dashboard — Utilitários de formatação
// ============================================================

/**
 * Formata número como moeda brasileira.
 * Exemplo: 132780.04 → "R$ 132.780,04"
 */
export function fmtBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

/**
 * Formata percentual com 2 casas decimais.
 * Exemplo: 133.9 → "133,90%"
 */
export function fmtPct(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + '%'
}

/**
 * Formata quantidade inteira.
 * Exemplo: 42 → "42" | -3 → "-3"
 */
export function fmtQty(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

/**
 * Retorna classe CSS semântica baseada na margem %.
 * > 150% → positive | > 120% → warning | <= 120% → negative
 */
export function marginClass(margin: number): 'positive' | 'warning' | 'negative' {
  if (margin >= 150) return 'positive'
  if (margin >= 120) return 'warning'
  return 'negative'
}

/**
 * Trunca string longa com elipsis.
 */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}
