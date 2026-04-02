'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          company_name: form.company_name,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <span className="text-primary text-xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold">CobrandoMX</h1>
          <p className="text-muted-foreground text-sm mt-1">14 días gratis · Sin tarjeta</p>
        </div>

        <div className="card-premium">
          <h2 className="text-lg font-semibold mb-6">Crear cuenta</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            {[
              { key: 'full_name', label: 'Tu nombre', placeholder: 'Ana García', type: 'text' },
              { key: 'company_name', label: 'Nombre de tu empresa', placeholder: 'Distribuidora Norte S.A.', type: 'text' },
              { key: 'email', label: 'Email', placeholder: 'tu@empresa.com', type: 'email' },
              { key: 'password', label: 'Contraseña', placeholder: 'Mín. 8 caracteres', type: 'password' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">{f.label}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  className="input-premium"
                  placeholder={f.placeholder}
                  required
                />
              </div>
            ))}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm
                         hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Creando cuenta...' : 'Empezar gratis 14 días'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Al registrarte aceptas nuestros{' '}
          <Link href="/legal/terminos" className="underline">Términos</Link> y{' '}
          <Link href="/legal/privacidad" className="underline">Aviso de Privacidad</Link>
        </p>
      </div>
    </div>
  )
}