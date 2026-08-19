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
  // "Área" pode aparecer como "rea" por problema de charset windows-1252
  { pattern: 'agrupado por rea',          type: 'area',          label: 'Área' },
  { pattern: 'agrupado por &aacute;rea',  type: 'area',          label: 'Área' },
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

    // Heurística: detecta se a 1ª coluna é código (número com ponto) ou nome direto
    // Padrão com código: [código, nome, pedidos, itens, fat, custo, lucro$, lucro%, %total]
    // Padrão sem código: [nome, pedidos, itens, fat, custo, lucro$, lucro%, %total]
    let code: string | undefined
    let name: string
    let ordersStr: string
    let itemsStr: string
    let revenueStr: string
    let costStr: string
    let profitStr: string
    let marginStr: string
    let pctStr: string

    if (texts.length >= 9 && /^\d/.test(texts[0].replace('.', ''))) {
      // 9 colunas com código
      ;[code, name, ordersStr, itemsStr, revenueStr, costStr, profitStr, marginStr, pctStr] = texts
    } else if (texts.length >= 8) {
      // 8 colunas sem código
      ;[name, ordersStr, itemsStr, revenueStr, costStr, profitStr, marginStr, pctStr] = texts
    } else {
      continue
    }

    // "2pd" → 2, "" → undefined
    const ordersMatch = ordersStr?.match(/(\d+)/)
    const orders = ordersMatch ? parseInt(ordersMatch[1], 10) : undefined

    const items = parseInt(itemsStr?.replace(/\D/g, '')) || 0
    const revenue = parseBRL(revenueStr)
    const cost = parseBRL(costStr)
    const profit = parseBRL(profitStr)
    const margin = parsePct(marginStr)
    const pctTotal = parsePct(pctStr)

    if (!name || revenue === 0) continue

    rows.push({ code: code || undefined, name, orders, items, revenue, cost, profit, margin, pctTotal })
  }

  // Ordena por revenue desc e calcula ABC
  rows.sort((a, b) => b.revenue - a.revenue)

  let cumulative = 0
  const rowsWithAbc: GerencialViewRow[] = rows.map((r) => {
    cumulative += r.pctTotal
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
