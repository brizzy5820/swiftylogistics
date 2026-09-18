import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} {...props} />
}

function SkeletonText({ className, lines = 3, ...props }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  )
}

function SkeletonCard({ className, ...props }) {
  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm border border-slate-200 animate-pulse', className)} {...props}>
      <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-4 bg-slate-200 rounded w-1/3" />
    </div>
  )
}

function SkeletonAvatar({ className, size = 'md', ...props }) {
  const sizeMap = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16', xl: 'h-24 w-24' }
  return <div className={cn('rounded-full bg-slate-200 animate-pulse', sizeMap[size], className)} {...props} />
}

function SkeletonMap({ className, ...props }) {
  return (
    <div className={cn('rounded-3xl bg-slate-200 animate-pulse', className)} {...props}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
    </div>
  )
}

function SkeletonListItem({ className, ...props }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 bg-white border-b border-slate-100 animate-pulse', className)} {...props}>
      <div className="h-12 w-12 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, SkeletonMap, SkeletonListItem }
