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

const CONTENT_STYLE = {
  maxWidth: '1440px',
  margin: '0 auto',
} as const

export default function App() {
  const report = useDashboardStore((s) => s.report)
  const gerencial = useDashboardStore((s) => s.gerencial)
  const activeTab = useDashboardStore((s) => s.activeTab)
  const isPresentationMode = useDashboardStore((s) => s.isPresentationMode)

  // Mostra ImportScreen apenas quando não há nenhum relatório carregado e não é a aba tutorial
  if (!report && !gerencial && activeTab !== 'tutorial') return <ImportScreen />

  return (
    <>
      <Header />
      <TabBar />
      <div style={CONTENT_STYLE}>
        {activeTab === 'dashboard'  && report && <TabDashboard />}
        {activeTab === 'comparacao' && report && <TabComparacao />}
        {activeTab === 'devolucoes' && report && <TabDevolucoes />}
        {activeTab === 'historico'  && report && <TabHistorico />}
        {activeTab === 'gerencial'  && gerencial && <TabGerencial />}
        {activeTab === 'tutorial'   && <TabTutorial />}
      </div>
      {isPresentationMode && <PresentationMode />}
    </>
  )
}
