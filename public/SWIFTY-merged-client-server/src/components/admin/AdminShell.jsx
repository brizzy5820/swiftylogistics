import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Bike, CarFront, PackageCheck, LifeBuoy, LogOut, User } from 'lucide-react'
import { getCurrentUser, signOut } from '../../lib/api-store'
import { useAdminTheme, AdminThemeToggle } from './AdminThemeToggle'

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
  const user = getCurrentUser()
  const initials = user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'SA'
  const rootRef = useRef(null)
  const { theme, setTheme } = useAdminTheme(rootRef)

  useEffect(() => {
    const el = rootRef.current
    if (el) el.classList.add('admin-dark')
  }, [])

  function logout() {
    signOut()
    navigate('/auth')
  }

  return (
    <div ref={rootRef} className="admin-dark min-h-screen bg-[var(--mono-bg)] text-[var(--mono-text)]">
      <div className="flex min-h-screen">
        {/* Fixed sidebar — dark in dark mode, emerald in light mode */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-emerald-700/40 bg-emerald-900 text-white shadow-xl lg:flex">
          <div className="flex h-20 items-center px-6">
            <Link to="/admin" className="flex items-center">
             <img src="/logonobg.png" alt="" className="w-13 h-13" /><span className="font-courier font-semibold">Wifty</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {ADMIN_LINKS.map(({ to, label, Icon }) => {
              const active = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-emerald-50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/15 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-700">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{user?.name || 'Admin'}</p>
                <p className="truncate text-xs text-emerald-100/80">{user?.department || 'Operations'}</p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg p-1.5 text-emerald-100 hover:bg-white/10 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile top bar — dark in dark mode, emerald in light mode */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-emerald-600 px-4 text-white shadow-sm sm:px-6 lg:hidden">
          <Link to="/admin" className="flex items-center">
                <img src="/logonobg.png" alt="" className="w-13 h-13" /><span className="font-courier font-semibold">Wifty</span>
          </Link>
          <div className="flex items-center gap-2">
            <AdminThemeToggle theme={theme} setTheme={setTheme} />
            <Link to="/admin/account" className="flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-700">
                {initials}
              </span>
            </Link>
          </div>
        </header>

        {/* Mobile horizontal nav */}
        <nav className="sticky top-16 z-20 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {ADMIN_LINKS.map(({ to, label, Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                  active ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Main content */}
        <main className="w-full lg:ml-64">
          {/* Desktop top bar */}
          <div className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur lg:flex">
            <p className="text-sm font-semibold text-slate-500">{user?.department || 'Operations Control'}</p>
            <div className="flex items-center gap-2">
              <AdminThemeToggle theme={theme} setTheme={setTheme} />
              <Link to="/admin/account" className="flex items-center gap-2 rounded-xl p-1.5 pr-3 hover:bg-slate-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{initials}</span>
                <span className="text-sm font-semibold">{user?.name || 'Admin'}</span>
              </Link>
            </div>
          </div>
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
