import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({ title, subtitle, onBack, backTo, trailing, className }) {
  const navigate = useNavigate()

  function handleBack() {
    if (backTo) {
      navigate(backTo)
      return
    }
    if (onBack) {
      onBack()
      return
    }
    navigate(-1)
  }

  return (
    <div className={cn('mb-6 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>

      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}
