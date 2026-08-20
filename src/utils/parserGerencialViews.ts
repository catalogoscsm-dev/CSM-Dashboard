import type { GerencialView, GerencialViewRow, GerencialViewType } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────
function parseBRL(str: string): number {
  if (!str) return 0
  const negative = str.includes('(')
  const clean = str.replace(/[()R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const val = parseFloat(clean) || 0
  return negative ? -val : val
}

function parsePct(str: string): number {
  const clean = str.replace('%', '').replace(',', '.').trim()
  return parseFloat(clean) || 0
}

// ── Mapeamento de label de agrupamento → tipo ─────────────────────────────
const VIEW_PATTERNS: Array<{ pattern: string; type: GerencialViewType; label: string }> = [
  { pattern: 'agrupado por clientes',     type: 'clientes',      label: 'Clientes' },
  { pattern: 'agrupado por vendedores',   type: 'vendedores',    label: 'Vendedores' },
  { pattern: 'agrupado por linha',        type: 'linhasProdutos', label: 'Linha de Produtos' },
  { pattern: 'agrupado por segmento',     type: 'segmento',      label: 'Segmento' },
  { pattern: 'agrupado por cidades',      type: 'cidades',       label: 'Cidades' },
  { pattern: 'agrupado por cidade',       type: 'cidades',       label: 'Cidades' },
  // "Área" — windows-1252 decodificado corretamente produz "área"; fallbacks para outros casos
  { pattern: 'agrupado por área',         type: 'area',          label: 'Área' },
  { pattern: 'agrupado por &aacute;rea',  type: 'area',          label: 'Área' },
  { pattern: 'agrupado por rea',          type: 'area',          label: 'Área' },
  { pattern: 'agrupado por condi',        type: 'condicaoPgto',  label: 'Cond. de Pgto.' },
  { pattern: 'agrupado por fornecedor',   type: 'fornecedores',  label: 'Fornecedores' },
  { pattern: 'agrupado por supervisor',   type: 'supervisores',  label: 'Supervisores' },
]

export function detectGerencialViewType(html: string): { type: GerencialViewType; label: string } | null {
  const lower = html.toLowerCase()
  for (const entry of VIEW_PATTERNS) {
    if (lower.includes(entry.pattern)) return { type: entry.type, label: entry.label }
  }
  return null
}

// ── Parser principal ───────────────────────────────────────────────────────
export function parseGerencialViewHTML(html: string): GerencialView | null {
  const detected = detectGerencialViewType(html)
  if (!detected) return null

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const bodyText = doc.body?.textContent ?? ''

  // Empresa — primeiro <b> com texto substancial
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

  // Linhas de dados — bgcolor alternando #EEEEDD / #FFFFDD
  const rows: Omit<GerencialViewRow, 'abcClass'>[] = []

  const allRows = Array.from(doc.querySelectorAll('tr'))
  for (const tr of allRows) {
    const bg = tr.getAttribute('bgcolor')?.toLowerCase() ?? ''
    if (bg !== '#eeeedd' && bg !== '#ffffdd') continue

    const tds = Array.from(tr.querySelectorAll('td'))
    if (tds.length < 5) continue

    const texts = tds.map((td) => (td.textContent ?? '').trim())

    // Subgrupo de Linha de Produtos: célula de nome usa font-face Verdana + <i>
    const nameCell = tds[1] ?? tds[0]
    const isSubgroup = !!(nameCell.querySelector('i') &&
      (nameCell.querySelector('font[face="Verdana"]') || nameCell.querySelector('font[face="verdana"]')))

    // Layout de colunas (todos os relatórios gerenciais têm código na col[0]):
    // 9 cols: [código, nome, pedidos, itens, fat, custo, lucro$, lucro%, %total]
    // 8 cols: [código, nome, itens, fat, custo, lucro$, lucro%, %total]  ← sem pedidos (Fornecedores, Linha)
    let code: string | undefined
    let name: string
    let ordersStr: string | undefined
    let itemsStr: string
    let revenueStr: string
    let costStr: string
    let profitStr: string
    let marginStr: string
    let pctStr: string

    if (texts.length >= 9) {
      // 9 colunas: código + nome + pedidos + itens + fat + custo + lucro$ + lucro% + %total
      ;[code, name, ordersStr, itemsStr, revenueStr, costStr, profitStr, marginStr, pctStr] = texts
    } else if (texts.length === 8) {
      // 8 colunas: código + nome + itens + fat + custo + lucro$ + lucro% + %total (sem pedidos)
      ;[code, name, itemsStr, revenueStr, costStr, profitStr, marginStr, pctStr] = texts
    } else {
      continue
    }

    // "2pd" → 2, ausente → undefined
    const ordersMatch = ordersStr?.match(/(\d+)/)
    const orders = ordersMatch ? parseInt(ordersMatch[1], 10) : undefined

    const items = parseInt(itemsStr?.replace(/\D/g, '')) || 0
    const revenue = parseBRL(revenueStr)
    const cost = parseBRL(costStr)
    const profit = parseBRL(profitStr)
    const margin = parsePct(marginStr)
    const pctTotal = parsePct(pctStr)

    if (!name || revenue === 0) continue

    rows.push({ code: code || undefined, name, orders, items, revenue, cost, profit, margin, pctTotal, isSubgroup })
  }

  // Linha de Produtos preserva ordem hierárquica; demais ordenam por revenue desc
  const keepOrder = detected.type === 'linhasProdutos'
  if (!keepOrder) rows.sort((a, b) => b.revenue - a.revenue)

  // ABC calculado sobre os grupos (não subgrupos) para Linha de Produtos
  let cumulative = 0
  const rowsWithAbc: GerencialViewRow[] = rows.map((r) => {
    if (!r.isSubgroup) cumulative += r.pctTotal
    const abcClass: 'A' | 'B' | 'C' = cumulative <= 75 ? 'A' : cumulative <= 95 ? 'B' : 'C'
    return { ...r, abcClass }
  })

  return {
    type: detected.type,
    label: detected.label,
    rows: rowsWithAbc,
    period,
    company,
    generatedAt,
  }
}
