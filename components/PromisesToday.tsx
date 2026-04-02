'use client'

interface Props {
  promises: any[]
}

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function PromisesToday({ promises }: Props) {
  if (!promises || promises.length === 0) return null

  return (
    <div className="card-premium">
      <h3 className="text-sm font-semibold mb-4 text-foreground">
        🔔 Promesas de pago hoy ({promises.length})
      </h3>
      <div className="space-y-3">
        {promises.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <div>
              <p className="text-sm font-medium">{p.customer?.name}</p>
              <p className="text-xs text-muted-foreground">···{p.customer?.phone_display}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-400">{formatMXN(p.promised_amount)}</p>
              <p className="text-xs text-muted-foreground">prometido hoy</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}