import { BrowserRouter, Routes, Route, Link, useLocation, useNavigationType } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLayoutEffect, useEffect, lazy, Suspense } from 'react'
import { BrandLoader } from './components/brand-loader'
import { Toaster } from './components/ui/sonner'
import { GlobalChatNotifier } from './components/global-chat-notifier'

// Each page is its own chunk: the first paint only downloads what it needs.
const loadIndex = () => import('./pages/Index')
const loadOnboarding = () => import('./pages/Onboarding')
const loadAuth = () => import('./pages/Auth')
const loadCustomerDashboard = () => import('./pages/customer/Dashboard')
const loadBook = () => import('./pages/customer/Book')
const loadTrack = () => import('./pages/customer/Track')
const loadNotificationsPage = () => import('./pages/customer/Notifications')
const loadHistory = () => import('./pages/customer/History')
const loadAccount = () => import('./pages/customer/Account')
const loadHelp = () => import('./pages/customer/Help')
const loadActions = () => import('./pages/customer/Actions')
const loadSchedule = () => import('./pages/customer/Schedule')
const loadRiderDashboard = () => import('./pages/rider/Dashboard')
const loadRiderJob = () => import('./pages/rider/Job')
const loadRiderAccount = () => import('./pages/rider/Account')
const loadRiderEarnings = () => import('./pages/rider/Earnings')
const loadRiderNotifications = () => import('./pages/rider/Notifications')
const loadRide = () => import('./pages/customer/Ride')
const loadAdminDashboard = () => import('./pages/admin/Dashboard')
const loadAdminCustomers = () => import('./pages/admin/Customers')
const loadAdminRiders = () => import('./pages/admin/Riders')
const loadAdminRides = () => import('./pages/admin/Rides')
const loadAdminDeliveries = () => import('./pages/admin/Deliveries')
const loadAdminSupport = () => import('./pages/admin/Support')
const loadAdminAccountPage = () => import('./pages/admin/Account')
const Index = lazy(loadIndex)
const Onboarding = lazy(loadOnboarding)
const Auth = lazy(loadAuth)
const CustomerDashboard = lazy(loadCustomerDashboard)
const Book = lazy(loadBook)
const Track = lazy(loadTrack)
const NotificationsPage = lazy(loadNotificationsPage)
const History = lazy(loadHistory)
const Account = lazy(loadAccount)
const Help = lazy(loadHelp)
const Actions = lazy(loadActions)
const Schedule = lazy(loadSchedule)
const RiderDashboard = lazy(loadRiderDashboard)
const RiderJob = lazy(loadRiderJob)
const RiderAccount = lazy(loadRiderAccount)
const RiderEarnings = lazy(loadRiderEarnings)
const RiderNotifications = lazy(loadRiderNotifications)
const Ride = lazy(loadRide)
const AdminDashboard = lazy(loadAdminDashboard)
const AdminCustomers = lazy(loadAdminCustomers)
const AdminRiders = lazy(loadAdminRiders)
const AdminRides = lazy(loadAdminRides)
const AdminDeliveries = lazy(loadAdminDeliveries)
const AdminSupport = lazy(loadAdminSupport)
const AdminAccountPage = lazy(loadAdminAccountPage)

// Warm the most-visited chunks while the browser is idle so navigation feels instant.
const PRELOAD = [loadAuth, loadCustomerDashboard, loadBook, loadTrack, loadRiderDashboard]
function usePreloadRoutes() {
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200))
    const id = idle(() => {
      PRELOAD.forEach((fn) => fn().catch(() => {}))
      // Signed-in users almost always land on a map: fetch the Maps SDK early.
      if (localStorage.getItem('swifty_access_token')) {
        import('./components/delivery-map').then((m) => m.preloadGoogleMaps()).catch(() => {})
      }
    })
    return () => (window.cancelIdleCallback || clearTimeout)(id)
  }, [])
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // serve cached data instantly, refresh in background
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => (error?.status >= 400 && error?.status < 500 ? false : count < 2),
    },
  },
})

function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType === 'POP') return

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [pathname, navigationType])

  return null
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  usePreloadRoutes()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <GlobalChatNotifier />
        <Suspense fallback={<BrandLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/book" element={<Book />} />
          <Route path="/customer/ride" element={<Ride />} />
          <Route path="/customer/notifications" element={<NotificationsPage />} />
          <Route path="/customer/history" element={<History />} />
          <Route path="/customer/track" element={<Track />} />
          <Route path="/customer/track/:id" element={<Track />} />
          <Route path="/customer/account" element={<Account />} />
          <Route path="/customer/help" element={<Help />} />
          <Route path="/customer/actions" element={<Actions />} />
          <Route path="/customer/schedule" element={<Schedule />} />
          <Route path="/rider" element={<RiderDashboard />} />
          <Route path="/rider/job" element={<RiderJob />} />
          <Route path="/rider/job/:id" element={<RiderJob />} />
          <Route path="/rider/notifications" element={<RiderNotifications />} />
          <Route path="/rider/earnings" element={<RiderEarnings />} />
          <Route path="/rider/account" element={<RiderAccount />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/riders" element={<AdminRiders />} />
          <Route path="/admin/rides" element={<AdminRides />} />
          <Route path="/admin/deliveries" element={<AdminDeliveries />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/account" element={<AdminAccountPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <Toaster richColors position="top-center" closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
