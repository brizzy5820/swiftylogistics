import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MOCK_SERVICES } from '../../data/mock-data'

export function ServiceGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MOCK_SERVICES.map((service) => (
        <Link key={service.id} to={service.href} className="group overflow-hidden rounded-3xl bg-white lg:shadow-sm lg:ring-1 lg:ring-slate-200/70 transition hover:-translate-y-1 hover:shadow-xl">
          <div className="relative h-auto  overflow-hidden bg-emerald-50">
            <img
              src={service.image}
              alt={service.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            {/* <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" /> */}
          </div>
          <div className="p-6">
            <h3 className="font-display text-lg font-bold text-slate-950">{service.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{service.description}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-emerald-700">Explore service <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
          </div>
        </Link>
      ))}
    </div>
  )
}
