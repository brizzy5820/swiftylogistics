import { useMemo, useState } from 'react'
import { LifeBuoy, Send, CheckCircle2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useRequireAdmin } from '../../lib/use-require-admin'
import { useStore, replyToTicket, updateTicketStatus } from '../../lib/api-store'
import { AdminShell } from '../../components/admin/AdminShell'
import { DataTable } from '../../components/admin/DataTable'

const STATUS_TONE = {
  open: 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30',
  in_progress: 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
  resolved: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
}
const PRIORITY_TONE = {
  low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  normal: 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30',
  high: 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30',
  urgent: 'bg-rose-100 dark:bg-rose-500/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/50',
}

export default function AdminSupport() {
  useRequireAdmin()
  const tickets = useStore((s) => s.supportTickets ?? [])
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')

  const sorted = useMemo(
    () => [...tickets].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [tickets],
  )

  const columns = [
    {
      key: 'subject',
      label: 'Subject',
      render: (t) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{t.subject}</p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{t.customerName} · {t.id}</p>
        </div>
      ),
    },
    { key: 'priority', label: 'Priority', render: (t) => <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_TONE[t.priority] || PRIORITY_TONE.normal}`}>{t.priority}</span> },
    { key: 'status', label: 'Status', render: (t) => <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[t.status] || STATUS_TONE.open}`}>{t.status?.replace('_', ' ')}</span> },
    { key: 'created', label: 'Opened', hideOnMobile: true, render: (t) => new Date(t.createdAt).toLocaleString() },
    { key: 'messages', label: 'Messages', hideOnMobile: true, render: (t) => t.messages?.length || 0 },
  ]

  function open(t) {
    setSelected(t)
    setDraft('')
    setNotice('')
  }
  function close() {
    setSelected(null)
    setDraft('')
    setNotice('')
  }

  function send() {
    if (!selected || !draft.trim()) return
    replyToTicket(selected.id, draft.trim(), 'admin')
    setDraft('')
    setNotice('Reply sent.')
  }
  function setStatus(s) {
    if (!selected) return
    updateTicketStatus(selected.id, s)
    setNotice(`Status changed to ${s.replace('_', ' ')}.`)
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Support queue</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All customer support tickets. Click a row to open the conversation and reply.</p>
        </div>

        <DataTable
          columns={columns}
          rows={sorted}
          onRowClick={open}
          emptyState={<><LifeBuoy className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />No tickets in the queue.</>}
        />
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-3.5 sm:py-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg sm:text-xl font-black text-slate-950 dark:text-white truncate">{selected.subject}</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{selected.customerName} · {selected.id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${PRIORITY_TONE[selected.priority] || PRIORITY_TONE.normal}`}>{selected.priority}</span>
                <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              {notice && <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">{notice}</div>}
              <div className="space-y-3">
                {selected.messages.map((m, idx) => (
                  <div key={idx} className={`rounded-2xl p-3.5 sm:p-4 ${m.sender === 'admin' ? 'bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-100 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{m.sender}</p>
                      {m.at && <p className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(m.at).toLocaleString()}</p>}
                    </div>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">{m.content}</p>
                  </div>
                ))}
              </div>
              <div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Reply as support..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <div className="mt-3 flex flex-col sm:flex-row flex-wrap gap-2">
                  <button onClick={send} disabled={!draft.trim()} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50 w-full sm:w-auto">
                    <Send className="h-3.5 w-3.5" /> Send reply
                  </button>
                  {selected.status !== 'in_progress' && (
                    <button onClick={() => setStatus('in_progress')} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 w-full sm:w-auto">
                      Mark in progress
                    </button>
                  )}
                  {selected.status !== 'resolved' ? (
                    <button onClick={() => setStatus('resolved')} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 w-full sm:w-auto">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark resolved
                    </button>
                  ) : (
                    <button onClick={() => setStatus('open')} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 w-full sm:w-auto">
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
