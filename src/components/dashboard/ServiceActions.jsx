import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
// import { ShimmerImage } from '@/components/shimmer-image'
const ACTIONS = [
  { to: '/customer/ride', title: 'Book a ride', subtitle: 'A car is minutes away', image: '/carinterface.png', alt:"book a ride" },
  { to: '/customer/book', title: 'Send a package', subtitle: 'Pickup and delivery',image: '/deliveryinterface.png',  alt:"book a delivery" },
  { to: '/customer/track', title: 'Track something', subtitle: 'Follow an active order', image: 'trackinterface.png' ,alt:"track package/ride" },
]

const ACTIONSII = [
  { to: '/customer/ride', title: 'Ride', image: '/carinterface.png' ,  alt:"book a ride"},
  { to: '/customer/book', title: 'Delivery', image: '/deliveryinterface.png', alt:"book a delivery" },
  { to: '/customer/track', title: 'Track', image: 'trackinterface.png', alt:"track package/ride" },
  
]

export function ServiceActions() {
  return (
    <>
      <div className="grid gap-3 hidden lg:grid sm:grid-cols-3">
        {ACTIONS.map((action) => <Action key={action.to} {...action} />)}
      </div>
      <div className="flex w-full items-start justify-between gap-4 lg:hidden">
        {ACTIONSII.map((action) => <MiniAction key={action.to} {...action} />)}
      </div>
    </>
  )
}

function Action({ to, title, subtitle, primary, image, alt }) {
  return (
    <Link
      to={to}
      className={`group flex w-full flex-col lg:flex-row items-center gap-4 rounded-2xl p-3 transition hover:-translate-y-0.5 ${
        primary
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
          : ' rounded-2xl  bg-gray-100  hover:shadow-lg'
      }`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden">
        <img src={image} alt={alt} className="h-full w-full object-contain" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className={`mt-0.5 block truncate text-xs ${primary ? 'text-emerald-50' : 'text-slate-500'}`}>{subtitle}</span>
      </span>
      <ArrowUpRight className="ml-auto h-4 w-4 hidden lg:block opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  )
}

// No container, no ring — just a bigger image and a label, evenly spaced.
function MiniAction({ to, title, image, alt }) {
  return (
    <Link to={to} className="flex flex-1 flex-col items-center gap-2  transition  active:scale-95">
      <span className="flex h-23 w-23  p-3  rounded-2xl  bg-gray-100 items-center justify-center">
        <img src={image} alt={alt} className="h-full w-full object-contain" />
      </span>
      <span className="text-xs font-bold text-slate-900">{title}</span>
    </Link>
  )
}