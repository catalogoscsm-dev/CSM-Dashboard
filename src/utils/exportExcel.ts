// ── Styled Excel Export ────────────────────────────────────────────────────
import * as XLSX from 'xlsx-js-style'
import type { ReportData, GerencialData, GerencialView } from '../types'

// ── Color palette — Slate profissional + Laranja CSM como acento ─────────
const C = {
  // Slate — cabeçalhos de coluna (neutro, sério)
  slate:        '334155',   // cinza ardósia — cabeçalhos de coluna
  slateLight:   'F1F5F9',   // slate bem claro — subtítulos e section label
  slateMid:     '475569',   // slate médio — textos secundários
  // Laranja CSM — somente título principal e total geral
  orange:       'C2410C',   // laranja escuro — título e total geral
  orangeLight:  'FFF0E5',   // laranja claro — KPI valor accent
  // Semântico
  positive:     '059669',
  positiveLight:'ECFDF5',
  negative:     'DC2626',
  negativeLight:'FEF2F2',
  // Neutros limpos
  white:        'FFFFFF',
  gray50:       'F8FAFC',   // quase branco — linhas pares
  gray100:      'F1F5F9',   // cinza muito claro
  gray200:      'E2E8F0',   // cinza bordas
  gray400:      '94A3B8',   // cinza médio
  gray700:      '334155',   // cinza escuro para texto
  gray900:      '0F172A',   // quase preto
}

// ── Style builders ──────────────────────────────────────────────────────────
function bg(hex: string, fgHex = C.white, bold = false, sz = 11, halign = 'left') {
  return {
    fill: { fgColor: { rgb: hex } },
    font: { bold, color: { rgb: fgHex }, sz, name: 'Calibri' },
    alignment: { horizontal: halign, vertical: 'center', wrapText: false },
    border: {
      top:    { style: 'thin', color: { rgb: C.gray200 } },
      bottom: { style: 'thin', color: { rgb: C.gray200 } },
      left:   { style: 'thin', color: { rgb: C.gray200 } },
      right:  { style: 'thin', color: { rgb: C.gray200 } },
    },
  }
}

const S = {
  // Título: laranja CSM + branco bold — único uso expressivo do laranja
  sheetTitle:    bg(C.orange,       C.white,        true,  13, 'left'),
  // Subtítulo: slate claro + texto slate escuro
  subTitle:      bg(C.slateLight,   C.slate,        false, 10, 'left'),
  // Cabeçalho de coluna: slate profissional + branco bold
  colHeader:     bg(C.slate,        C.white,        true,  10, 'center'),
  // Separador de categoria: slate claro + texto slate bold
  sectionLabel:  bg(C.slateLight,   C.slate,        true,  10, 'left'),
  // KPI: label slate claro, valor laranja claro (toque de marca)
  kpiLabel:      bg(C.gray100,      C.gray700,      false, 10, 'left'),
  kpiValue:      bg(C.orangeLight,  C.orange,       true,  11, 'right'),
  kpiValuePos:   bg(C.positiveLight,C.positive,     true,  11, 'right'),
  kpiValueNeg:   bg(C.negativeLight,C.negative,     true,  11, 'right'),
  // Linhas de dados: branco e cinza bem claro — limpo, legível
  rowOdd:        bg(C.white,        C.gray900,      false, 10, 'left'),
  rowEven:       bg(C.gray50,       C.gray900,      false, 10, 'left'),
  // Total geral: laranja CSM + branco bold — segundo uso do laranja
  rowTotal:      bg(C.orange,       C.white,        true,  10, 'center'),
  // Números
  numOdd:        { ...bg(C.white,   C.gray900, false, 10, 'right') },
  numEven:       { ...bg(C.gray50,  C.gray900, false, 10, 'right') },
  numTotalR:     { ...bg(C.orange,  C.white,   true,  10, 'right') },
  pctOdd:        { ...bg(C.white,   C.gray700, false, 10, 'right') },
  pctEven:       { ...bg(C.gray50,  C.gray700, false, 10, 'right') },
  pctTotal:      { ...bg(C.orange,  C.white,   true,  10, 'right') },
  // Devolução
  devSim:        bg(C.negativeLight,C.negative,     true,  10, 'center'),
  devNao:        bg(C.white,        C.gray400,      false, 10, 'center'),
  devNaoBg:      bg(C.gray50,       C.gray400,      false, 10, 'center'),
  empty:         bg(C.white,        C.white,        false, 4),
}

// ── Cell builder ────────────────────────────────────────────────────────────
function cell(v: string | number, s: object, numFmt?: string) {
  const t = typeof v === 'number' ? 'n' : 's'
  const base: Record<string, unknown> = { v, t, s }
  if (numFmt) base.z = numFmt
  return base
}

// ── Address helper ──────────────────────────────────────────────────────────
function addr(row: number, col: number): string {
  let s = ''
  let n = col
  while (n >= 0) { s = String.fromCharCode((n % 26) + 65) + s; n = Math.floor(n / 26) - 1 }
  return `${s}${row + 1}`
}

// ═══════════════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════════════
export function exportExcel(report: ReportData): void {
  const wb = XLSX.utils.book_new()

  buildResumo(wb, report)
  buildCategorias(wb, report)
  buildProdutos(wb, report)

  const safePeriod = report.period.replace(/[/\s]/g, '-')
  XLSX.writeFile(wb, `CSM-Vendas-${safePeriod}.xlsx`)
}

// ─────────────────────────────────────────────────────────────────────────
// Sheet 1 — Resumo Executivo
// ─────────────────────────────────────────────────────────────────────────
function buildResumo(wb: XLSX.WorkBook, report: ReportData) {
  const ws: Record<string, unknown> = {}
  let r = 0

  const span = (row: number, cols: number) => {
    for (let c = 1; c < cols; c++) ws[addr(row, c)] = cell('', S.sheetTitle)
  }

  ws[addr(r, 0)] = cell('CSM Dashboard — Relatório de Vendas', S.sheetTitle); span(r, 2); r++
  ws[addr(r, 0)] = cell(`Empresa: ${report.company}`,  S.subTitle);  ws[addr(r, 1)] = cell('', S.subTitle);  r++
  ws[addr(r, 0)] = cell(`Período: ${report.period}`,   S.subTitle);  ws[addr(r, 1)] = cell('', S.subTitle);  r++
  ws[addr(r, 0)] = cell(`Gerado em: ${report.generatedAt}`, S.subTitle); ws[addr(r, 1)] = cell('', S.subTitle); r++
  ws[addr(r, 0)] = cell('', S.empty); ws[addr(r, 1)] = cell('', S.empty); r++

  ws[addr(r, 0)] = cell('  RESUMO EXECUTIVO', S.sectionLabel); ws[addr(r, 1)] = cell('', S.sectionLabel); r++

  const g = report.grandTotal
  const kpis: [string, number, object, object, string][] = [
    ['Faturamento Total',   g.revenue, S.kpiLabel, S.kpiValue,                                          '#,##0.00'],
    ['Custo Total',         g.cost,    S.kpiLabel, S.kpiValue,                                          '#,##0.00'],
    ['Lucro Total',         g.profit,  S.kpiLabel, g.profit >= 0 ? S.kpiValuePos : S.kpiValueNeg,       '#,##0.00'],
    ['Margem Média (%)',    g.margin,  S.kpiLabel, S.kpiValue,                                          '0.00"%"'],
    ['Qtd. Itens Vendidos', g.qty,     S.kpiLabel, S.kpiValue,                                          '#,##0'],
  ]
  for (const [label, value, ls, vs, fmt] of kpis) {
    ws[addr(r, 0)] = cell(label, ls)
    ws[addr(r, 1)] = cell(value, vs, fmt)
    r++
  }

  ws[addr(r, 0)] = cell('', S.empty); ws[addr(r, 1)] = cell('', S.empty); r++
  ws[addr(r, 0)] = cell('  RANKING POR FATURAMENTO', S.sectionLabel); ws[addr(r, 1)] = cell('', S.sectionLabel); r++
  ws[addr(r, 0)] = cell('Categoria', S.colHeader); ws[addr(r, 1)] = cell('Faturamento (R$)', S.colHeader); r++

  const sorted = [...report.categories].sort((a, b) => b.totals.revenue - a.totals.revenue)
  sorted.forEach((cat, i) => {
    const isOdd = i % 2 === 0
    ws[addr(r, 0)] = cell(cat.name,          isOdd ? S.rowOdd : S.rowEven)
    ws[addr(r, 1)] = cell(cat.totals.revenue, isOdd ? S.numOdd : S.numEven, '#,##0.00')
    r++
  })
  ws[addr(r, 0)] = cell('TOTAL GERAL', S.rowTotal)
  ws[addr(r, 1)] = cell(g.revenue,    S.numTotalR, '#,##0.00')
  r++

  ws['!ref']    = `A1:B${r}`
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
  ]
  ws['!cols'] = [{ wch: 30 }, { wch: 22 }]
  ws['!rows'] = [{ hpt: 28 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }]
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  XLSX.utils.book_append_sheet(wb, ws as XLSX.WorkSheet, 'Resumo')
}

// ─────────────────────────────────────────────────────────────────────────
// Sheet 2 — Por Categoria
// ─────────────────────────────────────────────────────────────────────────
function buildCategorias(wb: XLSX.WorkBook, report: ReportData) {
  const ws: Record<string, unknown> = {}
  let r = 0
  const COLS = 6

  const fillRow = (row: number, s: object) => { for (let c = 0; c < COLS; c++) ws[addr(row, c)] = cell('', s) }

  ws[addr(r, 0)] = cell('Análise por Categoria', S.sheetTitle); for (let c = 1; c < COLS; c++) ws[addr(r, c)] = cell('', S.sheetTitle); r++
  ws[addr(r, 0)] = cell(`Período: ${report.period}`, S.subTitle); for (let c = 1; c < COLS; c++) ws[addr(r, c)] = cell('', S.subTitle); r++
  fillRow(r, S.empty); r++

  const headers = ['Categoria', 'Qtd. Vendas', 'Faturamento (R$)', 'Custo (R$)', 'Lucro (R$)', 'Margem (%)']
  headers.forEach((h, c) => { ws[addr(r, c)] = cell(h, S.colHeader) })
  const headerRow = r; r++

  const sorted = [...report.categories].sort((a, b) => b.totals.revenue - a.totals.revenue)
  sorted.forEach((cat, i) => {
    const o = i % 2 === 0
    const negProfit = cat.totals.profit < 0
    ws[addr(r, 0)] = cell(cat.name,           o ? S.rowOdd : S.rowEven)
    ws[addr(r, 1)] = cell(cat.totals.qty,     { ...(o ? S.numOdd : S.numEven), numFmt: '#,##0' } as object, '#,##0')
    ws[addr(r, 2)] = cell(cat.totals.revenue, o ? S.numOdd : S.numEven, '#,##0.00')
    ws[addr(r, 3)] = cell(cat.totals.cost,    o ? S.numOdd : S.numEven, '#,##0.00')
    ws[addr(r, 4)] = cell(cat.totals.profit,  negProfit
      ? { ...(o ? S.numOdd : S.numEven), font: { color: { rgb: C.negative }, sz: 10, name: 'Calibri' } } as object
      : (o ? S.numOdd : S.numEven), '#,##0.00')
    ws[addr(r, 5)] = cell(cat.totals.margin,  o ? S.pctOdd : S.pctEven, '0.00"%"')
    r++
  })

  const g = report.grandTotal
  ws[addr(r, 0)] = cell('TOTAL GERAL', S.rowTotal)
  ws[addr(r, 1)] = cell(g.qty,         { ...S.numTotalR, numFmt: '#,##0' } as object, '#,##0')
  ws[addr(r, 2)] = cell(g.revenue,     S.numTotalR, '#,##0.00')
  ws[addr(r, 3)] = cell(g.cost,        S.numTotalR, '#,##0.00')
  ws[addr(r, 4)] = cell(g.profit,      S.numTotalR, '#,##0.00')
  ws[addr(r, 5)] = cell(g.margin,      S.pctTotal,  '0.00"%"')
  r++

  ws['!ref']       = `A1:F${r}`
  ws['!merges']    = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COLS - 1 } },
  ]
  ws['!cols']      = [{ wch: 26 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 13 }]
  ws['!rows']      = [{ hpt: 28 }, { hpt: 18 }]
  ws['!autofilter']= { ref: `A${headerRow + 1}:F${r}` }
  ws['!freeze']    = { xSplit: 0, ySplit: headerRow + 1 }

  XLSX.utils.book_append_sheet(wb, ws as XLSX.WorkSheet, 'Por Categoria')
}

// ─────────────────────────────────────────────────────────────────────────
// Sheet 3 — Produtos (detail)
// ─────────────────────────────────────────────────────────────────────────
function buildProdutos(wb: XLSX.WorkBook, report: ReportData) {
  const ws: Record<string, unknown> = {}
  let r = 0
  const COLS = 10

  ws[addr(r, 0)] = cell('Detalhe de Produtos', S.sheetTitle)
  for (let c = 1; c < COLS; c++) ws[addr(r, c)] = cell('', S.sheetTitle)
  r++

  ws[addr(r, 0)] = cell(`Período: ${report.period}  |  ${report.company}`, S.subTitle)
  for (let c = 1; c < COLS; c++) ws[addr(r, c)] = cell('', S.subTitle)
  r++

  for (let c = 0; c < COLS; c++) ws[addr(r, c)] = cell('', S.empty)
  r++

  const headers = ['Código', 'Produto', 'Categoria', 'Qtd.', 'Un.', 'Faturamento (R$)', 'Custo (R$)', 'Lucro (R$)', 'Margem (%)', 'Devolução']
  headers.forEach((h, c) => { ws[addr(r, c)] = cell(h, S.colHeader) })
  const headerRow = r; r++

  let gi = 0
  for (const cat of report.categories) {
    // Separador de categoria (faixa dourada)
    ws[addr(r, 0)] = cell(`  ${cat.name.toUpperCase()}`, S.sectionLabel)
    for (let c = 1; c < COLS; c++) ws[addr(r, c)] = cell('', S.sectionLabel)
    r++

    for (const p of cat.products) {
      const o = gi % 2 === 0
      const rs = o ? S.rowOdd  : S.rowEven
      const ns = o ? S.numOdd  : S.numEven
      const ps = o ? S.pctOdd  : S.pctEven
      const negProfit = p.profit < 0
      const negMargin = p.margin < 0

      ws[addr(r, 0)] = cell(p.code,    { ...rs, font: { ...rs.font, name: 'Courier New', sz: 9 } } as object)
      ws[addr(r, 1)] = cell(p.name,    rs)
      ws[addr(r, 2)] = cell(cat.name,  { ...rs, font: { color: { rgb: C.gray400 }, sz: 10, name: 'Calibri' } } as object)
      ws[addr(r, 3)] = cell(p.qty,     { ...ns, numFmt: '#,##0' } as object, '#,##0')
      ws[addr(r, 4)] = cell(p.unit,    { ...rs, alignment: { horizontal: 'center', vertical: 'center' } } as object)
      ws[addr(r, 5)] = cell(p.revenue, ns, '#,##0.00')
      ws[addr(r, 6)] = cell(p.cost,    ns, '#,##0.00')
      ws[addr(r, 7)] = cell(p.profit,  negProfit
        ? { ...ns, font: { color: { rgb: C.negative }, sz: 10, name: 'Calibri' } } as object : ns, '#,##0.00')
      ws[addr(r, 8)] = cell(p.margin,  negMargin
        ? { ...ps, font: { color: { rgb: C.negative }, sz: 10, name: 'Calibri' } } as object : ps, '0.00"%"')
      ws[addr(r, 9)] = cell(p.isReturn ? 'SIM' : 'não',
        p.isReturn ? S.devSim : (o ? S.devNao : S.devNaoBg))
      r++; gi++
    }

    // Subtotal da categoria
    ws[addr(r, 0)] = cell(`Subtotal — ${cat.name}`, S.rowTotal)
    ws[addr(r, 1)] = cell('', S.rowTotal)
    ws[addr(r, 2)] = cell('', S.rowTotal)
    ws[addr(r, 3)] = cell(cat.totals.qty,     { ...S.numTotalR, numFmt: '#,##0' } as object, '#,##0')
    ws[addr(r, 4)] = cell('', S.rowTotal)
    ws[addr(r, 5)] = cell(cat.totals.revenue, S.numTotalR, '#,##0.00')
    ws[addr(r, 6)] = cell(cat.totals.cost,    S.numTotalR, '#,##0.00')
    ws[addr(r, 7)] = cell(cat.totals.profit,  S.numTotalR, '#,##0.00')
    ws[addr(r, 8)] = cell(cat.totals.margin,  S.pctTotal,  '0.00"%"')
    ws[addr(r, 9)] = cell('', S.rowTotal)
    r++
  }

  // Total geral
  const g = report.grandTotal
  ws[addr(r, 0)] = cell('TOTAL GERAL', S.rowTotal)
  ws[addr(r, 1)] = cell('', S.rowTotal)
  ws[addr(r, 2)] = cell('', S.rowTotal)
  ws[addr(r, 3)] = cell(g.qty,     { ...S.numTotalR, numFmt: '#,##0' } as object, '#,##0')
  ws[addr(r, 4)] = cell('', S.rowTotal)
  ws[addr(r, 5)] = cell(g.revenue, S.numTotalR, '#,##0.00')
  ws[addr(r, 6)] = cell(g.cost,    S.numTotalR, '#,##0.00')
  ws[addr(r, 7)] = cell(g.profit,  S.numTotalR, '#,##0.00')
  ws[addr(r, 8)] = cell(g.margin,  S.pctTotal,  '0.00"%"')
  ws[addr(r, 9)] = cell('', S.rowTotal)
  r++

  ws['!ref']        = `A1:J${r}`
  ws['!merges']     = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COLS - 1 } },
  ]
  ws['!cols'] = [
    { wch: 14 }, { wch: 44 }, { wch: 22 }, { wch: 8 }, { wch: 6 },
    { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 10 },
  ]
  ws['!rows']       = [{ hpt: 28 }, { hpt: 18 }]
  ws['!autofilter'] = { ref: `A${headerRow + 1}:J${r}` }
  ws['!freeze']     = { xSplit: 0, ySplit: headerRow + 1 }

  XLSX.utils.book_append_sheet(wb, ws as XLSX.WorkSheet, 'Produtos')
}

// ═══════════════════════════════════════════════════════════════════════════
// Gerencial Export
// ═══════════════════════════════════════════════════════════════════════════
export function exportGerencialExcel(gerencial: GerencialData | null, views: Partial<Record<string, GerencialView>>): void {
  const wb = XLSX.utils.book_new()

  if (gerencial) buildGerencialResumo(wb, gerencial)

  for (const view of Object.values(views)) {
    if (view) buildGerencialView(wb, view)
  }

  if (wb.SheetNames.length === 0) return

  const period = gerencial?.period ?? Object.values(views).find(Boolean)?.period ?? 'relatorio'
  const safePeriod = period.replace(/[/\s]/g, '-')
  XLSX.writeFile(wb, `CSM-Gerencial-${safePeriod}.xlsx`)
}

function buildGerencialResumo(wb: XLSX.WorkBook, g: GerencialData) {
  const ws: Record<string, unknown> = {}
  let r = 0

  const spanRow = (row: number) => { ws[addr(row, 1)] = cell('', S.sheetTitle) }
  const subSpan = (row: number) => { ws[addr(row, 1)] = cell('', S.subTitle) }
  const emptyRow = (row: number) => { ws[addr(row, 0)] = cell('', S.empty); ws[addr(row, 1)] = cell('', S.empty) }
  const secLabel = (row: number, text: string) => {
    ws[addr(row, 0)] = cell(text, S.sectionLabel); ws[addr(row, 1)] = cell('', S.sectionLabel)
  }
  const kpiRow = (row: number, label: string, value: number, fmt: string) => {
    ws[addr(row, 0)] = cell(label, S.kpiLabel)
    ws[addr(row, 1)] = cell(value, S.kpiValue, fmt)
  }

  ws[addr(r, 0)] = cell('CSM Dashboard — Relatório Gerencial', S.sheetTitle); spanRow(r); r++
  ws[addr(r, 0)] = cell(`Empresa: ${g.company}`, S.subTitle); subSpan(r); r++
  ws[addr(r, 0)] = cell(`Período: ${g.period}`, S.subTitle); subSpan(r); r++
  ws[addr(r, 0)] = cell(`Gerado em: ${g.generatedAt}`, S.subTitle); subSpan(r); r++
  emptyRow(r); r++

  secLabel(r, '  VENDAS'); r++
  kpiRow(r, 'Faturamento Bruto',   g.grossRevenue, '#,##0.00'); r++
  kpiRow(r, 'Faturamento Líquido', g.netRevenue,   '#,##0.00'); r++
  kpiRow(r, 'Custo Total',         g.cost,         '#,##0.00'); r++
  kpiRow(r, 'Lucro Total',         g.profitValue,  '#,##0.00'); r++
  kpiRow(r, 'Margem (%)',          g.profitPct,    '0.00"%"');  r++
  kpiRow(r, 'Nº de Pedidos',       g.orderCount,   '#,##0');    r++
  kpiRow(r, 'Nº de Itens',         g.itemCount,    '#,##0');    r++
  kpiRow(r, 'Descontos',           g.discounts,    '#,##0.00'); r++
  kpiRow(r, 'Bonificações',        g.bonifications,'#,##0.00'); r++
  kpiRow(r, 'PDV Faturamento',     g.pdvRevenue,   '#,##0.00'); r++
  kpiRow(r, 'PDV Pedidos',         g.pdvCount,     '#,##0');    r++

  emptyRow(r); r++
  secLabel(r, '  DEVOLUÇÕES'); r++
  kpiRow(r, 'Valor de Devoluções', g.returnsValue,   '#,##0.00'); r++
  kpiRow(r, 'Nº de Devoluções',    g.returnsCount,   '#,##0');    r++
  kpiRow(r, 'Frete Devoluções',    g.returnsFreight, '#,##0.00'); r++

  emptyRow(r); r++
  secLabel(r, '  FINANCEIRO'); r++
  kpiRow(r, 'Títulos em Aberto',     g.titlesOpen,                  '#,##0.00'); r++
  kpiRow(r, 'Títulos Pagos',         g.titlesPaid,                  '#,##0.00'); r++
  kpiRow(r, 'Total a Receber',       g.totalReceivable,             '#,##0.00'); r++
  kpiRow(r, 'Pedidos em Aberto',     g.openOrders,                  '#,##0.00'); r++
  kpiRow(r, 'Cheques a Receber',     g.checkReceivable,             '#,##0.00'); r++
  kpiRow(r, 'Cartão a Receber',      g.cardReceivable,              '#,##0.00'); r++
  kpiRow(r, 'Total Contas a Receber',g.totalAccountsReceivable,     '#,##0.00'); r++
  kpiRow(r, 'Total Contas a Pagar',  g.totalAccountsPayable,        '#,##0.00'); r++
  kpiRow(r, 'Valor Recebido',        g.valueReceived,               '#,##0.00'); r++
  kpiRow(r, 'Estoque',               g.stockBalance,                '#,##0.00'); r++

  const merges: XLSX.Range[] = []
  for (let i = 0; i <= 5; i++) merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 1 } })

  ws['!ref']    = `A1:B${r}`
  ws['!merges'] = merges
  ws['!cols']   = [{ wch: 34 }, { wch: 22 }]
  ws['!rows']   = [{ hpt: 28 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }]

  XLSX.utils.book_append_sheet(wb, ws as XLSX.WorkSheet, 'Resumo Gerencial')
}

function buildGerencialView(wb: XLSX.WorkBook, view: GerencialView) {
  const ws: Record<string, unknown> = {}
  let r = 0
  const COLS = 9

  for (let c = 0; c < COLS; c++) ws[addr(r, c)] = cell(c === 0 ? view.label : '', S.sheetTitle)
  r++
  for (let c = 0; c < COLS; c++) ws[addr(r, c)] = cell(c === 0 ? `Período: ${view.period}  |  ${view.company}` : '', S.subTitle)
  r++
  for (let c = 0; c < COLS; c++) ws[addr(r, c)] = cell('', S.empty)
  r++

  const headers = ['#', 'Nome', 'Pedidos', 'Itens', 'Faturamento (R$)', 'Custo (R$)', 'Lucro (R$)', 'Margem (%)', 'ABC']
  headers.forEach((h, c) => { ws[addr(r, c)] = cell(h, S.colHeader) })
  const headerRow = r; r++

  view.rows.forEach((row, i) => {
    const o = i % 2 === 0
    const rs = o ? S.rowOdd  : S.rowEven
    const ns = o ? S.numOdd  : S.numEven
    const ps = o ? S.pctOdd  : S.pctEven
    const center = { horizontal: 'center', vertical: 'center' }

    ws[addr(r, 0)] = cell(String(i + 1),     { ...rs, alignment: center } as object)
    ws[addr(r, 1)] = cell(row.name,           rs)
    ws[addr(r, 2)] = cell(row.orders ?? 0,   { ...ns, alignment: center } as object, '#,##0')
    ws[addr(r, 3)] = cell(row.items,          ns, '#,##0')
    ws[addr(r, 4)] = cell(row.revenue,        ns, '#,##0.00')
    ws[addr(r, 5)] = cell(row.cost,           ns, '#,##0.00')
    ws[addr(r, 6)] = cell(row.profit,         ns, '#,##0.00')
    ws[addr(r, 7)] = cell(row.margin,         ps, '0.00"%"')
    ws[addr(r, 8)] = cell(row.abcClass,       { ...rs, alignment: center } as object)
    r++
  })

  const totalRevenue = view.rows.reduce((s, rw) => s + rw.revenue, 0)
  const totalCost    = view.rows.reduce((s, rw) => s + rw.cost, 0)
  const totalProfit  = view.rows.reduce((s, rw) => s + rw.profit, 0)
  const totalItems   = view.rows.reduce((s, rw) => s + rw.items, 0)
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  ws[addr(r, 0)] = cell('TOTAL',       S.rowTotal)
  ws[addr(r, 1)] = cell('',           S.rowTotal)
  ws[addr(r, 2)] = cell('',           S.rowTotal)
  ws[addr(r, 3)] = cell(totalItems,   { ...S.numTotalR } as object, '#,##0')
  ws[addr(r, 4)] = cell(totalRevenue, S.numTotalR, '#,##0.00')
  ws[addr(r, 5)] = cell(totalCost,    S.numTotalR, '#,##0.00')
  ws[addr(r, 6)] = cell(totalProfit,  S.numTotalR, '#,##0.00')
  ws[addr(r, 7)] = cell(avgMargin,    S.pctTotal,  '0.00"%"')
  ws[addr(r, 8)] = cell('',           S.rowTotal)
  r++

  ws['!ref']        = `A1:I${r}`
  ws['!merges']     = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COLS - 1 } },
  ]
  ws['!cols'] = [
    { wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 10 },
    { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 5 },
  ]
  ws['!rows']       = [{ hpt: 28 }, { hpt: 18 }]
  ws['!autofilter'] = { ref: `A${headerRow + 1}:I${r}` }
  ws['!freeze']     = { xSplit: 0, ySplit: headerRow + 1 }

  const sheetName = view.label.substring(0, 31).replace(/[\\/?*[\]:]/g, '')
  XLSX.utils.book_append_sheet(wb, ws as XLSX.WorkSheet, sheetName)
}
