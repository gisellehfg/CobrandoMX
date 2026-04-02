'use client'
import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { createClient } from '@/lib/supabase/client'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: ${p.value?.toLocaleString('es-MX')}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function RecoveryChart({ orgId }: { orgId: string }) {
  const [data, setData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Generar datos de los últimos 7 días
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const label = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
        days.push({ date: d.toISOString().split('T')[0], label })
      }

      const { data: customers } = await supabase
        .from('customers')
        .select('amount_owed, amount_paid, status, updated_at')
        .eq('organization_id', orgId)

      const chartData = days.map(day => {
        const dayPaid = customers?.filter(c =>
          c.updated_at?.startsWith(day.date) && c.status === 'pagado'
        ).reduce((sum, c) => sum + (c.amount_paid || 0), 0) || 0

        const dayPending = customers?.filter(c =>
          c.status !== 'pagado'
        ).reduce((sum, c) => sum + (c.amount_owed || 0), 0) || 0

        return {
          dia: day.label,
          Recuperado: Math.round(dayPaid),
          Pendiente: Math.round(dayPending / 7),
        }
      })

      setData(chartData)
    }
    if (orgId) load()
  }, [orgId])

  return (
    <div className="card-premium">
      <h3 className="text-sm font-semibold mb-4 text-foreground">Recuperación últimos 7 días</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 14% 16%)" vertical={false} />
          <XAxis
            dataKey="dia"
            tick={{ fill: 'hsl(210 14% 50%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(210 14% 50%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v > 999 ? `${Math.round(v/1000)}k` : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Recuperado" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Pendiente" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          Recuperado
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-sm bg-amber-500 opacity-50" />
          Pendiente
        </div>
      </div>
    </div>
  )
}