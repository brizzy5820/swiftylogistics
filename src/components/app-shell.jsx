import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import {
  Bell,
  CarFront,
  History,
  Briefcase,
  House,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  User,
  Wallet,
  Moon,
  Sun,
} from 'lucide-react'
import { useCurrentUser, signOut, useStore, getGuestUser, getGuestActivities } from '../lib/api-store'
import { useTheme } from './theme-provider'
import { ShimmerImage } from './shimmer-image'

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
  const { user: sessionUser } = useCurrentUser()
  const session = useStore((s) => s.session)
  // Guests have no session, but they still browse the customer pages, so the
  // shell falls back to the device's guest identity.
  const guest = sessionUser ? null : getGuestUser()
  const isGuest = Boolean(guest)
  const user = sessionUser || guest
  const role = session?.role || 'customer'
  const links = role === 'rider' ? RIDER_LINKS : CUSTOMER_LINKS
  const desktopLinks = role === 'rider' ? RIDER_LINKS : CUSTOMER_DESKTOP_LINKS
  const home = role === 'rider' ? '/rider' : '/customer'
  const initials = isGuest
    ? 'G'
    : user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SW'
  const sessionOrders = useStore((s) => (session ? s.deliveries.filter((d) => role === 'rider' ? (d.status === 'pending' || d.riderId === session.userId) : d.customerId === session.userId) : []))
  // Guests are not in the socket/store by user id, so their active orders come
  // from the guest session instead.
  const activeOrders = isGuest ? getGuestActivities().filter((d) => d.status !== 'delivered' && d.status !== 'cancelled') : sessionOrders
  const scheduled = useStore((s) => (session ? (s.scheduled ?? []).filter((sc) => sc.customerId === session.userId) : []))
  const unread = useMemo(() => activeOrders.filter((d) => ['pending', 'in_transit'].includes(d.status)).length, [activeOrders])
  const scheduledCount = scheduled.length
  const { theme, toggleTheme } = useTheme()

  function logout() { signOut(); navigate('/') }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50`}>
      <header
        className={`sticky top-0 z-40 ${hideMobileHeader ? "hidden lg:block" : ""} lg:shadow-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl dark:border-b dark:border-slate-800`}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to={home} className="mr-2 text-xl font-bold font-black tracking-tight">
            Swifty<span className="text-emerald-600">.</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {desktopLinks.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${pathname === to ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link
              to={role === "rider" ? "/rider/notifications" : "/customer/notifications"}
              className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </Link>
            <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
            {/* Guests land on /auth from here instead of an account page — the
                Account screen is reserved for real accounts. */}
            <Link
              to={isGuest ? "/customer/account" : role === "rider" ? "/rider/account" : "/customer/account"}
              className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white mb-1">
                {isGuest ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <ShimmerImage
                    src={user.avatarUrl}
                    className="h-full w-full rounded-full"
                    imgClassName="h-full w-full object-cover"
                    fallback={<User className="h-3.5 w-3.5" />}
                  />
                )}
              </span>
              <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">
                {isGuest ? 'Guest' : user?.name || 'Swifty user'}
              </span>
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-0 pb-20 lg:pb-0 dark:dark">{children}</div>
      <nav className="fixed flex gap-1 bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-xl lg:hidden">
        {links.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold ${pathname === to ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
