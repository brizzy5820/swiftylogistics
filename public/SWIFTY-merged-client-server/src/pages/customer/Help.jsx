import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LifeBuoy, MessageCircleMore, PhoneCall, Send } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { useRequireAuth } from '@/lib/use-require-auth'
import { createSupportTicket } from '@/lib/api-store'

export default function Help() {
  const user = useRequireAuth('customer')
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/customer')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!message.trim()) return
    try {
      await createSupportTicket({ subject: 'Customer support request', message: message.trim(), priority: 'normal' })
      setSubmitted(true)
      setMessage('')
    } catch {
      setSubmitted(false)
    }
  }

  if (!user) return null

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Support</p>
                <h1 className="text-xl font-bold text-slate-900">How can we help?</h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Describe your issue</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  placeholder="Share what is going wrong with your delivery or account..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                <Send className="h-4 w-4" /> Send request
              </button>

              {submitted && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Thanks! Your message has been recorded and our team will follow up shortly.
                </div>
              )}
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Contact support</p>
              <p className="mt-3 text-sm text-slate-600">For urgent delivery issues, speak with our support team directly.</p>
              <a href="tel:08106146952" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-emerald-600 shadow-sm transition hover:bg-slate-100">
                <PhoneCall className="h-4 w-4" /> Call 08106146952
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <MessageCircleMore className="h-4 w-4 text-emerald-600" /> Live support
              </div>
              <p className="mt-3 text-sm text-slate-600">We are available to help with tracking updates, account concerns, or booking issues.</p>
            </div>
          </aside>
        </div>

        <a href="tel:08106146952" className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-emerald-500">
          <PhoneCall className="h-4 w-4" /> 
        </a>
      </main>
    </AppShell>
  )
}
