import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import TopHeader from '@/components/TopHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopHeader profile={profile} />
      <main className="flex-1 pb-24 pt-4">
        <div className="max-w-2xl mx-auto px-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}