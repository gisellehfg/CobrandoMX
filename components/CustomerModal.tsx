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
      phone_encrypted: phoneFormatted,
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
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg">
              {customer ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>
            <button onClick={onClose} className="text-muted-foreground