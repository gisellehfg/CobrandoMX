import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardMetrics from '@/components/DashboardMetrics'
import RecoveryChart from '@/components/RecoveryChart'
import PromisesToday from '@/components/PromisesToday'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organization:organizations(name, subscription_plan)')
    .eq('id', user.id)
    .single()

  const orgId = profile?.organization_id

  // Métricas
  const { data: metrics } = await supabase.rpc('get_org_metrics', { org_id: orgId })

  // Promesas de pago hoy
  const today = new Date().toISOString().split('T')[0]
  const { data: promises } = await supabase
    .from('payment_promises')
    .select('*, customer:customers(name, phone_display, amount_owed)')
    .eq('organization_id', orgId)
    .eq('promised_date', today)
    .eq('status', 'pending')
    .limit(5)

  // Datos para gráfica (últimos 7 días)
  const { data: weeklyData } = await supabase
    .from('customers')
    .select('amount_paid, updated_at, status')
    .eq('organization_id', orgId)
    .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {(profile?.organization as any)?.name}
        </p>
      </div>

      <DashboardMetrics metrics={metrics} />
      
      <RecoveryChart orgId={orgId} />
      
      {promises && promises.length > 0 && (
        <PromisesToday promises={promises} />
      )}
    </div>
  )
}