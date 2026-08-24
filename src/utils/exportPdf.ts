import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useDashboardStore } from '../store/useDashboardStore'

const PAGE_W = 297 // A4 landscape
const PAGE_H = 210
const MARGIN = 12
const HEADER_H = 18
const FOOTER_H = 10

interface PdfMeta {
  company?: string
  period?: string
  generatedAt?: string
}

export async function exportDashboardPdf(meta: PdfMeta): Promise<void> {
  const report = meta
  const main = document.querySelector('main') as HTMLElement | null
  if (!main) return

  const { setPdfExporting } = useDashboardStore.getState()

  setPdfExporting(true)
  document.body.classList.add('pdf-exporting')
  // 200ms: enough for React to re-render expanded tables and browser to lay out
  await new Promise<void>((resolve) => setTimeout(resolve, 200))

  try {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const canvas = await html2canvas(main, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#FDFCFA',
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: main.scrollWidth,
      windowHeight: main.scrollHeight,
    })

    const contentW = PAGE_W - MARGIN * 2
    const contentH = PAGE_H - MARGIN * 2 - HEADER_H - FOOTER_H

    const capW = canvas.width / 1.5
    const capH = canvas.height / 1.5
    const mmPerPx = contentW / capW
    const totalHeightMm = capH * mmPerPx

    // ── Page breaks inteligentes: evita cortar no meio de seções ──────
    const mainAbsTop = main.getBoundingClientRect().top + window.scrollY
    const contentDiv = main.firstElementChild as HTMLElement | null
    const sectionEls = contentDiv ? (Array.from(contentDiv.children) as HTMLElement[]) : []

    // Posição de cada seção em mm a partir do topo do main
    const sectionTopsMm = sectionEls.map((el) => {
      const px = el.getBoundingClientRect().top + window.scrollY - mainAbsTop
      return px * mmPerPx
    }).filter((t) => t > 2)

    // Monta slices respeitando limites de seção
    const slices: Array<{ start: number; end: number }> = []
    let start = 0

    while (start < totalHeightMm - 1) {
      const idealEnd = start + contentH

      if (idealEnd >= totalHeightMm) {
        slices.push({ start, end: totalHeightMm })
        break
      }

      // Procura a última seção que começa dentro da zona de corte (60–100% da página)
      // e usa ela como ponto de quebra — página termina antes dessa seção
      const cutZone = start + contentH * 0.6
      const breakAt = sectionTopsMm
        .filter((t) => t > cutZone && t <= idealEnd)
        .sort((a, b) => b - a)[0]

      const end = breakAt ?? idealEnd
      slices.push({ start, end })
      start = end
    }

    const totalPages = slices.length

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage()

      // ── Header ──────────────────────────────────────────────────────
      pdf.setFillColor(28, 15, 5)
      pdf.rect(0, 0, PAGE_W, HEADER_H, 'F')
      pdf.setFillColor(249, 115, 22)
      pdf.rect(0, 0, PAGE_W, 1.2, 'F')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(249, 115, 22)
      pdf.text('CSM Dashboard', MARGIN, HEADER_H / 2 + 2)

      if (report.company) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.setTextColor(232, 236, 240)
        pdf.text(report.company, PAGE_W / 2, HEADER_H / 2 + 2, { align: 'center' })
      }

      if (report.period) {
        pdf.setFontSize(8)
        pdf.setTextColor(156, 163, 175)
        pdf.text(report.period, PAGE_W - MARGIN, HEADER_H / 2 + 2, { align: 'right' })
      }

      // ── Fatia da imagem ──────────────────────────────────────────────
      const { start: sliceStartMm, end: sliceEndMm } = slices[page]
      const sliceHeightMm = sliceEndMm - sliceStartMm

      const sliceStartPx = (sliceStartMm / mmPerPx) * 1.5
      const sliceHeightPx = (sliceHeightMm / mmPerPx) * 1.5

      if (sliceHeightPx <= 0) continue

      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = Math.ceil(sliceHeightPx)
      const ctx = sliceCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, -sliceStartPx)

      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92)
      pdf.addImage(sliceData, 'JPEG', MARGIN, HEADER_H + MARGIN / 2, contentW, sliceHeightMm)

      // ── Footer ──────────────────────────────────────────────────────
      pdf.setFillColor(253, 252, 250)
      pdf.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F')
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7)
      pdf.setTextColor(156, 163, 175)

      const generated = report.generatedAt ? `Relatório gerado em ${report.generatedAt}` : ''
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
  } finally {
    document.body.classList.remove('pdf-exporting')
    setPdfExporting(false)
  }
}
