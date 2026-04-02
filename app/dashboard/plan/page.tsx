'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export default function PlanPage() {
  const [org, setOrg] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization:organizations(*)')
        .eq('id', user?.id)
        .single()
      setOrg((profile?.organization as any) || null)
    }
    load()
  }, [])

  const trialEnd = org?.trial_ends_at
    ? new Date(org.trial_ends_at).toLocaleDateString('es-MX')
    : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Mi Plan</h1>
        <p className="text-muted-foreground text-sm">Suscripción y facturación</p>
      </div>

      {/* Estado actual */}
      <div className="card-premium">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold">Plan Trial</p>
            <p className="text-xs text-muted-foreground">
              {trialEnd ? `Vence el ${trialEnd}` : 'Activo'}
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Hasta 200 clientes · WhatsApp IA · Dashboard completo
        </div>
      </div>

      {/* Planes */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Planes disponibles
        </h2>

        {/* Básico */}
        <div className="card-premium">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold">Básico</p>
              <p className="text-xs text-muted-foreground">Hasta 200 clientes</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">$499</p>
              <p className="text-xs text-muted-foreground">MXN/mes</p>
            </div>
          </div>
          {['Dashboard completo', 'WhatsApp automatizado', 'IA de cobranza', 'Hasta 200 deudores'].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
              {f}
            </div>
          ))}
          <button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 text-sm font-semibold transition-colors">
            Suscribirme — $499/mes
          </button>
        </div>

        {/* Pro */}
        <div className="card-premium" style={{borderColor: 'rgba(16,185,129,0.3)'}}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold">Pro</p>
              <p className="text-xs text-emerald-400">Clientes ilimitados</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400">$999</p>
              <p className="text-xs text-muted-foreground">MXN/mes</p>
            </div>
          </div>
          {['Todo lo del Básico', 'Clientes ilimitados', 'Reportes avanzados', 'Soporte prioritario'].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
              {f}
            </div>
          ))}
          <button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors">
            Suscribirme — $999/mes
          </button>
        </div>
      </div>
    </div>
  )
}