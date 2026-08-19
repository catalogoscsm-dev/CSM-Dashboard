import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { ReportData } from '../types'

// A4 landscape in mm
const PAGE_W = 297
const PAGE_H = 210
const MARGIN = 12
const HEADER_H = 18
const FOOTER_H = 10

export async function exportDashboardPdf(report: ReportData): Promise<void> {
  const main = document.querySelector('main') as HTMLElement | null
  if (!main) return

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // ── Capturar o conteúdo ────────────────────────────────────────────
  const canvas = await html2canvas(main, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#F4F5F7',
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: main.scrollWidth,
    windowHeight: main.scrollHeight,
  })

  const contentW = PAGE_W - MARGIN * 2
  const contentH = PAGE_H - MARGIN * 2 - HEADER_H - FOOTER_H

  // Dimensões reais da captura em mm (convertendo de px → mm a 96dpi ≈ 3.78px/mm)
  const capW = canvas.width / 1.5   // px sem scale
  const capH = canvas.height / 1.5  // px sem scale
  const mmPerPx = contentW / capW
  const totalHeightMm = capH * mmPerPx

  const totalPages = Math.ceil(totalHeightMm / contentH)

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage()

    // ── Header ──────────────────────────────────────────────────────
    pdf.setFillColor(13, 27, 42)          // --navy
    pdf.rect(0, 0, PAGE_W, HEADER_H, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(201, 168, 76)        // --gold
    pdf.text('CSM Dashboard', MARGIN, HEADER_H / 2 + 2)

    if (report.company) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(232, 236, 240)     // --text-on-dark
      pdf.text(report.company, PAGE_W / 2, HEADER_H / 2 + 2, { align: 'center' })
    }

    if (report.period) {
      pdf.setFontSize(8)
      pdf.setTextColor(156, 163, 175)     // --text-muted
      pdf.text(report.period, PAGE_W - MARGIN, HEADER_H / 2 + 2, { align: 'right' })
    }

    // ── Fatia da imagem para esta página ────────────────────────────
    const sliceYMm = page * contentH
    const sliceYPx = (sliceYMm / mmPerPx) * 1.5  // voltando para px com scale

    const sliceHeightPx = Math.min(
      (contentH / mmPerPx) * 1.5,
      canvas.height - sliceYPx
    )

    if (sliceHeightPx <= 0) break

    // Criar canvas da fatia
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = sliceHeightPx
    const ctx = sliceCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, -sliceYPx)

    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92)
    const sliceHeightMm = Math.min(contentH, totalHeightMm - sliceYMm)

    pdf.addImage(
      sliceData,
      'JPEG',
      MARGIN,
      HEADER_H + MARGIN / 2,
      contentW,
      sliceHeightMm
    )

    // ── Footer ──────────────────────────────────────────────────────
    pdf.setFillColor(244, 245, 247)       // --bg
    pdf.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F')
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(156, 163, 175)

    const generated = report.generatedAt
      ? `Relatório gerado em ${report.generatedAt}`
      : ''
    if (generated) pdf.text(generated, MARGIN, PAGE_H - FOOTER_H / 2 + 1)

    pdf.text(
      `Página ${page + 1} de ${totalPages}`,
      PAGE_W - MARGIN,
      PAGE_H - FOOTER_H / 2 + 1,
      { align: 'right' }
    )
  }

  const filename = `CSM-Dashboard${report.period ? '-' + report.period.replace(/\//g, '-').replace(/\s+a\s+/g, '_') : ''}.pdf`
  pdf.save(filename)
}
