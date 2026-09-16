import { useState } from 'react'
import { Check, Copy, Search, X } from 'lucide-react'

export function DataTable({ 
  columns, 
  rows, 
  search, 
  onSearch, 
  emptyState, 
  onRowClick, 
  rowKey = 'id' 
}) {
  const [q, setQ] = useState(search || '')

  const filtered = q.trim()
    ? rows.filter((r) =>
        columns.some((c) => {
          const v = typeof c.accessor === 'function' ? c.accessor(r) : r[c.accessor]
          return String(v ?? '').toLowerCase().includes(q.toLowerCase())
        }),
      )
    : rows

  const clearSearch = () => {
    setQ('')
    onSearch?.('')
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {filtered.length}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {filtered.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {onSearch !== false && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                onSearch?.(e.target.value)
              }}
              placeholder="Filter by column value..."
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all duration-150 focus:border-blue-500 focus:ring-1 focus:ring-green-500"
            />
            {q && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-slate-100 p-3 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">
            {emptyState || 'No records match your query.'}
          </p>
          {q && (
            <button
              onClick={clearSearch}
              className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${
                      c.align === 'right' ? 'text-right' : 'text-left'
                    } ${c.className || ''}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className=" divide-slate-100">
              {filtered.map((r) => (
                <tr
                  key={r[rowKey]}
                  onClick={() => onRowClick?.(r)}
                  className={`group transition-colors duration-150 ${
                    onRowClick 
                      ? 'cursor-pointer hover:bg-blue-50/40' 
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`whitespace-nowrap px-4 py-3 text-xs ${
                        c.align === 'right' ? 'text-right' : 'text-left'
                      } ${c.cellClassName || 'text-slate-700 font-normal'}`}
                    >
                      {c.render
                        ? c.render(r)
                        : typeof c.accessor === 'function'
                        ? c.accessor(r)
                        : r[c.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function AdminModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-2xl'
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className={`admin-modal-light relative flex flex-col w-full ${width} max-h-[85vh] rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-slate-300 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={`max-w-[65%] text-right text-xs font-medium text-slate-900 truncate ${mono ? 'font-mono text-slate-700' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

export const STATUS_TONE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-sky-50 text-sky-700 border-sky-200',
  picked_up: 'bg-purple-50 text-purple-700 border-purple-200',
  in_transit: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

export function StatusPill({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_TONE[status] || 'bg-slate-100 text-slate-600'}`}>
      {(status || '').replaceAll('_', ' ')}
    </span>
  )
}

// Compact copy-to-clipboard button. Shows the value and a copy icon;
// flips to a check mark briefly on success.
export function CopyChip({ value, label }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  async function copy(e) {
    e?.stopPropagation?.()
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(value))
      } else {
        const ta = document.createElement('textarea')
        ta.value = String(value)
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
      title={`Copy ${label || 'value'}`}
    >
      <span className="truncate max-w-[140px]">{value}</span>
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
    </button>
  )
}