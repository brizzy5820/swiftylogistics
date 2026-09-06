import { useState, useEffect } from 'react'
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
  CheckCircle2,
} from 'lucide-react'
import { signIn, getCurrentUser, signUp, updateCurrentUser, emailExists, VEHICLE_TYPES, forgotPassword } from '@/lib/mock-store'

// A single labeled input row. The border goes emerald on focus via
// focus-within, so it works whether the child is an <input> or <select>.
function FormField({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors duration-150 focus-within:border-emerald-400 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.10)]">
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        {children}
      </div>
    </label>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const role = state?.role === 'rider' ? 'rider' : 'customer'
  const [tab, setTab] = useState(state?.role ? 'signup' : 'login')
  const [signupStep, setSignupStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [name, setName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const [vehicleType, setVehicleType] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [nin, setNin] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  useEffect(() => {
    if (state?.role) return // explicit CTA intent (e.g. "I'm a rider") wins over an existing session
    const user = getCurrentUser()
    if (user) {
      const dest = user.role === 'admin' ? '/admin' : user.role === 'rider' ? '/rider' : '/customer'
      navigate(dest, { replace: true })
    }
  }, [navigate, state])

  function switchTab(t) {
    setTab(t)
    setSignupStep(1)
    setError('')
    setShowPassword(false)
  }

  function handleLogin(e) {
    e.preventDefault()
    setError('')
    const user = signIn(loginEmail, loginPassword)
    if (!user) {
      setError('Invalid email or password. Please try again.')
      return
    }
    // Always redirect by the user's actual stored role — not the CTA role.
    // Return to the page they were sent from (carrying any prefill intent).
    const fallback = user.role === 'admin' ? '/admin' : user.role === 'rider' ? '/rider' : '/customer'
    navigate(state?.from || fallback, { replace: true, state: state?.intent ?? null })
  }

  function handleGeneralSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !signupEmail.trim() || !signupPassword.trim() || (role === 'rider' && !phone.trim())) {
      setError('Please fill in all required fields.')
      return
    }

    if (emailExists(signupEmail.trim())) {
      setError('An account with that email already exists. Please log in instead.')
      return
    }

    const user = signUp(name.trim(), signupEmail.trim(), role, { phone: phone.trim(), password: signupPassword.trim() })
    if (user.role === 'rider') {
      setSignupStep(2)
      return
    }
    navigate(state?.from || '/customer', { replace: true, state: state?.intent ?? null })
  }

  function handlePaymentSubmit(e) {
    e.preventDefault()
    const details = {}
    if (vehicleType) details.vehicleType = vehicleType
    if (vehicleColor.trim()) details.vehicleColor = vehicleColor.trim()
    if (plateNumber.trim()) details.plateNumber = plateNumber.trim()
    if (licenseNumber.trim()) details.licenseNumber = licenseNumber.trim()
    if (nin.trim()) details.nin = nin.trim()
    if (bankName.trim()) details.bankName = bankName.trim()
    if (accountNumber.trim()) details.accountNumber = accountNumber.trim()
    if (Object.keys(details).length > 0) {
      updateCurrentUser(details)
    }
    navigate(state?.from || '/rider', { replace: true, state: state?.intent ?? null })
  }

  function handleSkipPayment() {
    navigate(state?.from || '/rider', { replace: true, state: state?.intent ?? null })
  }

  function handleForgot() {
    setForgotMessage('')
    if (!forgotEmail.trim()) {
      setForgotMessage('Enter the email tied to your account.')
      return
    }
    const result = forgotPassword(forgotEmail.trim())
    if (!result) {
      setForgotMessage('No account found with that email.')
      return
    }
    setForgotMessage('Done! Temporary password: reset1234 — log in and change it from your account settings.')
    setTimeout(() => {
      setShowForgot(false)
      setForgotEmail('')
      setForgotMessage('')
      setLoginEmail(forgotEmail.trim())
      setLoginPassword('reset1234')
    }, 1800)
  }

  // Quick-login helpers for the demo so seeded users are obvious.
  function fillAdmin() {
    setTab('login')
    setLoginEmail('admin@swifty.app')
    setLoginPassword('admin')
  }
  function fillRider() {
    setTab('login')
    setLoginEmail('rider@swifty.app')
    setLoginPassword('rider')
  }
  function fillCustomer() {
    setTab('login')
    setLoginEmail('customer@swifty.app')
    setLoginPassword('customer')
  }

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Image panel — fixed to the left half of the viewport on lg+ */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:block lg:w-1/2">
        <img src="/formimg.png" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="font-display text-3xl font-black leading-tight tracking-tight text-white">
            Move your world<br />with Swifty.
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">
            One account for rides, packages and the everyday journeys in between.
          </p>
        </div>
      </div>

      {/* Form column — offset past the fixed image on lg+, scrolls independently */}
      <div className="flex min-h-screen w-full flex-col items-center px-6 py-12 lg:mr-[50%] lg:w-1/2 lg:justify-center  lg:px-1 lg:py-16">
        <div className="w-full lg:px-6">
          <Link to="/" className="mb-2 flex items-center gap-1 self-start text-sm text-slate-400 transition-colors hover:text-navy">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>

          <div className="mb-5 flex items-center justify-center lg:justify-start">
            <img src="/logo.png" alt="Swifty logo" className="h-20 w-auto object-contain" />
          </div>

          <div className="text-center lg:text-left">
            <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">Welcome to Swifty</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in or create an account to continue</p>
          </div>

          <div className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold lg:justify-start ${
            role === 'rider' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
          }`}>
            {role === 'rider' ? <Car className="h-4 w-4" /> : <User className="h-4 w-4" />}
            {role === 'rider' ? "You're signing in as a Rider" : "You're signing in as a Customer"}
          </div>

          <div className="mt-8 w-full rounded-2xl  bg-white py-6 lg:px-3 md:px-2 lg:shadow-none lg:border-none">
            {/* Tab switcher — hidden on rider step 2, otherwise always here at the top */}
            {!(role === 'rider' && tab === 'signup' && signupStep === 2) && (
              <>
                <div className="flex rounded-full bg-surface-200 p-1">
                  <button
                    onClick={() => switchTab('login')}
                    className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                      tab === 'login' ? 'bg-brand text-white shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => switchTab('signup')}
                    className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                      tab === 'signup' ? 'bg-brand text-white shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Role label — only shown on signup tab */}
                {tab === 'signup' && (
                  <p className="mt-3 text-center text-xs text-slate-400">
                    Signing up as {role === 'rider' ? 'a rider' : 'a customer'}
                    {role === 'rider' && ' · Step 1 of 2'}
                  </p>
                )}
              </>
            )}

            {role === 'rider' && tab === 'signup' && signupStep === 2 && (
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-brand">Step 2 of 2</p>
                <h2 className="mt-1 text-sm font-bold text-navy">Payment &amp; verification details</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Add these now, or skip and complete them later from your account settings.
                </p>
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-500">
                {error}
              </p>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-4">
                <FormField icon={Mail} label="Email">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <FormField icon={Lock} label="Password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                    {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                  </button>
                </FormField>

                <button type="button" onClick={() => { setShowForgot(true); setForgotMessage('') }} className="text-right text-xs text-brand hover:underline">
                  Forget password?
                </button>

                <button
                  type="submit"
                  className="mt-1 w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  Login
                </button>
              </form>
            ) : role === 'rider' && signupStep === 2 ? (
              <form onSubmit={handlePaymentSubmit} className="mt-5 flex flex-col gap-4">
                <FormField icon={Car} label="Vehicle type">
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
                  >
                    <option value="" disabled>Select vehicle type</option>
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </FormField>

                <FormField icon={Palette} label="Vehicle color">
                  <input
                    type="text"
                    placeholder="e.g. Black"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <FormField icon={Hash} label="Plate number">
                  <input
                    type="text"
                    placeholder="e.g. LND-234-KJ"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <FormField icon={IdCard} label="Driver's license number">
                  <input
                    type="text"
                    placeholder="License number"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <FormField icon={Fingerprint} label="NIN (National ID Number)">
                  <input
                    type="text"
                    placeholder="11-digit NIN"
                    value={nin}
                    onChange={(e) => setNin(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <FormField icon={Landmark} label="Bank name">
                  <input
                    type="text"
                    placeholder="e.g. GTBank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <FormField icon={CreditCard} label="Bank account number">
                  <input
                    type="text"
                    placeholder="10-digit account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <button
                  type="submit"
                  className="mt-1 w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  Save &amp; finish
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
                <FormField icon={User} label="Full name">
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <FormField icon={Mail} label="Email">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <FormField icon={Phone} label="Phone">
                  <input
                    type="tel"
                    placeholder="+234 91 234 6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </FormField>

                <FormField icon={Lock} label="Password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create your password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                    {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                  </button>
                </FormField>

                <button
                  type="submit"
                  className="mt-1 w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  {role === 'rider' ? 'Continue' : 'Create Account'}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 lg:text-left">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>

          {tab === 'login' && (
            <div className="mt-5 hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Demo accounts</p>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={fillAdmin} className="rounded-xl border border-emerald-200 bg-white px-2 py-2 text-left text-[11px] font-semibold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50">
                  <span className="block text-[10px] font-bold uppercase text-emerald-700">Admin</span>
                  admin@swifty.app
                </button>
                <button type="button" onClick={fillCustomer} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-left text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Customer</span>
                  customer@swifty.app
                </button>
                <button type="button" onClick={fillRider} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-left text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                  <span className="block text-[10px] font-bold uppercase text-slate-500">Rider</span>
                  rider@swifty.app
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400">Seeded admin: admin@swifty.app / admin. Customer & rider accounts appear after signup.</p>
            </div>
          )}
        </div>
      </div>

      {/* Forgot password modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-black text-slate-950">Reset password</h2>
                <p className="mt-1 text-sm text-slate-500">Enter your email and we'll set a temporary password you can change later.</p>
              </div>
              <button onClick={() => setShowForgot(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <FormField icon={Mail} label="Email">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </FormField>
            {forgotMessage && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-700">{forgotMessage}</p>
            )}
            <button
              onClick={handleForgot}
              className="mt-5 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Send reset link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}