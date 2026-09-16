import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { BRAND } from '../../config/brand'

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <div className="text-2xl font-black tracking-tight">swifty<span className="text-emerald-400">.</span></div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">{BRAND.description} Built around one simple idea: getting from here to there should feel effortless.</p>
        </div>
        <FooterColumn title="Services" links={['Ride', 'Delivery', 'Business', 'Become a rider']} />
        <FooterColumn title="Company" links={['About Swifty', 'Safety', 'Careers', 'Help centre']} />
        <FooterColumn title="Legal" links={['Terms', 'Privacy', 'Cookies']} />
      </div>
      <div className="border-t border-white/10 px-6 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Swifty. All rights reserved.</span>
          <span>Designed for reliable movement.</span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="text-sm font-bold">{title}</h4>
      <div className="mt-5 space-y-3">
        {links.map((label) => <Link key={label} to="/auth" className="group flex items-center gap-1 text-sm text-slate-400 transition hover:text-white">{label}<ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" /></Link>)}
      </div>
    </div>
  )
}
