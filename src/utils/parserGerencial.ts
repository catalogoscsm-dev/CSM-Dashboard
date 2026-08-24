import type { GerencialData } from '../types'

import { detectGerencialViewType } from './parserGerencialViews'

// ── Detecta tipo de relatório ─────────────────────────────────────────────
export function detectReportType(html: string): 'vendas' | 'gerencial' | 'gerencialView' {
  // Delega ao parser especializado — evita falsos positivos como "Agrupado por Grupo" do relatório de vendas
  if (detectGerencialViewType(html) !== null) return 'gerencialView'
  const lower = html.toLowerCase()
  if (lower.includes('relat') && lower.includes('gerencial')) return 'gerencial'
  if (lower.includes('tulos em aberto') || lower.includes('valor recebido')) return 'gerencial'
  return 'vendas'
}

// ── Helpers ───────────────────────────────────────────────────────────────
function parseBRL(str: string): number {
  if (!str) return 0
  // Remove parênteses de negativos: (R$ 23.430,61) → -23430.61
  const negative = str.includes('(')
  const clean = str.replace(/[()R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const val = parseFloat(clean) || 0
  return negative ? -val : val
}

function parsePct(str: string): number {
  const clean = str.replace('%', '').replace(',', '.').trim()
  return parseFloat(clean) || 0
}

function cellTexts(doc: Document): string[] {
  return Array.from(doc.querySelectorAll('td')).map((td) =>
    (td.textContent ?? '').replace(/\s+/g, ' ').trim()
  )
}

// Encontra o valor que segue um label na lista de células
function afterLabel(cells: string[], label: string): string {
  const idx = cells.findIndex((c) => c.toLowerCase().includes(label.toLowerCase()))
  if (idx === -1) return ''
  // Procura o próximo cell não vazio (pula células de separador)
  for (let i = idx + 1; i < Math.min(idx + 5, cells.length); i++) {
    const v = cells[i].trim()
    if (v && v !== ' ' && v.length > 0 && !v.startsWith('Qtd.:')) {
      return v
    }
  }
  return ''
}

// Encontra valor + qty que aparecem em células consecutivas
function afterLabelWithQty(cells: string[], label: string): { value: string; qty: number } {
  const idx = cells.findIndex((c) => c.toLowerCase().includes(label.toLowerCase()))
  if (idx === -1) return { value: '', qty: 0 }
  let value = ''
  let qty = 0
  for (let i = idx + 1; i < Math.min(idx + 6, cells.length); i++) {
    const v = cells[i].trim()
    if (!v || v === ' ') continue
    if (!value && (v.includes('R$') || v.includes('('))) {
      value = v
    } else if (value && /^\d+$/.test(v)) {
      qty = parseInt(v, 10)
      break
    }
  }
  return { value, qty }
}

// ── Parser principal ───────────────────────────────────────────────────────
export function parseGerencialHTML(html: string): GerencialData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const cells = cellTexts(doc)
  const bodyText = doc.body?.textContent ?? ''

  // Empresa
  const boldEls = Array.from(doc.querySelectorAll('b'))
  const company = boldEls
    .map((b) => b.textContent?.trim() ?? '')
    .find((t) => t.length > 5 && /[A-ZÁÉÍÓÚÀÂÃÊÔÇÜÑ]{3,}/.test(t)) ?? ''

  // Período
  const periodMatch = bodyText.match(/(\d{2}\/\d{2}\/\d{4})\s+a\s+(\d{2}\/\d{2}\/\d{4})/)
  const period = periodMatch ? `${periodMatch[1]} a ${periodMatch[2]}` : ''

  // Data de geração
  const genMatch = bodyText.match(/criada em\s+([\d\/a-záéíóúàâãêôçüñ]+\s+às\s+[\d:]+)/i)
  const generatedAt = genMatch ? genMatch[1] : ''

  // ── Faturamento Líquido (coluna esquerda) ─────────────────────────────

  // Qtd. de pedidos: "17 (52 itens)"
  const pedidosCell = afterLabel(cells, 'Qtd. de pedidos')
  const pedidosMatch = pedidosCell.match(/(\d+)\s*\((\d+)/)
  const orderCount = pedidosMatch ? parseInt(pedidosMatch[1], 10) : 0
  const itemCount  = pedidosMatch ? parseInt(pedidosMatch[2], 10) : 0

  const netRevenue   = parseBRL(afterLabel(cells, 'Faturamento l'))   // "Faturamento líquido:"
  const cost         = parseBRL(afterLabel(cells, 'Custo:'))
  const profitValue  = parseBRL(afterLabel(cells, 'Margem (R$)'))
  const profitPctStr = afterLabel(cells, 'Margem (%)')
  const profitPct    = parsePct(profitPctStr)
  const bonifications= parseBRL(afterLabel(cells, 'Bonifica'))
  const discounts    = parseBRL(afterLabel(cells, 'Descontos'))

  // ── Resumo ────────────────────────────────────────────────────────────
  const fatBruto  = afterLabelWithQty(cells, 'Faturamento:')
  const grossRevenue = parseBRL(fatBruto.value)

  const pdvRow    = afterLabelWithQty(cells, 'Vendas PDV')
  const pdvRevenue = parseBRL(pdvRow.value)
  const pdvCount   = pdvRow.qty

  const devRow    = afterLabelWithQty(cells, 'Devolu')
  const returnsValue  = parseBRL(devRow.value)
  const returnsCount  = devRow.qty

  const returnsFreight = parseBRL(afterLabel(cells, 'Frete devolu'))

  // ── Financeiro (coluna direita) ───────────────────────────────────────
  const titlesOpenRow  = afterLabelWithQty(cells, 'Títulos em aberto')
  const titlesOpen      = parseBRL(titlesOpenRow.value)
  const titlesOpenCount = titlesOpenRow.qty

  const titlesPaidRow  = afterLabelWithQty(cells, 'Títulos quitados')
  const titlesPaid      = parseBRL(titlesPaidRow.value)
  const titlesPaidCount = titlesPaidRow.qty

  const checkReceivable = parseBRL(afterLabel(cells, 'cheques'))
  const cardReceivable  = parseBRL(afterLabel(cells, 'cart'))

  const openOrdersRow  = afterLabelWithQty(cells, 'Pedidos em aberto')
  const openOrders      = parseBRL(openOrdersRow.value)
  const openOrdersCount = openOrdersRow.qty

  const totalReceivable = parseBRL(afterLabel(cells, 'Total a receber'))

  const titlesLooseRow  = afterLabelWithQty(cells, 'avulsos')
  const titlesLoose      = parseBRL(titlesLooseRow.value)
  const titlesLooseCount = titlesLooseRow.qty

  // ── Contas ────────────────────────────────────────────────────────────
  const totRecRow   = afterLabelWithQty(cells, 'Total contas a receber')
  const totalAccountsReceivable      = parseBRL(totRecRow.value)
  const totalAccountsReceivableCount = totRecRow.qty

  const paymentAdjustment = parseBRL(afterLabel(cells, 'Pgto'))
  const valueReceived     = parseBRL(afterLabel(cells, 'Valor recebido'))

  const totPayRow   = afterLabelWithQty(cells, 'Total contas a pagar')
  const totalAccountsPayable      = parseBRL(totPayRow.value)
  const totalAccountsPayableCount = totPayRow.qty

  const paidRow = afterLabelWithQty(cells, 'Contas pagas')
  const accountsPaid      = parseBRL(paidRow.value)
  const accountsPaidCount = paidRow.qty

  // ── Estoque ───────────────────────────────────────────────────────────
  const stockBalanceRaw = afterLabel(cells, 'Saldo:')
  const stockBalance = stockBalanceRaw.includes('Atualizar') ? 0 : parseBRL(stockBalanceRaw)

  return {
    company,
    period,
    generatedAt,
    orderCount,
    itemCount,
    grossRevenue,
    netRevenue,
    cost,
    profitValue,
    profitPct,
    bonifications,
    discounts,
    pdvRevenue,
    pdvCount,
    returnsValue: Math.abs(returnsValue),
    returnsCount,
    returnsFreight,
    titlesOpen,
    titlesOpenCount,
    titlesPaid,
    titlesPaidCount,
    titlesLoose,
    titlesLooseCount,
    checkReceivable,
    cardReceivable,
    openOrders,
    openOrdersCount,
    totalReceivable,
    totalAccountsReceivable,
    totalAccountsReceivableCount,
    totalAccountsPayable,
    totalAccountsPayableCount,
    accountsPaid,
    accountsPaidCount,
    paymentAdjustment,
    valueReceived,
    stockBalance,
  }
}
