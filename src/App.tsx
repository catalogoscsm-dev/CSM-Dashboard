import { useState } from 'react'
import { useDashboardStore } from './store/useDashboardStore'
import ImportScreen from './components/ImportScreen'
import Header from './components/Header'
import TabBar from './components/TabBar'
import TabDashboard from './components/TabDashboard'
import TabComparacao from './components/TabComparacao'
import TabDevolucoes from './components/TabDevolucoes'
import TabHistorico from './components/TabHistorico'
import TabGerencial from './components/TabGerencial'
import TabTutorial from './components/TabTutorial'
import PresentationMode from './components/PresentationMode'
import TourOverlay from './components/TourOverlay'

const CONTENT_STYLE = {
  maxWidth: '1440px',
  margin: '0 auto',
} as const

export default function App() {
  const report = useDashboardStore((s) => s.report)
  const gerencial = useDashboardStore((s) => s.gerencial)
  const gerencialViews = useDashboardStore((s) => s.gerencialViews)
  const activeTab = useDashboardStore((s) => s.activeTab)
  const isPresentationMode = useDashboardStore((s) => s.isPresentationMode)
  const [tourActive, setTourActive] = useState(false)

  const hasGerencial = !!gerencial || Object.keys(gerencialViews).length > 0

  // Mostra ImportScreen apenas quando não há nenhum dado carregado e não é a aba tutorial
  if (!report && !hasGerencial && activeTab !== 'tutorial') return <ImportScreen />

  return (
    <>
      <Header />
      <TabBar />
      <main style={CONTENT_STYLE}>
        {activeTab === 'dashboard'  && report && <TabDashboard />}
        {activeTab === 'comparacao' && report && <TabComparacao />}
        {activeTab === 'devolucoes' && report && <TabDevolucoes />}
        {activeTab === 'historico'  && report && <TabHistorico />}
        {activeTab === 'gerencial'  && hasGerencial && <TabGerencial />}
        {activeTab === 'tutorial'   && <TabTutorial onStartTour={() => setTourActive(true)} />}
      </main>
      {isPresentationMode && <PresentationMode />}
      {tourActive && <TourOverlay onClose={() => setTourActive(false)} />}
    </>
  )
}
