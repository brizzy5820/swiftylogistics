import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, CarFront, CheckCircle2, Clock3, MapPin, Menu, Navigation,  PackageCheck, Search, ShieldCheck, Smartphone, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet'
import { ServiceGrid } from '../components/marketing/ServiceGrid'
import { Footer } from '../components/marketing/Footer'
import { ADDRESS_SUGGESTIONS, fetchLagosSuggestions } from '../lib/address-suggestions'

// variant: 'pickup' | 'dropoff' — circle vs square marker, and the
// "use my location" arrow only shows on pickup. Green border on focus.
function LocationField({ variant, value, onChange, placeholder }) {
  const isPickup = variant === 'pickup'
  const [show, setShow] = useState(false)
  const [items, setItems] = useState(ADDRESS_SUGGESTIONS)
  const [focused, setFocused] = useState(false)
  const [geoLabel, setGeoLabel] = useState('Detecting location…')
  const [geoReady, setGeoReady] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (!isPickup) return
    if (!navigator.geolocation) { setGeoLabel('Location unavailable'); return }
    navigator.geolocation.getCurrentPosition(
      () => { setGeoLabel('My location'); setGeoReady(true) },
      () => setGeoLabel('Location unavailable'),
    )
  }, [isPickup])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const controller = new AbortController()
    timer.current = setTimeout(() => {
      fetchLagosSuggestions(value, controller.signal).then((nextItems) => {
        if (!controller.signal.aborted) setItems(nextItems)
      })
    }, 300)
    return () => {
      controller.abort()
      if (timer.current) clearTimeout(timer.current)
    }
  }, [value])

  function useMyLocation() {
    onChange(geoLabel)
    setShow(false)
  }

  return (
    <div className="relative">
      <div
        className={[
          'flex items-center gap-3 rounded-xl border bg-slate-100 px-4 py-3.5 transition-colors duration-150',
          focused ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.10)]' : 'border-transparent',
        ].join(' ')}
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
          {isPickup ? (
            <span className="h-3.5 w-3.5 rounded-full border-[2.5px] border-black bg-white" />
          ) : (
            <span className="h-3 w-3 bg-black" />
          )}
        </div>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { setFocused(true); setShow(true) }}
          onBlur={() => { setFocused(false); setTimeout(() => setShow(false), 150) }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />

        {value ? (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange('') }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200"
            aria-label={`Clear ${isPickup ? 'pickup' : 'dropoff'}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : isPickup ? (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); useMyLocation() }}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-900"
            aria-label="Use current location"
          >
            <Navigation className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {show && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {geoReady && isPickup && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); useMyLocation() }}
              className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              <Navigation className="h-4 w-4" />
              {geoLabel}
            </button>
          )}
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">Type to search addresses…</p>
          ) : (
            items.map((it) => (
              <button
                key={it.label}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(it.label); setShow(false) }}
                className="block w-full truncate px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                {it.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Index() {
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 700], ['0%', '22%'])
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => scrollY.on('change', (value) => setScrolled(value > 40)), [scrollY])

  const [mode, setMode] = useState('ride')
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [trackCode, setTrackCode] = useState('')

  function handleRide(e) {
    e.preventDefault()
    navigate('/customer/ride', { state: { pickup, dropoff } })
  }

  function handleTrack(e) {
    e.preventDefault()
    const code = trackCode.trim()
    if (!code) return
    navigate(`/customer/track/${encodeURIComponent(code)}`)
  }

  return <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
    <header className={`fixed inset-x-0 top-0 z-50 transition ${scrolled ? 'border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link to="/" className={`text-2xl font-black tracking-tight ${scrolled ? 'text-slate-950' : 'text-slate-900'}`}>Swifty<span className="text-emerald-500">.</span></Link>
        <nav className={`hidden items-center gap-7 text-sm font-semibold md:flex ${scrolled ? 'text-slate-600' : 'text-slate-700'}`}><a href="#services">Services</a><a href="#how">How it works</a><a href="#safety">Safety</a></nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Link to="/customer/ride" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-400"><CarFront className="h-4 w-4" /> Ride</Link>
          <Link to="/rider" className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/15 bg-white/70 px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-white">Drive</Link>
          <Link to="/auth" className={`rounded-full px-4 py-2 text-sm font-bold ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-700 hover:bg-white/60'}`}>Log in</Link>
        </div>
        <Sheet><SheetTrigger asChild><button className={`rounded-xl p-2.5 sm:hidden ${scrolled ? 'text-slate-900' : 'text-slate-900'}`} aria-label="Menu"><Menu /></button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>swifty.</SheetTitle></SheetHeader><div className="mt-6 grid gap-2"><a href="#services" className="rounded-xl p-3 font-semibold">Services</a><a href="#how" className="rounded-xl p-3 font-semibold">How it works</a><Link to="/customer/ride" className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 text-center font-bold text-white">Ride</Link><Link to="/rider" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 p-3 text-center font-bold text-slate-800">Drive</Link><Link to="/auth" className="rounded-xl bg-slate-100 p-3 text-center font-bold text-slate-800">Log in</Link></div></SheetContent></Sheet>
      </div>
    </header>

    <section className="relative overflow-hidden bg-emerald-50/60">
      <motion.div style={{ y: heroY }} className="absolute inset-0 scale-105 opacity-90"><MapBackdrop /></motion.div>
      <motion.div style={{ y: heroY }} className="absolute inset-0 scale-105"><img src="/bgimg.png" onError={(e) => { e.currentTarget.style.display = 'none' }} className="h-full w-full object-cover" alt="" /></motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/60 to-white/85" />
      <div className="relative z-10 mx-auto flex min-h-[600px] items-center  pb-12 pt-25 sm:px-8 sm:pb-16  lg:grid lg:grid-cols-[1.05fr_.95fr] lg:min-h-[760px] lg:px-10 lg:pt-32">
        <div className="w-full py-6 ">
          {/* <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-emerald-700 shadow-sm backdrop-blur"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> One app. Every move.</motion.div> */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }} className="max-w-3xl font-display text-4xl font-black leading-[.98] tracking-[-.04em] text-slate-950 sm:text-6xl px-5 lg:px-none lg:text-7xl">Move your world <span className="text-emerald-500">with Swifty.</span></motion.h1>
          <p className="mt-6 max-w-xl text-base leading-7 px-5 lg:px-none text-slate-600 sm:text-lg">Book a ride, send a package or follow any trip — all from one calm map. Tell us where, and we'll handle the rest.</p>

          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }} className="mt-9 max-w-xl rounded-3xl border border-slate-200/80 bg-white/85 p-4  backdrop-blur-xl">
            <div className="flex rounded-full bg-slate-100 p-1 text-sm font-bold">
              <button type="button" onClick={() => setMode('ride')} className={`flex-1 rounded-full py-2.5 transition ${mode === 'ride' ? 'bg-emerald-500 text-white shadow' : 'text-slate-600'}`}>Request a ride</button>
              <button type="button" onClick={() => setMode('track')} className={`flex-1 rounded-full py-2.5 transition ${mode === 'track' ? 'bg-emerald-500 text-white shadow' : 'text-slate-600'}`}>Track a trip</button>
            </div>

            {mode === 'ride' ? (
              <form onSubmit={handleRide} className="mt-4">
                <div className="relative space-y-6">
                  {/* Dashed connector: bottom of pickup marker to top of dropoff marker */}
                  <div className="pointer-events-none absolute left-[23px] top-[52px] h-6 w-px border-l-2 border-dashed border-slate-300" />
                  <LocationField variant="pickup" value={pickup} onChange={setPickup} placeholder="Pickup location" />
                  <LocationField variant="dropoff" value={dropoff} onChange={setDropoff} placeholder="Where to?" />
                </div>
                <button type="submit" className="mt-4 flex items-center bg-emerald-500 gap-2 rounded-full px-6 py-2.5 text-white text-sm font-bold shadow-sm transition-all ">Find ride <ArrowRight className="h-4 w-4" /></button>
              </form>
            ) : (
              <form onSubmit={handleTrack} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={trackCode} onChange={(e) => setTrackCode(e.target.value)} placeholder="Enter tracking code" className="w-full rounded-2xl bg-slate-50 py-3.5 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border focus:border-emerald" /></div>
                <button type="submit" className="flex items-center bg-emerald-500 gap-2 rounded-full px-6 py-2.5 text-white text-sm font-bold shadow-sm transition-all ">Track now</button>
              </form>
            )}
            {/* <p className="mt-3 px-1 text-xs text-slate-500">{mode === 'ride' ? 'No account needed to start — we’ll ask you to sign in only to confirm the ride.' : 'Public tracking link — no login required to follow a trip.'}</p> */}
          </motion.div>

          {/* <div className=" flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-slate-500"><span><CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-500" />Live tracking</span><span><CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-500" />Cashless-ready</span><span><CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-500" />24/7 support</span></div> */}
        </div>

        <HeroVisual />
      </div>
    </section>

    <section className="border-b border-slate-200 bg-white py-10 sm:py-14"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 sm:grid-cols-4 sm:px-8 lg:px-10 sm:gap-8"><Metric value="50k+" label="completed deliveries" /><Metric value="1.2k+" label="active riders" /><Metric value="4.9/5" label="average experience" /><Metric value="24/7" label="movement support" /></div></section>
    <section id="services" className="bg-slate-50 px-6 py-16 sm:px-8 sm:py-24 lg:px-10"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-emerald-700">Everything in one place</p><h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">More than delivery.</h2><p className="mt-4 text-base leading-7 text-slate-500">Swifty is evolving from a package service into a complete movement platform for everyday people and businesses.</p></div><div className="mt-8 sm:mt-10"><ServiceGrid /></div></div></section>
    <section id="how" className="px-6 py-16 sm:px-8 sm:py-24 lg:px-10"><div className="mx-auto grid max-w-7xl gap-10 lg:gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-emerald-700">Simple by design</p><h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">One flow for every journey.</h2><p className="mt-5 leading-7 text-slate-500">Whether you need a driver or a courier, the experience stays familiar: choose a service, set your destination, confirm and follow the progress.</p></div><div className="grid gap-4 sm:grid-cols-3"><Step n="01" icon={Smartphone} title="Choose" text="Select ride, delivery or another service." /><Step n="02" icon={MapPin} title="Set the route" text="Tell us where to pick up and where to go." /><Step n="03" icon={Clock3} title="Move" text="Get live updates from start to finish." /></div></div></section>
    <section id="safety" className="bg-emerald-50 px-6 py-16 sm:px-8 sm:py-24 lg:px-10"><div className="mx-auto grid max-w-7xl gap-6 lg:gap-8 lg:grid-cols-3"><Safety icon={ShieldCheck} title="Built around trust" text="Clear trip details, rider information and status updates keep everyone informed." /><Safety icon={PackageCheck} title="Every order visible" text="Track rides and deliveries from the same account instead of jumping between apps." /><Safety icon={CarFront} title="Ready to scale" text="The platform is structured for Express + MongoDB on the backend when live services are connected." /></div></section>
    <section className="bg-slate-950 px-6 py-16 text-center text-white sm:px-8 sm:py-24"><div className="mx-auto max-w-3xl"><h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-6xl">Your next move starts here.</h2><p className="mx-auto mt-5 max-w-xl leading-7 text-slate-400">One account for rides, packages and the everyday journeys in between.</p><Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold hover:bg-emerald-400">Get started <ArrowRight className="h-4 w-4" /></Link></div></section>
    <Footer />
  </div>
}

function MapBackdrop() {
  return (
   <img src='https://plus.unsplash.com/premium_photo-1681488098851-e3913f3b1908?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8bWFwJTIwYmFja2dyb3VuZHxlbnwwfHwwfHx8MA%3D%3D' className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
   </img>
  )
}

function HeroVisual() {
  return (
    <div className="relative mt-0 hidden lg:mt-0 lg:block">
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .2 }} className="relative  w-full overflow-hidden rounded-[2.4rem] bg-white  shadow-2xl shadow-emerald-900/10 ring-1 ring-slate-200/80">
        <div className="relative h-100  overflow-hidden rounded-[1.9rem] bg-emerald-100">
          <img src="/blush.png" alt="A Swifty rider ready to pick you up" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-transparent to-transparent" />
        </div>

      </motion.div>
      <div className="absolute -left-6 hidden top-10 flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-xl ring-1 ring-slate-200 backdrop-blur"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50"><MapPin className="h-4 w-4 text-emerald-600" /></span><div><p className="text-xs font-bold text-slate-900">Live route</p><p className="text-[11px] text-slate-500">Updated in real time</p></div></div>
      <div className="absolute -right-4 hidden bottom-16 flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-xl ring-1 ring-slate-200 backdrop-blur"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50"><CheckCircle2 className="h-4 w-4 text-rose-500" /></span><div><p className="text-xs font-bold text-slate-900">On time</p><p className="text-[11px] text-slate-500">4.9 ★ rider rating</p></div></div>
    </div>
  )
}

function Metric({ value, label }) { return <div className="text-center"><p className="font-display text-3xl font-black tracking-tight sm:text-4xl">{value}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p></div> }
function Step({ n, icon: Icon, title, text }) { return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><span className="text-xs font-black text-emerald-600">{n}</span><Icon className="mt-7 h-6 w-6 text-slate-900" /><h3 className="mt-5 font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div> }
function Safety({ icon: Icon, title, text }) { return <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-emerald-100"><Icon className="h-7 w-7 text-emerald-600" /><h3 className="mt-6 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></div> }
function MapPinIcon(props) { return <span {...props} className={props.className}>⌖</span> }
