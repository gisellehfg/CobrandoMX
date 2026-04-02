'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Upload, MessageCircle, CheckCircle, MoreVertical, Filter } from 'lucide-react'
import CustomerModal from '@/components/CustomerModal'
import CSVImportModal from '@/components/CSVImportModal'

type Customer = {
  id: string
  name: string
  phone_display: string
  amount_owed: number
  amount_paid: number
  due_date: string
  days_overdue: number
  status: string
  last_contact_at: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_negociacion: 'Negociando',
  promesa_pago: 'Promesa',
  pagado: 'Pagado',
  no_responde: 'Sin respuesta',
  cerrado: 'Cerrado',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [showAdd, setShowAdd] = useState(false)
  const [showCSV, setShowCSV] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('customers')
      .select('*')
      .order('days_overdue', { ascending: false })

    if (filterStatus !== 'todos') {
      q = q.eq('status', filterStatus)
    }
    if (search) {
      q = q.ilike('name', `%${search}%`)
    }

    const { data } = await q.limit(100)
    setCustomers(data || [])
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => { load() }, [load])

  async function markPaid(id: string) {
    await supabase
      .from('customers')
      .update({ status: 'pagado', amount_paid: customers.find(c => c.id === id)?.amount_owed || 0 })
      .eq('id', id)
    load()
  }

  async function sendReminder(customer: Customer) {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: customer.id, type: 'reminder' }),
    })
    if (res.ok) alert(`Recordatorio enviado a ${customer.name}`)
    else alert('Error al enviar. Verifica tu configuración de WhatsApp.')
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} deudores</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCSV(true)}
            className="flex items-center gap-1.5 bg-muted hover:bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          >
            <Upload size={14} />
            CSV
          </button>
          <button
            onClick={() => { setSelected(null); setShowAdd(true) }}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-premium pl-9"
            placeholder="Buscar por nombre..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['todos', 'pendiente', 'en_negociacion', 'promesa_pago', 'pagado', 'no_responde'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all
                ${filterStatus === s
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border hover:border-foreground/20'
                }`}
            >
              {s === 'todos' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-premium animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-premium text-center py-12">
          <p className="text-muted-foreground text-sm">
            {customers.length === 0
              ? 'No hay clientes aún. ¡Agrega tu primer deudor!'
              : 'Sin resultados para tu búsqueda'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="card-premium hover:border-border/80 transition-all cursor-pointer"
              onClick={() => { setSelected(c); setShowAdd(true) }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{c.name}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    📱 ···{c.phone_display}
                  </div>
                  {c.days_overdue > 0 && (
                    <div className="text-xs text-amber-400 mt-0.5">
                      ⚠️ {c.days_overdue} días vencido
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm text-amber-400">
                    {formatMXN(c.amount_owed - (c.amount_paid || 0))}
                  </div>
                  <div className="text-xs text-muted-foreground">adeudo</div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border/50"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => sendReminder(c)}
                  className="flex items-center gap-1.5 text-xs bg-muted hover:bg-secondary border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle size={12} />
                  WhatsApp
                </button>
                {c.status !== 'pagado' && (
                  <button
                    onClick={() => markPaid(c.id)}
                    className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-emerald-400 transition-colors"
                  >
                    <CheckCircle size={12} />
                    Marcar pagado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <CustomerModal
          customer={selected}
          onClose={() => { setShowAdd(false); setSelected(null) }}
          onSaved={load}
        />
      )}
      {showCSV && (
        <CSVImportModal
          onClose={() => setShowCSV(false)}
          onImported={load}
        />
      )}
    </div>
  )
}