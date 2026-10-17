import { useState } from 'react'
import { Check, Copy, Search, X } from 'lucide-react'

export function DataTable({
  columns,
  rows,
  search,
  onSearch,
  emptyState,
  onRowClick,
  rowKey = 'id',
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
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-2.5 sm:gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 sm:px-4 py-2.5 sm:py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {filtered.length}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {filtered.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {onSearch !== false && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                onSearch?.(e.target.value)
              }}
              placeholder="Filter records..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 pl-8 pr-7 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition duration-150 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {q && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 text-slate-400 dark:text-slate-500">
            <Search className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {emptyState || 'No records match your query.'}
          </p>
          {q && (
            <button
              onClick={clearSearch}
              className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="w-full overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
                {columns.map((c) => {
                  const hideClass = c.hideOnMobile ? 'hidden sm:table-cell' : ''
                  return (
                    <th
                      key={c.key}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                        c.align === 'right' ? 'text-right' : 'text-left'
                      } ${hideClass} ${c.className || ''}`}
                    >
                      {c.label}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((r) => (
                <tr
                  key={r[rowKey]}
                  onClick={() => onRowClick?.(r)}
                  className={`group transition-colors duration-150 even:bg-slate-50/50 dark:even:bg-slate-800/25 odd:bg-white dark:odd:bg-slate-900 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {columns.map((c) => {
                    const hideClass = c.hideOnMobile ? 'hidden sm:table-cell' : ''
                    return (
                      <td
                        key={c.key}
                        className={`whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs ${
                          c.align === 'right' ? 'text-right' : 'text-left'
                        } ${hideClass} ${
                          c.cellClassName || 'text-slate-700 dark:text-slate-200 font-normal'
                        }`}
                      >
                        {c.render
                          ? c.render(r)
                          : typeof c.accessor === 'function'
                          ? c.accessor(r)
                          : r[c.accessor]}
                      </td>
                    )
                  })}
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
  width = 'max-w-2xl',
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 backdrop-blur-xs transition-opacity overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col w-full ${width} max-w-[calc(100vw-1rem)] max-h-[88vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 text-slate-900 dark:text-slate-100">{children}</div>
      </div>
    </div>
  )
}

export function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 py-2 sm:py-2.5 last:border-0">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`max-w-[65%] text-right text-xs font-medium text-slate-900 dark:text-slate-100 truncate ${
          mono ? 'font-mono text-slate-700 dark:text-slate-300' : ''
        }`}
      >
        {value || '—'}
      </span>
    </div>
  )
}

export const STATUS_TONE = {
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
  accepted: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30',
  picked_up: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30',
  in_transit: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
  cancelled: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
}

export function StatusPill({ status }) {
  const tone = STATUS_TONE[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}
    >
      {(status || '').replaceAll('_', ' ')}
    </span>
  )
}

// Compact copy-to-clipboard button.
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
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition hover:border-emerald-400 dark:hover:border-emerald-500"
      title={`Copy ${label || 'value'}`}
    >
      <span className="truncate max-w-[90px] sm:max-w-[140px]">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-slate-400 shrink-0" />
      )}
    </button>
  )
}