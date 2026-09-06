import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { Bell, Calendar, CarFront, History, Briefcase,House, LayoutDashboard, LogOut, PackagePlus, Sparkles, User, Wallet, Plus } from 'lucide-react'
import { getCurrentUser, signOut, useStore } from '../lib/mock-store'

const CUSTOMER_LINKS = [
  { to: '/customer', label: 'Home', Icon: House },
  { to: '/customer/actions', label: 'Actions', Icon: LayoutDashboard },
  { to: '/customer/history', label: 'Activity', Icon: History },
  { to: '/customer/account', label: 'Account', Icon: User },
]
const CUSTOMER_DESKTOP_LINKS = [
  { to: '/customer', label: 'Home', Icon: House },
  { to: '/customer/ride', label: 'Ride', Icon: CarFront },
  { to: '/customer/book', label: 'Delivery', Icon: PackagePlus },
  { to: '/customer/history', label: 'Activity', Icon: History },
]
const RIDER_LINKS = [
  { to: '/rider', label: 'Home', Icon: LayoutDashboard },
  { to: '/rider/job', label: 'Jobs', Icon: Briefcase },
  { to: '/rider/earnings', label: 'Earnings', Icon: Wallet },
  { to: '/rider/account', label: 'Account', Icon: User },
]

export function AppShell({ children, hideMobileHeader = false }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const session = useStore((s) => s.session)
  const user = getCurrentUser()
  const role = session?.role || 'customer'
  const links = role === 'rider' ? RIDER_LINKS : CUSTOMER_LINKS
  const desktopLinks = role === 'rider' ? RIDER_LINKS : CUSTOMER_DESKTOP_LINKS
  const home = role === 'rider' ? '/rider' : '/customer'
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SW'
  const activeOrders = useStore((s) => session ? s.deliveries.filter((d) => role === 'rider' ? (d.status === 'pending' || d.riderId === session.userId) : d.customerId === session.userId) : [])
  const scheduled = useStore((s) => session ? (s.scheduled ?? []).filter((sc) => sc.customerId === session.userId) : [])
  const unread = useMemo(() => activeOrders.filter((d) => ['pending', 'in_transit'].includes(d.status)).length, [activeOrders])
  const scheduledCount = scheduled.length

  function logout() { signOut(); navigate('/') }

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className={`sticky top-0 z-40 ${hideMobileHeader ? 'hidden lg:block' : ''} lg:shadow-sm bg-white/90 backdrop-blur-xl`}>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to={home} className="mr-2 text-xl font-bold font-black tracking-tight">Swifty<span className="text-emerald-600">.</span></Link>
        <nav className="hidden items-center gap-1 lg:flex">{desktopLinks.map(({ to, label, Icon }) => <Link key={to} to={to} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${pathname === to ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to={role === 'rider' ? '/rider/notifications' : '/customer/notifications'} className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" />}</Link>
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />
          <Link to={role === 'rider' ? '/rider/account' : '/customer/account'} className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-slate-100"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{initials}</span><span className="hidden max-w-28 truncate text-sm font-semibold sm:block">{user?.name || 'Swifty user'}</span></Link>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-[1440px] px-0 pb-20 lg:pb-0">{children}</div>
    <nav className="fixed flex gap-1 bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur-xl lg:hidden">
      {links.map(({ to, label, Icon }) => (
        <Link key={to} to={to} className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold ${pathname === to ? 'text-emerald-700' : 'text-slate-500'}`}>
          <Icon className="h-5 w-5" />
          <span className="truncate">{label}</span>
          {label === 'Activity' && scheduledCount > 0 && (
            <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
              {scheduledCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  </div>
}
