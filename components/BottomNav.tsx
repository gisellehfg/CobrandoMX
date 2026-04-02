'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, MessageCircle, CreditCard } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/chats', label: 'Chats', icon: MessageCircle },
  { href: '/dashboard/plan', label: 'Plan', icon: CreditCard },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map(item => {
          const active = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-200
                ${active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <item.icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}