// ============================================================
// CSM Dashboard — Parser do Vinhasoft
// ============================================================
// O arquivo HTM do Vinhasoft usa charset windows-1252.
// Use TextDecoder('windows-1252') ao ler o arquivo via FileReader.
//
// Padrão de bgcolors:
//   #000080  → cabeçalho de categoria (texto branco)
//   #EEEEDD  → linha de produto (fundo claro 1)
//   #FFFFDD  → linha de produto (fundo claro 2, alternado)
//   #bbbbbb  → subtotal da categoria
//   #cccccc  → total geral
// ============================================================

import type { ReportData, Category, Product } from '../types'

/**
 * Converte valor monetário brasileiro para número.
 * Exemplos: "1.495,51" → 1495.51 | "-2.340,00" → -2340
 */
export function parseBRL(str: string): number {
  if (!str || str.trim() === '' || str.trim() === '-') return 0
  const cleaned = str.trim().replace(/\./g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

/**
 * Normaliza cor de bgcolor para comparação case-insensitive.
 */
function normColor(color: string): string {
  return color.trim().toLowerCase()
}

/**
 * Extrai texto limpo de uma célula HTML.
 */
function cellText(td: Element): string {
  return (td.textContent ?? '').trim()
}

/**
 * Parser principal — transforma o HTML do Vinhasoft em ReportData.
 * @param htmlString — string HTML (já decodificada com TextDecoder windows-1252)
 */
export function parseVinhasoftHTML(htmlString: string): ReportData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')

  // ── Extrair metadados (empresa, período, geração) ───────────────────
  let company = ''
  let period = ''
  let generatedAt = new Date().toLocaleString('pt-BR')

  // Empresa: primeiro <b> no header (antes da tabela de dados)
  const boldTags = Array.from(doc.querySelectorAll('b'))
  for (const b of boldTags) {
    const text = cellText(b)
    if (text.length > 5 && /[A-Z]{3,}/.test(text) && !text.includes('Total') && !text.includes('Totais') && !text.includes('Grupo')) {
      company = text
      break
    }
  }

  // Período: em <h4> — "Agrupado por Grupo, de 01/08/2026 a 31/08/2026"
  const h4 = doc.querySelector('h4')
  if (h4) {
    const h4Text = cellText(h4)
    const match = h4Text.match(/(\d{2}\/\d{2}\/\d{4}\s+a\s+\d{2}\/\d{2}\/\d{4})/)
    if (match) period = match[1]
  }

  // Data de geração: em <font> com "criada em" ou "gerado"
  const bodyText = doc.body?.textContent ?? ''
  const criadaMatch = bodyText.match(/(?:criada?|gerado|emitido)\s+em\s+(\d{2}\/\w+\/\d{4})\s+[àa]s?\s+([\d:]+)/i)
  if (criadaMatch) generatedAt = `${criadaMatch[1]} às ${criadaMatch[2]}`

  // ── Iterar pelas linhas da tabela principal ─────────────────────────
  const rows = Array.from(doc.querySelectorAll('tr'))
  const categories: Category[] = []
  let currentCategory: Category | null = null

  // Totais gerais (última linha #cccccc)
  const grandTotal = { qty: 0, revenue: 0, cost: 0, profit: 0, margin: 0 }

  for (const row of rows) {
    const bg = normColor(row.getAttribute('bgcolor') ?? '')
    const cells = Array.from(row.querySelectorAll('td'))
    if (cells.length === 0) continue

    // ── Cabeçalho de categoria ──────────────────────────────────────
    if (bg === '#000080') {
      const name = cellText(cells[0])
      if (name) {
        currentCategory = { name, products: [], totals: { qty: 0, revenue: 0, cost: 0, profit: 0, margin: 0 } }
        categories.push(currentCategory)
      }
      continue
    }

    // ── Linha de produto ────────────────────────────────────────────
    if (bg === '#eeeedd' || bg === '#ffffdd') {
      if (!currentCategory || cells.length < 7) continue

      // Colunas: código | nome | qty | unit | revenue | cost | profit | margin%
      const product: Product = {
        code:     cellText(cells[0]),
        name:     cellText(cells[1]),
        qty:      parseBRL(cellText(cells[2])),
        unit:     cellText(cells[3]),
        revenue:  parseBRL(cellText(cells[4])),
        cost:     parseBRL(cellText(cells[5])),
        profit:   parseBRL(cellText(cells[6])),
        margin:   cells[7] ? parseBRL(cellText(cells[7])) : 0,
        isReturn: false,
      }
      product.isReturn = product.qty < 0

      // Margem é sempre positiva no Vinhasoft, mesmo em devoluções.
      // isReturn é determinado APENAS pela quantidade negativa.

      if (product.code || product.name) {
        currentCategory.products.push(product)
      }
      continue
    }

    // ── Subtotal da categoria ───────────────────────────────────────
    // Vinhasoft: <td colspan=2>Totais:</td> <td>qty</td> <td>unit</td> <td>revenue</td> <td>cost</td> <td>profit</td> <td>margin%</td>
    // colspan=2 counts as 1 DOM cell, so: [0]=label [1]=qty [2]=unit [3]=revenue [4]=cost [5]=profit [6]=margin
    if (bg === '#bbbbbb') {
      if (!currentCategory || cells.length < 5) continue
      currentCategory.totals = {
        qty:     parseBRL(cellText(cells[1])),
        revenue: parseBRL(cellText(cells[3])),
        cost:    parseBRL(cellText(cells[4])),
        profit:  parseBRL(cellText(cells[5])),
        margin:  cells[6] ? parseBRL(cellText(cells[6])) : 0,
      }
      continue
    }

    // ── Total geral ─────────────────────────────────────────────────
    // Same layout as subtotal. First #cccccc row is the column header ("Grupo","Qtd."…) — skip it.
    if (bg === '#cccccc') {
      if (cells.length < 5) continue
      // Skip header row (bgcolor="#cccccc"): its cells[1] has no digits ("Qtd.:")
      if (!/\d/.test(cellText(cells[1]))) continue
      grandTotal.qty     = parseBRL(cellText(cells[1]))
      grandTotal.revenue = parseBRL(cellText(cells[3]))
      grandTotal.cost    = parseBRL(cellText(cells[4]))
      grandTotal.profit  = parseBRL(cellText(cells[5]))
      grandTotal.margin  = cells[6] ? parseBRL(cellText(cells[6])) : 0
    }
  }

  // Se não encontrou totais por categoria, recalcula a partir dos produtos
  for (const cat of categories) {
    if (cat.totals.revenue === 0 && cat.products.length > 0) {
      cat.totals = cat.products.reduce(
        (acc, p) => ({
          qty: acc.qty + p.qty,
          revenue: acc.revenue + p.revenue,
          cost: acc.cost + p.cost,
          profit: acc.profit + p.profit,
          margin: 0, // recalcula abaixo
        }),
        { qty: 0, revenue: 0, cost: 0, profit: 0, margin: 0 }
      )
      cat.totals.margin = cat.totals.cost !== 0
        ? (cat.totals.profit / cat.totals.cost) * 100
        : 0
    }
  }

  // Se não encontrou grand total, recalcula
  if (grandTotal.revenue === 0 && categories.length > 0) {
    for (const cat of categories) {
      grandTotal.qty     += cat.totals.qty
      grandTotal.revenue += cat.totals.revenue
      grandTotal.cost    += cat.totals.cost
      grandTotal.profit  += cat.totals.profit
    }
    grandTotal.margin = grandTotal.cost !== 0
      ? (grandTotal.profit / grandTotal.cost) * 100
      : 0
  }

  return {
    company:    company || 'Campinas Shopping Móveis',
    period:     period || '',
    generatedAt,
    categories,
    grandTotal,
  }
}

/**
 * Lê um File como windows-1252 e devolve a string HTML.
 * Usar com await no componente ImportScreen.
 */
export function readFileAsWindows1252(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      const decoder = new TextDecoder('windows-1252')
      resolve(decoder.decode(buffer))
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsArrayBuffer(file)
  })
}
