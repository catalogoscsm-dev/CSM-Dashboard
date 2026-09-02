import React, { useState, useMemo, useEffect, useRef } from 'react'
import type { Category } from '../types'
import { fmtBRL, fmtPct, fmtQty } from '../utils/format'
import { useDashboardStore } from '../store/useDashboardStore'
import MarginAlertBadge from './MarginAlertBadge'

interface Props {
  categories: Category[]
}

type SortKey = 'name' | 'qty' | 'revenue' | 'cost' | 'profit' | 'margin'
type SortDir = 'asc' | 'desc'
type AlertFilter = 'all' | 'low' | 'review' | 'normal'

interface FlatProduct {
  code: string
  name: string
  categoryName: string
  qty: number
  revenue: number
  cost: number
  profit: number
  margin: number
  isReturn: boolean
}

const PAGE_SIZE = 20

const ALERT_LABELS: Record<AlertFilter, string> = {
  all: 'Todos',
  low: '⚠ Baixa margem',
  review: '↑ Revisar preço',
  normal: '✓ Normal',
}

export default function ProductsTable({ categories }: Props) {
  const searchQuery = useDashboardStore((s) => s.searchQuery)
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery)
  const showReturnsOnly = useDashboardStore((s) => s.showReturnsOnly)
  const toggleReturnsOnly = useDashboardStore((s) => s.toggleReturnsOnly)
  const activeCategory = useDashboardStore((s) => s.activeCategory)
  const setActiveCategory = useDashboardStore((s) => s.setActiveCategory)
  const thresholds = useDashboardStore((s) => s.thresholds)
  const isPdfExporting = useDashboardStore((s) => s.isPdfExporting)

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set())
  const [filterMarginMin, setFilterMarginMin] = useState('')
  const [filterMarginMax, setFilterMarginMax] = useState('')
  const [filterRevenueMin, setFilterRevenueMin] = useState('')
  const [filterRevenueMax, setFilterRevenueMax] = useState('')
  const [filterAlert, setFilterAlert] = useState<AlertFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const prevActiveCatRef = useRef<string | null>(null)

  // Sync drilldown do gráfico → filterCategories
  useEffect(() => {
    if (activeCategory) {
      setFilterCategories(new Set([activeCategory]))
      setPage(1)
    } else if (prevActiveCatRef.current) {
      setFilterCategories((prev) => {
        if (prev.size === 1 && prev.has(prevActiveCatRef.current!)) return new Set()
        return prev
      })
      setPage(1)
    }
    prevActiveCatRef.current = activeCategory
  }, [activeCategory])

  const allProducts: FlatProduct[] = useMemo(() =>
    categories.flatMap((c) =>
      c.products.map((p) => ({ ...p, categoryName: c.name }))
    ), [categories])

  const marginMin = filterMarginMin !== '' ? parseFloat(filterMarginMin) : null
  const marginMax = filterMarginMax !== '' ? parseFloat(filterMarginMax) : null
  const revenueMin = filterRevenueMin !== '' ? parseFloat(filterRevenueMin.replace(/\./g, '').replace(',', '.')) : null
  const revenueMax = filterRevenueMax !== '' ? parseFloat(filterRevenueMax.replace(/\./g, '').replace(',', '.')) : null

  const filtered = useMemo(() => {
    let list = allProducts

    if (filterCategories.size > 0) list = list.filter((p) => filterCategories.has(p.categoryName))
    if (showReturnsOnly) list = list.filter((p) => p.isReturn)

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
    }

    if (marginMin !== null) list = list.filter((p) => p.margin >= marginMin)
    if (marginMax !== null) list = list.filter((p) => p.margin <= marginMax)
    if (revenueMin !== null) list = list.filter((p) => Math.abs(p.revenue) >= revenueMin)
    if (revenueMax !== null) list = list.filter((p) => Math.abs(p.revenue) <= revenueMax)

    if (filterAlert !== 'all') {
      list = list.filter((p) => {
        if (p.isReturn) return false
        if (filterAlert === 'low') return p.margin < thresholds.lowMarginPct
        if (filterAlert === 'review') return p.margin >= thresholds.highMarginPct
        if (filterAlert === 'normal') return p.margin >= thresholds.lowMarginPct && p.margin < thresholds.highMarginPct
        return true
      })
    }

    return [...list].sort((a, b) => {
      const av = a[sortKey] as number | string
      const bv = b[sortKey] as number | string
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [allProducts, filterCategories, showReturnsOnly, searchQuery, marginMin, marginMax, revenueMin, revenueMax, filterAlert, thresholds, sortKey, sortDir])

  const summary = useMemo(() => {
    const qty = filtered.reduce((s, p) => s + p.qty, 0)
    const revenue = filtered.reduce((s, p) => s + p.revenue, 0)
    const cost = filtered.reduce((s, p) => s + p.cost, 0)
    const profit = filtered.reduce((s, p) => s + p.profit, 0)
    const margin = cost !== 0 ? (revenue / cost) * 100 : 0
    return { qty, revenue, cost, profit, margin }
  }, [filtered])

  const activeFilterCount = [
    !!searchQuery,
    filterCategories.size > 0,
    showReturnsOnly,
    filterMarginMin !== '' || filterMarginMax !== '',
    filterRevenueMin !== '' || filterRevenueMax !== '',
    filterAlert !== 'all',
  ].filter(Boolean).length

  const hasActiveFilter = activeFilterCount > 0

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = isPdfExporting ? filtered : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const toggleCategory = (catName: string) => {
    setFilterCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catName)) next.delete(catName)
      else next.add(catName)
      setActiveCategory(next.size === 1 ? [...next][0] : null)
      return next
    })
    setPage(1)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterCategories(new Set())
    setActiveCategory(null)
    setFilterMarginMin('')
    setFilterMarginMax('')
    setFilterRevenueMin('')
    setFilterRevenueMax('')
    setFilterAlert('all')
    if (showReturnsOnly) toggleReturnsOnly()
    setPage(1)
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span style={{ color: 'var(--border)', marginLeft: '4px' }}>↕</span>
    return <span style={{ color: 'var(--gold)', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    background: 'var(--surface-2)',
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '13px',
    color: 'var(--text)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: '12px',
    color: 'var(--text)',
    background: 'var(--bg)',
    width: '90px',
    outline: 'none',
  }

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* ── Toolbar principal ── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: showAdvanced ? 'none' : '1px solid var(--border)',
        display: isPdfExporting ? 'none' : 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', margin: 0 }}>
          Todos os Produtos
        </h3>

        {/* Chip de drilldown */}
        {activeCategory && filterCategories.size === 1 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            fontWeight: 600, color: 'var(--navy)', background: '#EFF6FF',
            border: '1px solid var(--navy)', borderRadius: '20px', padding: '3px 10px',
          }}>
            {activeCategory}
            <button
              onClick={() => { setActiveCategory(null); setFilterCategories(new Set()) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)', fontWeight: 800, fontSize: '13px', lineHeight: 1, padding: 0 }}
            >×</button>
          </span>
        )}

        {/* Busca */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <input
            type="search"
            placeholder="Buscar produto ou código…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            style={{
              width: '100%', padding: '7px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text)',
              background: 'var(--bg)', outline: 'none',
            }}
          />
        </div>

        {/* Botão filtros avançados */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 12px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${showAdvanced || activeFilterCount > 0 ? 'var(--navy)' : 'var(--border)'}`,
            background: showAdvanced ? 'var(--navy)' : activeFilterCount > 0 ? '#EFF6FF' : 'transparent',
            color: showAdvanced ? 'white' : activeFilterCount > 0 ? 'var(--navy)' : 'var(--text)',
            fontSize: '13px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          ⚙ Filtros
          {activeFilterCount > 0 && (
            <span style={{
              background: showAdvanced ? 'rgba(255,255,255,0.3)' : 'var(--navy)',
              color: 'white', borderRadius: '999px', fontSize: '11px',
              fontWeight: 700, padding: '0 6px', lineHeight: '18px',
            }}>{activeFilterCount}</span>
          )}
        </button>

        {/* Limpar filtros */}
        {hasActiveFilter && (
          <button
            onClick={clearAllFilters}
            style={{
              padding: '7px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--negative)', background: 'var(--negative-bg)',
              color: 'var(--negative)', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            ✕ Limpar
          </button>
        )}

        {/* Só devoluções */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text)' }}>
          <input
            type="checkbox"
            checked={showReturnsOnly}
            onChange={() => { toggleReturnsOnly(); setPage(1) }}
            style={{ accentColor: 'var(--negative)', cursor: 'pointer' }}
          />
          Devoluções
        </label>

        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {filtered.length} item(s)
        </span>
      </div>

      {/* ── Painel de filtros avançados ── */}
      {showAdvanced && !isPdfExporting && (
        <div style={{
          padding: '14px 20px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}>
          {/* Faixa de Margem */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Margem %
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                placeholder="Mín"
                value={filterMarginMin}
                onChange={(e) => { setFilterMarginMin(e.target.value); setPage(1) }}
                style={inputStyle}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>–</span>
              <input
                type="number"
                placeholder="Máx"
                value={filterMarginMax}
                onChange={(e) => { setFilterMarginMax(e.target.value); setPage(1) }}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Faixa de Faturamento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Faturamento R$
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                placeholder="Mín"
                value={filterRevenueMin}
                onChange={(e) => { setFilterRevenueMin(e.target.value); setPage(1) }}
                style={inputStyle}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>–</span>
              <input
                type="number"
                placeholder="Máx"
                value={filterRevenueMax}
                onChange={(e) => { setFilterRevenueMax(e.target.value); setPage(1) }}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Multi-seleção de categorias */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Categorias
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {categories.map((c) => {
                const active = filterCategories.has(c.name)
                return (
                  <label
                    key={c.name}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 600,
                      border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
                      background: active ? '#EFF6FF' : 'var(--bg)',
                      color: active ? 'var(--navy)' : 'var(--text)',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleCategory(c.name)}
                      style={{ display: 'none' }}
                    />
                    {c.name}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Filtro de alerta/performance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Performance
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['all', 'low', 'review', 'normal'] as AlertFilter[]).map((v) => {
                const active = filterAlert === v
                return (
                  <button
                    key={v}
                    onClick={() => { setFilterAlert(v); setPage(1) }}
                    style={{
                      padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 600,
                      border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
                      background: active ? 'var(--navy)' : 'var(--bg)',
                      color: active ? 'white' : 'var(--text)',
                    }}
                  >
                    {ALERT_LABELS[v]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Banner de resumo dos filtros ativos ── */}
      {hasActiveFilter && filtered.length > 0 && !isPdfExporting && (
        <div style={{
          padding: '10px 20px',
          background: 'linear-gradient(90deg, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0.04) 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>
            Resumo — {filtered.length} produto(s)
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            Qtd: <strong style={{ color: 'var(--text)' }}>{fmtQty(summary.qty)}</strong>
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            Faturamento: <strong style={{ color: 'var(--text)' }}>{fmtBRL(summary.revenue)}</strong>
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            Custo: <strong style={{ color: 'var(--text)' }}>{fmtBRL(summary.cost)}</strong>
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            Lucro: <strong style={{ color: summary.profit >= 0 ? 'var(--positive)' : 'var(--negative)' }}>{fmtBRL(summary.profit)}</strong>
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            Margem méd.: <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{fmtPct(summary.margin)}</strong>
          </span>
        </div>
      )}

      {/* ── Tabela ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle} onClick={() => handleSort('name')}>Produto <SortIcon k="name" /></th>
              <th style={{ ...thStyle, maxWidth: '120px' }}>Categoria</th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('qty')}>Qtd <SortIcon k="qty" /></th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('revenue')}>Faturamento <SortIcon k="revenue" /></th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('cost')}>Custo <SortIcon k="cost" /></th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('profit')}>Lucro <SortIcon k="profit" /></th>
              <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('margin')}>Margem % <SortIcon k="margin" /></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p, i) => (
              <tr
                key={p.code + i}
                style={{
                  background: p.isReturn ? '#FFF1F2' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
                  transition: isPdfExporting ? 'none' : 'background 0.1s',
                  animation: isPdfExporting ? 'none' : `fadeSlideUp 0.22s ease ${Math.min(i, 14) * 25}ms both`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.07)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = p.isReturn ? '#FFF1F2' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)')}
              >
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{
                      fontWeight: 500,
                      textDecoration: p.isReturn ? 'line-through' : 'none',
                      color: p.isReturn ? 'var(--negative)' : 'var(--text)',
                    }}>
                      {p.name}
                    </span>
                    {p.code && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        #{p.code}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ ...tdStyle, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-dim)', fontSize: '12px' }}>
                  {p.categoryName}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', color: p.isReturn ? 'var(--negative)' : 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                  {fmtQty(p.qty)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {fmtBRL(p.revenue)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {fmtBRL(p.cost)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)', color: p.profit >= 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 600 }}>
                  {fmtBRL(p.profit)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: p.margin >= 150 ? 'var(--positive)' : p.margin >= 120 ? 'var(--warning)' : 'var(--text-dim)',
                  }}>
                    {fmtPct(p.margin)}
                  </span>
                  {!p.isReturn && (
                    <MarginAlertBadge margin={p.margin} thresholds={thresholds} />
                  )}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Nenhum produto encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginação ── */}
      {totalPages > 1 && !isPdfExporting && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={pagerBtn(page === 1)}>
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>…</span>
                )}
                <button onClick={() => setPage(p)} style={pagerBtn(false, p === page)}>
                  {p}
                </button>
              </React.Fragment>
            ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pagerBtn(page === totalPages)}>
            ›
          </button>
        </div>
      )}
    </div>
  )
}

function pagerBtn(disabled: boolean, active = false): React.CSSProperties {
  return {
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
    background: active ? 'var(--navy)' : 'transparent',
    color: active ? 'white' : disabled ? 'var(--border)' : 'var(--text)',
    fontSize: '13px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: active ? 700 : 400,
  }
}
