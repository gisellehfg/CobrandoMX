'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface Props {
  customer?: any
  onClose: () => void
  onSaved: () => void
}

export default function CustomerModal({ customer, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    amount_owed: '',
    due_date: '',
    status: 'pendiente',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        phone: customer.phone_display || '',
        amount_owed: customer.amount_owed || '',
        due_date: customer.due_date || '',
        status: customer.status || 'pendiente',
        notes: customer.notes || '',
      })
    }
  }, [customer])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    setLoading(true)
    setError('')

    // Validar teléfono México
    const phoneClean = form.phone.replace(/\D/g, '')
    if (phoneClean.length < 10) {
      setError('Número de teléfono inválido (mínimo 10 dígitos)')
      setLoading(false)
      return
    }

    const phoneDisplay = phoneClean.slice(-4)
    const phoneFormatted = `52${phoneClean.slice(-10)}`

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user?.id)
      .single()

    const payload = {
      organization_id: profile?.organization_id,
      name: form.name.trim(),
      phone_encrypted: phoneFormatted, // En producción: cifrar aquí
      phone_display: phoneDisplay,
      amount_owed: parseFloat(form.amount_owed) || 0,
      due_date: form.due_date || null,
      status: form.status,
      notes: form.notes,
    }

    let error
    if (customer?.id) {
      const res = await supabase.from('customers').update(payload).eq('id', customer.id)
      error = res.error
    } else {
      const res = await supabase.from('customers').insert(payload)
      error = res.error

      // Enviar primer mensaje WhatsApp automático
      if (!error && form.phone) {
        await fetch('/api/whatsapp/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneFormatted, name: form.name, amount: form.amount_owed }),
        }).catch(() => {})
      }
    }

    if (error) {
      setError('Error al guardar: ' + error.message)
    } else {
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">
            {customer ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {[
            { k: 'name', label: 'Nombre completo', placeholder: 'Juan García López', type: 'text' },
            { k: 'phone', label: 'WhatsApp (10 dígitos)', placeholder: '5512345678', type: 'tel' },
            { k: 'amount_owed', label: 'Monto adeudado (MXN)', placeholder: '5000', type: 'number' },
            { k: 'due_date', label: 'Fecha de vencimiento', placeholder: '', type: 'date' },
          ].map(f => (
            <div key={f.k}>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">{f.label}</label>
              <input
                type={f.type}
                value={(form as any)[f.k]}
                onChange={e => set(f.k, e.target.value)}
                className="input-premium"
                placeholder={f.placeholder}
              />
            </div>
          ))}

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Estatus</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="input-premium"
            >
              {['pendiente', 'en_negociacion', 'promesa_pago', 'pagado', 'no_responde'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="input-premium resize-none"
              rows={2}
              placeholder="Observaciones adicionales..."
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-muted hover:bg-secondary border border-border rounded-xl py-3 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}