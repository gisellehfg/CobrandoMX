'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle } from 'lucide-react'

export default function ChatsPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('conversations')
        .select('*, customer:customers(name, phone_display, amount_owed, status)')
        .order('last_message_at', { ascending: false })
        .limit(50)
      setConversations(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Chats</h1>
        <p className="text-muted-foreground text-sm">Conversaciones por WhatsApp</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card-premium animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="card-premium text-center py-12">
          <MessageCircle size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No hay conversaciones aún</p>
          <p className="text-muted-foreground text-xs mt-1">
            Agrega un cliente y envíale un mensaje de WhatsApp
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map(c => (
            <div key={c.id} className="card-premium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{c.customer?.name}</p>
                  <p className="text-xs text-muted-foreground">···{c.customer?.phone_display}</p>
                </div>
                <div className="text-right">
                  {c.unread_count > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-bold">
                      {c.unread_count}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.status === 'open' ? 'Abierto' : 'Cerrado'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}