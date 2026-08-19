import React, { useState, useMemo, useEffect } from 'react'
import type { Category } from '../types'
import { fmtBRL, fmtPct, fmtQty } from '../utils/format'
import { useDashboardStore } from '../store/useDashboardStore'
import MarginAlertBadge from './MarginAlertBadge'

interface Props {
  categories: Category[]
}

type SortKey = 'name' | 'qty' | 'revenue' | 'cost' | 'profit' | 'margin'
type SortDir = 'asc' | 'desc'

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

export default function ProductsTable({ categories }: Props) {
  const searchQuery = useDashboardStore((s) => s.searchQuery)
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery)
  const showReturnsOnly = useDashboardStore((s) => s.showReturnsOnly)
  const toggleReturnsOnly = useDashboardStore((s) => s.toggleReturnsOnly)
  const activeCategory = useDashboardStore((s) => s.activeCategory)
  const setActiveCategory = useDashboardStore((s) => s.setActiveCategory)
  const thresholds = useDashboardStore((s) => s.thresholds)

  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  // Sync drilldown from chart click
  useEffect(() => {
    if (activeCategory) {
      setFilterCategory(activeCategory)
      setPage(1)
    } else {
      setFilterCategory('all')
    }
  }, [activeCategory])

  const allProducts: FlatProduct[] = useMemo(() =>
    categories.flatMap((c) =>
      c.products.map((p) => ({ ...p, categoryName: c.name }))
    ), [categories])

  const filtered = useMemo(() => {
    let list = allProducts
    if (filterCategory !== 'all') list = list.filter((p) => p.categoryName === filterCategory)
    if (showReturnsOnly) list = list.filter((p) => p.isReturn)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey] as number | string
      const bv = b[sortKey] as number | string
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [allProducts, filterCategory, showReturnsOnly, searchQuery, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
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

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginRight: '4px', whiteSpace: 'nowrap' }}>
          Todos os Produtos
        </h3>

        {/* Active category drilldown chip */}
        {activeCategory && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--navy)',
            background: '#EFF6FF',
            border: '1px solid var(--navy)',
            borderRadius: '20px',
            padding: '3px 10px',
          }}>
            Filtrado: {activeCategory}
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--navy)', fontWeight: 800, fontSize: '13px', lineHeight: 1, padding: 0,
              }}
            >
              ×
            </button>
          </span>
        )}

        <div style={{ flex: 1, minWidth: '180px' }}>
          <input
            type="search"
            placeholder="Buscar produto ou código…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            style={{
              width: '100%',
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              fontSize: '13px',
              color: 'var(--text)',
              background: 'var(--bg)',
              outline: 'none',
            }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => {
            const val = e.target.value
            setFilterCategory(val)
            setActiveCategory(val === 'all' ? null : val)
            setPage(1)
          }}
          style={{
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            fontSize: '13px',
            color: 'var(--text)',
            background: 'var(--bg)',
            cursor: 'pointer',
          }}
        >
          <option value="all">Todas categorias</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text)' }}>
          <input
            type="checkbox"
            checked={showReturnsOnly}
            onChange={() => { toggleReturnsOnly(); setPage(1) }}
            style={{ accentColor: 'var(--negative)', cursor: 'pointer' }}
          />
          Só devoluções
        </label>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {filtered.length} item(s)
        </span>
      </div>

      {/* Table */}
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
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F9FF')}
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
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
