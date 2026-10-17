import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ChevronLeft,
  Car,
  Palette,
  Hash,
  IdCard,
  Fingerprint,
  Landmark,
  CreditCard,
  LoaderCircle,
  Shield,
  X,
  Check,
} from 'lucide-react'
import {
  signIn,
  adminSignIn,
  signInWithSocial,
  ensureSession,
  signUp,
  updateCurrentUser,
  switchActiveMode,
  VEHICLE_TYPES,
} from '@/lib/api-store'
import { getErrorMessage, forgotPassword, resetPassword } from '@/services/api'
import SocialAuthButtons from '@/components/SocialAuthButtons'
import { GuestBar } from '@/components/guest-bar'
import { BrandEntrance } from '@/components/brand-loader'
import {
  FirstTimeModeDialog,
} from '@/components/shared/RoleAndOnboardingModal'

// A single labeled input row. The border goes emerald on focus via
// focus-within, so it works whether the child is an <input> or <select>.
function FormField({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-colors duration-150 focus-within:border-emerald-400 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.10)]">
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        {children}
      </div>
    </label>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, search } = location
  const searchParams = new URLSearchParams(search)
  const isAdminMode = searchParams.get('mode') === 'admin' || state?.from?.startsWith('/admin')

  // Mode: 'customer' or 'rider'
  const initialMode =
    searchParams.get('mode') === 'rider' ||
    searchParams.get('role') === 'rider' ||
    state?.role === 'rider'
      ? 'rider'
      : 'customer'
  const [mode, setMode] = useState(initialMode)
  const role = mode // for backwards compatibility with existing logic

  // Check if viewing reset-password from emailed / generated reset link
  const isResetPasswordView = searchParams.get('view') === 'reset-password'
  const resetToken = searchParams.get('token') || ''

  // View: 'login', 'signup', or 'reset-password'
  const initialView =
    isAdminMode
      ? 'login'
      : isResetPasswordView
      ? 'reset-password'
      : searchParams.get('view') === 'signup' ||
        state?.guestIntent === 'signup' ||
        state?.view === 'signup' ||
        (state?.role && !searchParams.get('view') && !state?.guestIntent)
      ? 'signup'
      : 'login'
  const [view, setView] = useState(initialView)

  const [signupStep, setSignupStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Forgot password modal states
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotDevLink, setForgotDevLink] = useState('')
  const [isSendingForgot, setIsSendingForgot] = useState(false)

  // Dedicated Reset password states (for ?view=reset-password&token=...)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [resetPasswordError, setResetPasswordError] = useState('')
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)

  const [name, setName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)

  // Rider details for signup step 2
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [nin, setNin] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  const [socialLoading, setSocialLoading] = useState(false)
  // After a successful sign-in/up we play the brand entrance, then navigate.
  const [entrance, setEntrance] = useState(null) // { to, state, name }

  // First-time onboarding modals
  const [firstTimeModalOpen, setFirstTimeModalOpen] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)
  const [registeredRiderUser, setRegisteredRiderUser] = useState(null)

  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])

  const modeRef = useRef(mode)
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const enter = useCallback(
    (user, to) => {
      const fallback =
        user?.role === 'admin' || user?.activeMode === 'admin'
          ? '/admin'
          : user?.role === 'rider' || user?.activeMode === 'rider'
          ? '/rider'
          : '/customer'
      setEntrance({
        to: to || state?.from || fallback,
        state: state?.intent ?? null,
        name: user?.name,
      })
    },
    [state]
  )

  useEffect(() => {
    let active = true
    ensureSession().then((user) => {
      if (!active || !user) return
      // If user is already an admin, navigate to admin route
      if (user.role === 'admin' || user.activeMode === 'admin') {
        const dest = state?.from || '/admin'
        navigate(dest, { replace: true })
        return
      }
      // If on admin mode, don't auto-redirect to customer/rider so the admin can log in
      if (!isAdminMode) {
        const dest = user.activeMode === 'rider' || user.role === 'rider' ? '/rider' : '/customer'
        navigate(dest, { replace: true })
      }
    })
    return () => {
      active = false
    }
  }, [navigate, isAdminMode, state])

  // Load Google Identity Services script and initialise once it's ready
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleGoogleCredential = useCallback(
    async (response) => {
      setSocialLoading(true)
      setError('')
      try {
        if (!response?.credential) {
          throw new Error('Google did not return a sign-in token. Please try again.')
        }
        const intent = viewRef.current === 'signup' ? 'signup' : 'login'
        const currentMode = modeRef.current
        const user = await signInWithSocial('google', response.credential, currentMode, intent)

        if (user.isNew) {
          setPendingUser(user)
          setFirstTimeModalOpen(true)
          return
        }

        if (intent === 'signup' && (user.role === 'rider' || currentMode === 'rider')) {
          setRegisteredRiderUser(user)
          setSignupStep(2)
          return
        }

        enter(user)
      } catch (err) {
        setError(getErrorMessage(err, 'Google sign-in failed. Please try again.'))
      } finally {
        setSocialLoading(false)
      }
    },
    [enter]
  )

  const googleCbRef = useRef(handleGoogleCredential)
  useEffect(() => {
    googleCbRef.current = handleGoogleCredential
  }, [handleGoogleCredential])

  useEffect(() => {
    if (!googleClientId) return
    const scriptId = 'google-gsi-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
    const init = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (r) => googleCbRef.current(r),
        itp_support: true,
        auto_select: false,
        cancel_on_tap_outside: true,
      })
    }
    if (window.google?.accounts?.id) {
      init()
    } else {
      const existing = document.getElementById(scriptId)
      existing.addEventListener('load', init)
      return () => existing.removeEventListener('load', init)
    }
  }, [googleClientId])

  function triggerGoogleSignIn() {
    if (!window.google?.accounts?.id) {
      setError('Google Sign-In is not available. Please check your internet connection.')
      return
    }
    setSocialLoading(true)
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        setSocialLoading(false)
        const reason = notification.getNotDisplayedReason?.() || notification.getSkippedReason?.()
        if (reason && !['user_cancel', 'tap_outside'].includes(reason)) {
          setError('Google sign-in could not open. Allow third-party sign-in / pop-ups for this site and try again.')
        }
      } else if (notification.isDismissedMoment?.() && notification.getDismissedReason?.() !== 'credential_returned') {
        setSocialLoading(false)
      }
    })
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (isSigningIn) return
    setError('')
    setIsSigningIn(true)
    try {
      const user = isAdminMode
        ? await adminSignIn(loginEmail, loginPassword)
        : await signIn(loginEmail, loginPassword)
      if (!user) throw new Error('Invalid email or password')
      if (isAdminMode && user.role !== 'admin' && user.activeMode !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.')
      }

      // If logging in as driver mode but user's activeMode is customer, seamlessly switch or route
      if (!isAdminMode && mode === 'rider' && user.activeMode !== 'rider') {
        try {
          await switchActiveMode('rider')
        } catch {
          // ignore error if unable to switch activeMode automatically
        }
      }

      enter(user, isAdminMode ? state?.from || '/admin' : undefined)
    } catch (error) {
      setError(getErrorMessage(error, 'Invalid email or password. Please try again.'))
    } finally {
      setIsSigningIn(false)
    }
  }

  async function handleGeneralSubmit(e) {
    e.preventDefault()
    if (isSigningUp) return
    setError('')
    if (!name.trim() || !signupEmail.trim() || !signupPassword.trim() || (mode === 'rider' && !phone.trim())) {
      setError('Please fill in all required fields.')
      return
    }

    setIsSigningUp(true)
    try {
      const user = await signUp(name.trim(), signupEmail.trim(), mode, {
        phone: phone.trim(),
        password: signupPassword.trim(),
      })
      if (mode === 'rider') {
        setRegisteredRiderUser(user)
        setSignupStep(2)
        return
      }
      setPendingUser(user)
      setFirstTimeModalOpen(true)
    } catch (error) {
      setError(getErrorMessage(error, 'Unable to create your account.'))
    } finally {
      setIsSigningUp(false)
    }
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault()
    if (isSavingDetails) return
    setError('')
    setIsSavingDetails(true)
    const details = {}
    if (vehicleType) details.vehicleType = vehicleType
    if (vehicleColor.trim()) details.vehicleColor = vehicleColor.trim()
    if (plateNumber.trim()) details.plateNumber = plateNumber.trim()
    if (licenseNumber.trim()) details.licenseNumber = licenseNumber.trim()
    if (nin.trim()) details.nin = nin.trim()
    if (bankName.trim()) details.bankName = bankName.trim()
    if (accountNumber.trim()) details.accountNumber = accountNumber.trim()
    if (Object.keys(details).length > 0) {
      try {
        await updateCurrentUser(details)
      } catch (error) {
        setError(getErrorMessage(error, 'Unable to save rider details.'))
        setIsSavingDetails(false)
        return
      }
    }
    setIsSavingDetails(false)
    setPendingUser(registeredRiderUser || { role: 'rider', activeMode: 'rider', name })
    setFirstTimeModalOpen(true)
  }

  function handleSkipPayment() {
    setPendingUser(registeredRiderUser || { role: 'rider', activeMode: 'rider', name })
    setFirstTimeModalOpen(true)
  }

  const handleModalSelectMode = async (selectedMode) => {
    try {
      await switchActiveMode(selectedMode)
    } catch (err) {
      console.warn('Mode switch during onboarding:', err)
    }
    setFirstTimeModalOpen(false)
    setPendingUser((prev) => ({
      ...(prev || {}),
      role: selectedMode,
      activeMode: selectedMode,
      name: prev?.name || name,
    }))
    const userToEnter = {
      ...(pendingUser || {}),
      role: selectedMode,
      activeMode: selectedMode,
      name: pendingUser?.name || name,
    }
    const dest =
      userToEnter.role === 'admin' || userToEnter.activeMode === 'admin'
        ? '/admin'
        : userToEnter.role === 'rider' || userToEnter.activeMode === 'rider'
        ? '/rider'
        : '/customer'
    enter(userToEnter, dest)
  }

  async function handleSendForgotLink(e) {
    if (e) e.preventDefault()
    if (isSendingForgot) return
    setForgotError('')
    setForgotMessage('')
    setForgotDevLink('')
    const emailToUse = forgotEmail.trim()
    if (!emailToUse) {
      setForgotError('Please enter your email address.')
      return
    }
    setIsSendingForgot(true)
    try {
      const res = await forgotPassword(emailToUse)
      setForgotMessage(res?.message || 'If an account with that email exists, a password reset link has been sent.')
      if (res?.resetUrl) {
        setForgotDevLink(res.resetUrl)
      }
    } catch (err) {
      setForgotError(getErrorMessage(err, 'Failed to request password reset. Please try again.'))
    } finally {
      setIsSendingForgot(false)
    }
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault()
    if (isResettingPassword) return
    setResetPasswordError('')
    setResetPasswordSuccess('')

    if (!resetToken) {
      setResetPasswordError('Invalid or missing password reset token. Please request a new link.')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setResetPasswordError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setResetPasswordError('Passwords do not match.')
      return
    }

    setIsResettingPassword(true)
    try {
      const res = await resetPassword({ token: resetToken, newPassword })
      setResetPasswordSuccess(res?.message || 'Password has been reset successfully! You can now log in.')
      setTimeout(() => {
        navigate('/auth', { replace: true })
        setView('login')
      }, 2500)
    } catch (err) {
      setResetPasswordError(getErrorMessage(err, 'Failed to reset password. The link may have expired.'))
    } finally {
      setIsResettingPassword(false)
    }
  }

  const finishEntrance = useCallback(() => {
    if (entrance) navigate(entrance.to, { replace: true, state: entrance.state })
  }, [entrance, navigate])

  return (
    <div className="min-h-screen w-full bg-white">
      {entrance && <BrandEntrance name={entrance.name} onDone={finishEntrance} />}

      {/* Image panel — fixed to the right half of the viewport on lg+ */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:block lg:w-1/2">
        <img src="/formimg.png" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="font-display text-3xl font-black leading-tight tracking-tight text-white">
            Move your world
            <br />
            with Swifty.
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">
            One account for rides, packages, deliveries, and driving in between.
          </p>
        </div>
      </div>

      {/* Form column — offset past the fixed image on lg+, scrolls independently */}
      <div className="flex min-h-screen w-full flex-col items-center px-6 py-12 lg:mr-[50%] lg:w-1/2 lg:justify-center lg:px-1 lg:py-16">
        <div className="w-full lg:px-6">
          <Link
            to="/"
            className="mb-2 flex items-center gap-1 self-start text-sm text-slate-400 transition-colors hover:text-navy"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>

          <div className="mb-5 flex items-center justify-center lg:justify-start">
            <img src="/logonobg.png" alt="Swifty logo" className="h-20 w-auto object-contain" />
          </div>

          {view === 'reset-password' ? (
            <div className="text-center lg:text-left">
              <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">
                Reset your password
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter your new password below to regain access to your account.
              </p>
            </div>
          ) : (
            <div className="text-center lg:text-left">
              <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">
                {isAdminMode
                  ? 'Swifty Admin Console'
                  : view === 'signup'
                  ? `Create ${mode === 'rider' ? 'Driver' : 'Customer'} Account`
                  : `Sign in as ${mode === 'rider' ? 'Driver' : 'Customer'}`}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {isAdminMode
                  ? 'Sign in with administrator credentials to manage the platform'
                  : view === 'signup'
                  ? mode === 'rider'
                    ? 'Sign up to accept delivery requests and earn on every trip'
                    : 'Sign up to book rides and schedule package deliveries'
                  : mode === 'rider'
                  ? 'Access your driver console, live jobs, and earnings'
                  : 'Sign in to order rides, deliveries, and track orders'}
              </p>
            </div>
          )}

          {view !== 'reset-password' && (
            isAdminMode ? (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold lg:justify-start bg-slate-900 text-white dark:bg-slate-800 border border-slate-700/50 shadow-sm">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Operations Control Authentication</span>
              </div>
            ) : (
              <div
                className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold lg:justify-start ${
                  mode === 'rider' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {mode === 'rider' ? <Car className="h-4 w-4" /> : <User className="h-4 w-4" />}
                {mode === 'rider' ? 'Driver / Courier Workspace' : 'Customer Workspace'}
              </div>
            )
          )}

          <div className="mt-6 w-full rounded-2xl bg-white dark:bg-slate-900 py-6 lg:px-3 md:px-2 lg:shadow-none lg:border-none ">
            {/* Customer vs Driver mode switcher — hidden in admin mode, reset-password, or on rider step 2 */}
            {!isAdminMode && view !== 'reset-password' && !(mode === 'rider' && view === 'signup' && signupStep === 2) && (
              <div className="mb-4">
                <div className="flex rounded-full bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('customer')
                      setError('')
                      setSignupStep(1)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all ${
                      mode === 'customer'
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('rider')
                      setError('')
                      setSignupStep(1)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all ${
                      mode === 'rider'
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Car className="h-4 w-4" />
                    <span>Driver</span>
                  </button>
                </div>

                {view === 'signup' && (
                  <p className="mt-2.5 text-center text-xs text-slate-400 dark:text-slate-500">
                    Signing up as {mode === 'rider' ? 'a driver' : 'a customer'}
                    {mode === 'rider' && ' · Step 1 of 2'}
                  </p>
                )}
              </div>
            )}

            {mode === 'rider' && view === 'signup' && signupStep === 2 && (
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-brand">Step 2 of 2</p>
                <h2 className="mt-1 text-sm font-bold text-navy dark:text-slate-100">
                  Payment &amp; verification details
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add these now, or skip and complete them later from your account settings.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-center text-xs text-red-600 dark:text-red-400">
                <p>{error}</p>
                {view === 'login' && (
                  <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-900/50">
                    <span className="text-slate-600 dark:text-slate-400">Don&apos;t have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setView('signup')
                        setError('')
                        setSignupStep(1)
                      }}
                      className="font-bold underline text-brand hover:text-brand-hover ml-1"
                    >
                      Sign Up here →
                    </button>
                  </div>
                )}
              </div>
            )}

            {view === 'reset-password' ? (
              <div className="mt-2">
                {resetPasswordError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
                    {resetPasswordError}
                  </div>
                )}

                {resetPasswordSuccess ? (
                  <div className="space-y-4 py-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Password updated successfully
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {resetPasswordSuccess}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                        Redirecting you to sign in...
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/auth', { replace: true })
                        setView('login')
                      }}
                      className="mt-2 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover shadow-md shadow-brand/20"
                    >
                      Sign In Now
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
                    {!resetToken && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400">
                        No reset token found in the URL. Please verify the reset link or request a new one.
                      </div>
                    )}

                    <FormField icon={Lock} label="New Password">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={!resetToken || isResettingPassword}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </FormField>

                    <FormField icon={Lock} label="Confirm New Password">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={!resetToken || isResettingPassword}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </FormField>

                    <button
                      type="submit"
                      disabled={!resetToken || isResettingPassword}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70 shadow-md shadow-brand/20"
                    >
                      {isResettingPassword && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      {isResettingPassword ? 'Updating Password...' : 'Save New Password'}
                    </button>

                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/auth', { replace: true })
                          setView('login')
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : view === 'login' ? (
              <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-4">
                {!isAdminMode && googleClientId && (
                  <SocialAuthButtons onGoogle={triggerGoogleSignIn} loading={socialLoading} />
                )}

                {/* Guest checkout — offered only to customers */}
                {!isAdminMode && mode === 'customer' && <GuestBar />}

                {!isAdminMode && (
                  <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span>or continue with email</span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                )}

                <FormField icon={Mail} label="Email">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <FormField icon={Lock} label="Password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </FormField>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true)
                    setForgotError('')
                    setForgotMessage('')
                    setForgotDevLink('')
                  }}
                  className="text-right text-xs text-brand hover:underline font-medium"
                >
                  Forget password?
                </button>

                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70 shadow-md shadow-brand/20"
                >
                  {isSigningIn && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isSigningIn ? 'Signing in...' : `Log In as ${mode === 'rider' ? 'Driver' : 'Customer'}`}
                </button>

                {!isAdminMode && (
                  <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setView('signup')
                        setError('')
                        setSignupStep(1)
                      }}
                      className="font-bold text-brand hover:underline"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </form>
            ) : mode === 'rider' && signupStep === 2 ? (
              <form onSubmit={handlePaymentSubmit} className="mt-5 flex flex-col gap-4">
                <FormField icon={Car} label="Vehicle type">
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="" disabled>
                      Select vehicle type
                    </option>
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField icon={Palette} label="Vehicle color">
                  <input
                    type="text"
                    placeholder="e.g. Black"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <FormField icon={Hash} label="Plate number">
                  <input
                    type="text"
                    placeholder="e.g. LND-234-KJ"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <FormField icon={IdCard} label="Driver's license number">
                  <input
                    type="text"
                    placeholder="License number"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <FormField icon={Fingerprint} label="NIN (National ID Number)">
                  <input
                    type="text"
                    placeholder="11-digit NIN"
                    value={nin}
                    onChange={(e) => setNin(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <FormField icon={Landmark} label="Bank name">
                  <input
                    type="text"
                    placeholder="e.g. GTBank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <FormField icon={CreditCard} label="Bank account number">
                  <input
                    type="text"
                    placeholder="10-digit account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70 shadow-md shadow-brand/20"
                >
                  {isSavingDetails && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isSavingDetails ? 'Saving...' : 'Save & finish'}
                </button>
                <button
                  type="button"
                  onClick={handleSkipPayment}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
                >
                  Skip for now
                </button>
              </form>
            ) : (
              <form onSubmit={handleGeneralSubmit} className="mt-5 flex flex-col gap-4">
                {googleClientId && (
                  <SocialAuthButtons onGoogle={triggerGoogleSignIn} loading={socialLoading} />
                )}

                {/* Guest checkout — offered for customer sign up */}
                {mode === 'customer' && <GuestBar />}

                <FormField icon={User} label="Full name">
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <FormField icon={Mail} label="Email">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <FormField icon={Phone} label="Phone">
                  <input
                    type="tel"
                    placeholder="+234 91 234 6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </FormField>

                <FormField icon={Lock} label="Password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create your password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </FormField>

                <button
                  type="submit"
                  disabled={isSigningUp}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70 shadow-md shadow-brand/20"
                >
                  {isSigningUp && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isSigningUp ? 'Creating account...' : mode === 'rider' ? 'Continue' : 'Create Account'}
                </button>

                <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('login')
                      setError('')
                      setSignupStep(1)
                    }}
                    className="font-bold text-brand hover:underline"
                  >
                    Log In
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 lg:text-left">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Radix First-Time Mode Selection Dialog */}
      <FirstTimeModeDialog
        open={firstTimeModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFirstTimeModalOpen(false)
          }
        }}
        initialMode={mode}
        onSelectMode={handleModalSelectMode}
      />

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-navy dark:text-white">
                  Reset password
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Enter your account email and we&apos;ll send you a password reset link valid for 1 hour.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false)
                  setForgotError('')
                  setForgotMessage('')
                  setForgotDevLink('')
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                <p className="font-semibold">{forgotMessage}</p>
                {forgotDevLink && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="block font-semibold text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                      Dev test reset link (logged to server console):
                    </span>
                    <a
                      href={forgotDevLink}
                      onClick={() => setShowForgot(false)}
                      className="font-medium text-emerald-600 dark:text-emerald-400 underline break-all hover:text-emerald-500"
                    >
                      {forgotDevLink}
                    </a>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSendForgotLink} className="space-y-4">
              <FormField icon={Mail} label="Account Email">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoFocus
                  required
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                />
              </FormField>

              <button
                type="submit"
                disabled={isSendingForgot}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSendingForgot && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isSendingForgot ? 'Sending link...' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgot(false)
                  setForgotError('')
                  setForgotMessage('')
                  setForgotDevLink('')
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-1 font-medium transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
