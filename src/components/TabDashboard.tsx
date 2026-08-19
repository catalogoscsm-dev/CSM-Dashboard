import { useDashboardStore } from '../store/useDashboardStore'
import KPIRow from './KPIRow'
import ChartRevenueByCategory from './ChartRevenueByCategory'
import ChartDistribution from './ChartDistribution'
import ChartProfitVsCost from './ChartProfitVsCost'
import RankingProducts from './RankingProducts'
import InsightsPanel from './InsightsPanel'
import ProductsTable from './ProductsTable'
import GoalProgressBar from './GoalProgressBar'

const CONTENT_STYLE = {
  maxWidth: '1440px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '20px',
}

export default function TabDashboard() {
  const report = useDashboardStore((s) => s.report)!
  const activeCategory = useDashboardStore((s) => s.activeCategory)
  const setActiveCategory = useDashboardStore((s) => s.setActiveCategory)

  return (
    <div style={CONTENT_STYLE}>
      <div id="tour-kpi"><KPIRow report={report} /></div>
      <div id="tour-goal"><GoalProgressBar /></div>
      <div id="tour-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
        <ChartRevenueByCategory
          categories={report.categories}
          activeCategory={activeCategory}
          onCategoryClick={setActiveCategory}
        />
        <ChartDistribution
          categories={report.categories}
          totalRevenue={report.grandTotal.revenue}
          activeCategory={activeCategory}
          onCategoryClick={setActiveCategory}
        />
      </div>
      <ChartProfitVsCost categories={report.categories} />
      <RankingProducts categories={report.categories} />
      <div id="tour-insights"><InsightsPanel report={report} /></div>
      <div id="tour-table"><ProductsTable categories={report.categories} /></div>
    </div>
  )
}
