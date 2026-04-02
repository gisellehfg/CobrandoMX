'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Bell, Settings } from 'lucide-react'
import Link from 'next/link'

export default function TopHeader({ profile }: { profile: any }) {
  const supabase = createClient()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const org = profile?.organization
  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">C</span>
          </div>
          <span className="font-bold text-sm text-foreground">CobrandoMX</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/configuracion"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings size={16} />
          </Link>
          <button
            onClick={signOut}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut size={16} />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  )
}