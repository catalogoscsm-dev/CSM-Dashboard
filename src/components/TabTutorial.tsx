import { useState } from 'react'
import TourOverlay from './TourOverlay'

interface SectionCard {
  emoji: string
  title: string
  subtitle: string
  items: string[]
  color: string
}

const SECTIONS: SectionCard[] = [
  {
    emoji: '📊',
    title: 'Dashboard',
    subtitle: 'Análise completa do período',
    color: 'var(--navy)',
    items: [
      '5 KPIs instantâneos: faturamento, lucro, margem, itens e devoluções',
      'Metas mensais com barras de progresso em tempo real',
      'Gráfico de receita por categoria (clicável para filtrar)',
      'Gráfico de distribuição em pizza (clicável para filtrar)',
      'Gráfico comparativo lucro vs. custo',
      'Ranking dos produtos mais rentáveis',
      'Insights automáticos com alertas de margem',
      'Tabela completa com busca, ordenação e paginação',
    ],
  },
  {
    emoji: '⚖️',
    title: 'Comparação',
    subtitle: 'Dois períodos lado a lado',
    color: '#7C3AED',
    items: [
      'Carregue um segundo relatório .HTM (Período B)',
      'Veja deltas ▲▼ de faturamento, lucro e margem',
      'Gráficos de receita de ambos os períodos',
      'Tabela por categoria com variação em pontos percentuais',
      'Ideal para responder: "crescemos em relação ao mês passado?"',
    ],
  },
  {
    emoji: '🔄',
    title: 'Devoluções',
    subtitle: 'Impacto financeiro dos retornos',
    color: 'var(--negative)',
    items: [
      'Taxa de devolução por categoria (%)',
      'Top 10 produtos devolvidos por valor absoluto',
      'Receita e lucro perdidos com devoluções',
      'Ticket médio das devoluções',
      'Estado positivo verde quando não há devoluções',
    ],
  },
  {
    emoji: '📅',
    title: 'Histórico',
    subtitle: 'Tendência mês a mês',
    color: 'var(--positive)',
    items: [
      'Clique em "Salvar" no cabeçalho para guardar um relatório',
      'Guarda até 24 relatórios no navegador (sem servidor)',
      'Gráfico de tendência de faturamento e lucro',
      'Edição inline do nome de cada entrada',
      'Carregue um relatório antigo com um clique',
    ],
  },
  {
    emoji: '🎛️',
    title: 'Cabeçalho',
    subtitle: 'Central de ações rápidas',
    color: '#0891B2',
    items: [
      'Salvar: guarda o relatório atual no histórico',
      'Excel: exporta planilha .xlsx com 3 abas (Resumo, Categorias, Produtos)',
      'PDF: exporta relatório completo em PDF',
      'Apresentar: modo fullscreen para TV ou reunião (ESC para sair)',
      'Importar: carrega um novo relatório .HTM',
    ],
  },
]

const WORKFLOW = [
  { step: '1', icon: '📂', text: 'Exporte o relatório do Vinhasoft em formato .HTM' },
  { step: '2', icon: '🖱️', text: 'Arraste o arquivo para a tela inicial do dashboard' },
  { step: '3', icon: '📊', text: 'Analise os KPIs, gráficos e insights do Dashboard' },
  { step: '4', icon: '💾', text: 'Clique em "Salvar" para guardar no Histórico' },
  { step: '5', icon: '⚖️', text: 'No mês seguinte, compare dois períodos na aba Comparação' },
  { step: '6', icon: '📈', text: 'Acompanhe a tendência na aba Histórico com o gráfico de linha' },
]

const TIPS = [
  { icon: '⌨️', text: 'No tour interativo, use ← → para navegar entre os passos' },
  { icon: '🎯', text: 'Defina metas mensais para acompanhar o desempenho com progresso visual' },
  { icon: '🔍', text: 'Clique em qualquer barra ou pizza nos gráficos para filtrar a tabela' },
  { icon: '✏️', text: 'No Histórico, clique no nome do relatório para renomear inline' },
  { icon: '⚙️', text: 'Os thresholds de alerta de margem são configuráveis nos Insights' },
  { icon: '📺', text: 'Use o Modo Apresentação para exibir os números em uma TV durante reuniões' },
]

export default function TabTutorial() {
  const [tourActive, setTourActive] = useState(false)

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 60px' }}>

      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        background: 'linear-gradient(135deg, var(--navy) 0%, #1e3a5f 100%)',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(201,168,76,0.15) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>📖</div>
        <h1 style={{
          fontSize: '32px', fontWeight: 900, color: '#fff',
          marginBottom: '10px', lineHeight: 1.2,
        }}>
          Central de Ajuda
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '28px', maxWidth: '520px', margin: '0 auto 28px' }}>
          Aprenda a usar o CSM Dashboard — da importação do relatório até a análise avançada de tendências.
        </p>
        <button
          onClick={() => setTourActive(true)}
          style={{
            fontSize: '15px', fontWeight: 700,
            background: 'var(--gold)', color: 'var(--navy)',
            border: 'none', borderRadius: 'var(--radius-md)',
            padding: '14px 32px', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
            letterSpacing: '0.3px',
          }}
        >
          🚀 Iniciar Tour Interativo
        </button>
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
          12 passos · ~2 minutos · navega pelas abas automaticamente
        </div>
      </div>

      {/* Fluxo de uso */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '20px' }}>
          Fluxo de Uso Diário
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {WORKFLOW.map((w) => (
            <div key={w.step} style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              padding: '20px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: '32px', height: '32px', flexShrink: 0,
                borderRadius: '50%',
                background: 'var(--navy)',
                color: 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '13px',
              }}>
                {w.step}
              </div>
              <div>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{w.icon}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.5 }}>{w.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mapa do site */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '20px' }}>
          Mapa do Software
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {SECTIONS.map((s) => (
            <div key={s.title} style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}>
              {/* Card header */}
              <div style={{
                background: s.color,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{ fontSize: '26px' }}>{s.emoji}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>{s.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{s.subtitle}</div>
                </div>
              </div>
              {/* Card body */}
              <ul style={{ margin: 0, padding: '16px 20px', listStyle: 'none' }}>
                {s.items.map((item, i) => (
                  <li key={i} style={{
                    fontSize: '13px',
                    color: 'var(--text-dim)',
                    padding: '6px 0',
                    borderBottom: i < s.items.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    lineHeight: 1.5,
                  }}>
                    <span style={{ color: s.color, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Dicas rápidas */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '20px' }}>
          Dicas Rápidas
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '14px',
        }}>
          {TIPS.map((tip, i) => (
            <div key={i} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{tip.icon}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.5 }}>{tip.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={{
        textAlign: 'center',
        padding: '36px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎯</div>
        <h3 style={{ fontWeight: 800, fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>
          Pronto para começar?
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Faça o tour guiado para ver cada funcionalidade em ação enquanto navega pelo software.
        </p>
        <button
          onClick={() => setTourActive(true)}
          style={{
            fontSize: '14px', fontWeight: 700,
            background: 'var(--navy)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            padding: '12px 28px', cursor: 'pointer',
          }}
        >
          🚀 Iniciar Tour Interativo
        </button>
      </div>

      {/* Tour overlay */}
      {tourActive && <TourOverlay onClose={() => setTourActive(false)} />}
    </div>
  )
}
