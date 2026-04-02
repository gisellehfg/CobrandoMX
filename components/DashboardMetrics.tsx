'use client'
import { TrendingUp, Clock, DollarSign, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Metrics {
  total_portfolio: number
  total_recovered: number
  total_overdue: number
  recovery_rate: number
  customers_total: number
  customers_pending: number
  customers_negotiating: number
  customers_promised: number
  customers_paid: number
  customers_no_response: number
}

function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function DashboardMetrics({ metrics }: { metrics: Metrics | null }) {
  const m = metrics || {
    total_portfolio: 0, total_recovered: 0, total_overdue: 0,
    recovery_rate: 0, customers_total: 0, customers_pending: 0,
    customers_negotiating: 0, customers_promised: 0, customers_paid: 0,
    customers_no_response: 0,
  }

  const cards = [
    {
      title: 'Total Cartera',
      value: formatMXN(m.total_portfolio),
      icon: DollarSign,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      title: 'Recuperado',
      value: formatMXN(m.total_recovered),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      accent: true,
    },
    {
      title: 'Total Vencido',
      value: formatMXN(m.total_overdue),
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      title: '% Recuperación',
      value: `${m.recovery_rate}%`,
      icon: CheckCircle2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div
            key={c.title}
            className={`stat-card ${c.accent ? 'glow-emerald' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl ${c.bg} border ${c.border}`}>
                <c.icon size={16} className={c.color} />
              </div>
            </div>
            <div className={`text-xl font-bold tabular-nums ${c.accent ? 'text-emerald-400' : 'text-foreground'}`}>
              {c.value}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.title}</div>
          </div>
        ))}
      </div>

      {/* Barra de progreso de recuperación */}
      <div className="card-premium">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Progreso de recuperación</span>
          <span className="text-sm font-bold text-emerald-400">{m.recovery_rate}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(m.recovery_rate, 100)}%` }}
          />
        </div>
        
        {/* Distribución por estatus */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Pendientes', value: m.customers_pending, color: 'text-amber-400' },
            { label: 'Negociando', value: m.customers_negotiating, color: 'text-blue-400' },
            { label: 'Promesas', value: m.customers_promised, color: 'text-purple-400' },
            { label: 'Pagados', value: m.customers_paid, color: 'text-emerald-400' },
            { label: 'Sin resp.', value: m.customers_no_response, color: 'text-red-400' },
            { label: 'Total', value: m.customers_total, color: 'text-foreground' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}