import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Bike,
  CarFront,
  PackageCheck,
  LifeBuoy,
  LogOut,
  User,
  Menu,
  Shield,
} from 'lucide-react'
import { useCurrentUser, signOut } from '../../lib/api-store'
import { useAdminTheme } from './AdminThemeToggle'
import { Sheet, SheetTrigger, SheetContent } from '../ui/sheet'

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', Icon: LayoutDashboard },
  { to: '/admin/customers', label: 'Customers', Icon: Users },
  { to: '/admin/riders', label: 'Riders', Icon: Bike },
  { to: '/admin/rides', label: 'Rides', Icon: CarFront },
  { to: '/admin/deliveries', label: 'Deliveries', Icon: PackageCheck },
  { to: '/admin/support', label: 'Support', Icon: LifeBuoy },
  { to: '/admin/account', label: 'Account', Icon: User },
]

export function AdminShell({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useCurrentUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const rootRef = useRef(null)

  // Sync theme
  useAdminTheme(rootRef)

  // Automatically close mobile menu on route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SA'

  function logout() {
    signOut()
    navigate('/auth?mode=admin')
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto bg-slate-900 dark:bg-slate-950 text-slate-100">
      <div>
        {/* Logo / Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 transition hover:opacity-90"
          >
            <img src="/logonobg.png" alt="Swifty Logo" className="h-9 w-9 object-contain" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-display text-base font-black tracking-tight text-white">
                <span>SWIFTY</span>
                <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  OPS
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">Operations Control</span>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1 p-3 sm:p-4">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
            Navigation
          </p>
          {ADMIN_LINKS.map(({ to, label, Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User profile footer */}
      <div className="border-t border-slate-800/80 p-3 sm:p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-xs">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs sm:text-sm font-bold text-white">{user?.name || 'Administrator'}</p>
            <p className="truncate text-[11px] text-slate-400 flex items-center gap-1">
              <Shield className="h-2.5 w-2.5 text-emerald-400 inline" />
              <span>{user?.department || 'Operations'}</span>
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div
      ref={rootRef}
      className="min-h-screen w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row overflow-x-hidden"
    >
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 dark:border-slate-800/80 shadow-md z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-40 flex md:hidden items-center justify-between px-3 sm:px-4 h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="p-1.5 -ml-1 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[82vw] max-w-[290px] p-0 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 text-slate-100"
            >
              {sidebarContent}
            </SheetContent>
          </Sheet>

          <Link to="/admin" className="flex items-center gap-2 truncate">
            <img src="/logonobg.png" alt="" className="h-7 w-7 object-contain" />
            <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
              Admin Console
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/account"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-xs"
            title="Account"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 md:pl-64 lg:pl-72 flex flex-col min-h-screen">
        {/* Desktop Sticky Header */}
        <div className="sticky top-0 z-20 hidden md:flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 px-6 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operations Control
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Live Session
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/account"
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-1.5 pr-3 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {initials}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {user?.name || 'Administrator'}
              </span>
            </Link>
          </div>
        </div>

        {/* Page Inner Container (Constrained & No Horizontal Overflow) */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminShell
