import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import type { AppTab } from '../types'

interface TourStep {
  title: string
  description: string
  tab: AppTab | null
  selector: string | null
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  emoji: string
}

const STEPS: TourStep[] = [
  {
    title: 'Bem-vindo ao CSM Dashboard!',
    description: 'Este tour vai te guiar por todas as funcionalidades do sistema em menos de 2 minutos. Você pode avançar, voltar ou encerrar a qualquer momento.',
    tab: null,
    selector: null,
    position: 'center',
    emoji: '👋',
  },
  {
    title: 'Cabeçalho — Central de Ações',
    description: 'Aqui ficam os botões principais: Salvar (guarda o relatório no histórico), Excel (exporta planilha), PDF (exporta relatório), Apresentar (modo TV/reunião) e Importar (carregar novo relatório).',
    tab: 'dashboard',
    selector: 'header',
    position: 'bottom',
    emoji: '🎛️',
  },
  {
    title: 'Navegação por Abas',
    description: 'O software tem 5 seções: Dashboard (análise principal), Comparação (dois períodos lado a lado), Devoluções (análise de retornos), Histórico (tendência mensal) e Ajuda (você está aqui!).',
    tab: 'dashboard',
    selector: '#tour-tabbar',
    position: 'bottom',
    emoji: '🗂️',
  },
  {
    title: 'KPIs — Indicadores Principais',
    description: 'Os 5 cards no topo mostram: Faturamento Total, Lucro Total, Margem Média, Itens Vendidos e Devoluções. Os números animam ao carregar e refletem sempre o período do relatório importado.',
    tab: 'dashboard',
    selector: '#tour-kpi',
    position: 'bottom',
    emoji: '📊',
  },
  {
    title: 'Metas Mensais',
    description: 'Clique em "+ Definir metas mensais" para configurar uma meta de faturamento e lucro. As barras de progresso mostram em tempo real o quanto da meta já foi atingido — e ficam salvas mesmo após fechar o navegador.',
    tab: 'dashboard',
    selector: '#tour-goal',
    position: 'bottom',
    emoji: '🎯',
  },
  {
    title: 'Gráficos Interativos',
    description: 'Clique em qualquer barra ou fatia do gráfico para filtrar toda a tabela de produtos daquela categoria. Um chip "Filtrado: X ×" aparecerá na tabela — clique nele para remover o filtro.',
    tab: 'dashboard',
    selector: '#tour-charts',
    position: 'bottom',
    emoji: '📈',
  },
  {
    title: 'Insights Automáticos',
    description: 'O sistema analisa os dados e gera alertas automaticamente: produto mais lucrativo, categoria mais eficiente, margens suspeitas e devoluções. Clique em "⚙ Configurar alertas" para ajustar os limites de margem.',
    tab: 'dashboard',
    selector: '#tour-insights',
    position: 'top',
    emoji: '💡',
  },
  {
    title: 'Tabela de Produtos',
    description: 'Veja todos os produtos com ordenação, busca por nome/código, filtro por categoria e toggle de devoluções. Produtos com margem fora do padrão recebem badges coloridos. A paginação exibe 20 itens por página.',
    tab: 'dashboard',
    selector: '#tour-table',
    position: 'top',
    emoji: '📋',
  },
  {
    title: 'Aba Comparação',
    description: 'Carregue dois relatórios HTM de períodos diferentes e veja os deltas ▲▼ de faturamento, lucro e margem entre eles. Ideal para responder: "crescemos em relação ao mês passado?"',
    tab: 'comparacao',
    selector: null,
    position: 'center',
    emoji: '⚖️',
  },
  {
    title: 'Aba Devoluções',
    description: 'Analise o impacto das devoluções: taxa por categoria (%), maiores devoluções por valor e impacto financeiro total (receita e lucro perdidos). Se não há devoluções, aparece um estado positivo verde.',
    tab: 'devolucoes',
    selector: null,
    position: 'center',
    emoji: '🔄',
  },
  {
    title: 'Aba Histórico',
    description: 'Cada vez que você clica em "Salvar" no cabeçalho, o relatório é guardado aqui. Com 2 ou mais relatórios salvos, um gráfico de tendência mostra a evolução do faturamento e lucro ao longo dos meses.',
    tab: 'historico',
    selector: null,
    position: 'center',
    emoji: '📅',
  },
  {
    title: 'Pronto! Você conhece o CSM Dashboard.',
    description: 'Fluxo recomendado: importe o relatório → analise o Dashboard → salve no Histórico → compare com o mês anterior. A aba Ajuda estará sempre disponível se precisar rever qualquer funcionalidade.',
    tab: null,
    selector: null,
    position: 'center',
    emoji: '🏆',
  },
]

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface Props {
  onClose: () => void
}

export default function TourOverlay({ onClose }: Props) {
  const setActiveTab = useDashboardStore((s) => s.setActiveTab)
  const report = useDashboardStore((s) => s.report)

  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<SpotlightRect | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const tooltipRef = useRef<HTMLDivElement>(null)

  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  const updateSpotlight = useCallback(() => {
    const s = STEPS[step]
    if (!s.selector) {
      setRect(null)
      setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
      return
    }
    const el = document.querySelector(s.selector)
    if (!el) {
      setRect(null)
      setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Small delay to let scroll settle before measuring
    setTimeout(() => {
      const r = el.getBoundingClientRect()
      const pad = 10
      const spotlight: SpotlightRect = {
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      }
      setRect(spotlight)

      // Position tooltip based on step.position
      const vw = window.innerWidth
      const vh = window.innerHeight
      const TOOLTIP_W = 380
      const TOOLTIP_H = 200
      const GAP = 16

      let style: React.CSSProperties = {}

      if (s.position === 'bottom') {
        const top = Math.min(r.bottom + pad + GAP, vh - TOOLTIP_H - 16)
        const left = Math.max(16, Math.min(r.left + r.width / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - 16))
        style = { position: 'fixed', top, left, width: TOOLTIP_W }
      } else if (s.position === 'top') {
        const bottom = Math.max(16, vh - (r.top - pad - GAP))
        const left = Math.max(16, Math.min(r.left + r.width / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - 16))
        style = { position: 'fixed', bottom, left, width: TOOLTIP_W }
      } else if (s.position === 'right') {
        const top = Math.max(16, Math.min(r.top + r.height / 2 - TOOLTIP_H / 2, vh - TOOLTIP_H - 16))
        const left = Math.min(r.right + pad + GAP, vw - TOOLTIP_W - 16)
        style = { position: 'fixed', top, left, width: TOOLTIP_W }
      } else if (s.position === 'left') {
        const top = Math.max(16, Math.min(r.top + r.height / 2 - TOOLTIP_H / 2, vh - TOOLTIP_H - 16))
        const left = Math.max(16, r.left - pad - GAP - TOOLTIP_W)
        style = { position: 'fixed', top, left, width: TOOLTIP_W }
      } else {
        style = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: TOOLTIP_W }
      }

      setTooltipStyle(style)
    }, 300)
  }, [step])

  // Switch tab and measure spotlight when step changes
  useLayoutEffect(() => {
    const s = STEPS[step]
    if (s.tab) setActiveTab(s.tab)
  }, [step, setActiveTab])

  useEffect(() => {
    // Delay to let tab render before measuring
    const t = setTimeout(updateSpotlight, 400)
    return () => clearTimeout(t)
  }, [updateSpotlight])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && !isLast) setStep((s) => s + 1)
      if (e.key === 'ArrowLeft' && !isFirst) setStep((s) => s - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isLast, isFirst, onClose])

  // Skip steps that need report when no report loaded
  const goNext = () => {
    let next = step + 1
    while (next < STEPS.length - 1 && !report && STEPS[next].tab && STEPS[next].tab !== 'tutorial') {
      next++
    }
    if (next >= STEPS.length) { onClose(); return }
    setStep(next)
  }

  const goPrev = () => {
    let prev = step - 1
    while (prev > 0 && !report && STEPS[prev].tab && STEPS[prev].tab !== 'tutorial') {
      prev--
    }
    setStep(Math.max(0, prev))
  }

  return (
    <>
      {/* Dark overlay */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9000, cursor: 'default' }}
        onClick={onClose}
      />

      {/* Spotlight cutout */}
      {rect && (
        <div
          style={{
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: '10px',
            zIndex: 9001,
            boxShadow: '0 0 0 9999px rgba(13,27,42,0.82)',
            border: '2px solid var(--gold)',
            pointerEvents: 'none',
            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      )}

      {/* Dark tint when no spotlight (centered steps) */}
      {!rect && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9001,
          background: 'rgba(13,27,42,0.82)', pointerEvents: 'none',
        }} />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          ...tooltipStyle,
          zIndex: 9002,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          border: '1px solid var(--border)',
          animation: 'fadeSlideUp 0.25s ease both',
          maxWidth: '90vw',
          pointerEvents: 'all',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '16px' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                height: '3px',
                flex: 1,
                borderRadius: '2px',
                background: i <= step ? 'var(--gold)' : 'var(--border)',
                cursor: 'pointer',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step counter */}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Passo {step + 1} de {STEPS.length}
        </div>

        {/* Content */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
          <span style={{ fontSize: '28px', flexShrink: 0 }}>{current.emoji}</span>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--navy)', marginBottom: '6px', lineHeight: 1.3 }}>
              {current.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              {current.description}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              fontSize: '12px', color: 'var(--text-muted)', background: 'transparent',
              border: 'none', cursor: 'pointer', padding: '4px',
            }}
          >
            Encerrar tour
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isFirst && (
              <button
                onClick={goPrev}
                style={{
                  fontSize: '13px', fontWeight: 600,
                  background: 'var(--surface-2)', color: 'var(--text)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  padding: '8px 16px', cursor: 'pointer',
                }}
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={isLast ? onClose : goNext}
              style={{
                fontSize: '13px', fontWeight: 700,
                background: isLast ? 'var(--positive)' : 'var(--navy)',
                color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                padding: '8px 20px', cursor: 'pointer',
              }}
            >
              {isLast ? '🎉 Concluir' : 'Próximo →'}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            ← → para navegar · ESC para sair
          </span>
        </div>
      </div>
    </>
  )
}
