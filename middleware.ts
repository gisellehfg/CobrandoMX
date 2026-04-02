// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Rutas públicas
  const publicPaths = ['/login', '/register', '/legal', '/api/webhooks']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  // Si no está autenticado y no es ruta pública → login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si está autenticado y va a login → dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Kill switch: verificar suscripción para rutas protegidas del dashboard
  if (user && pathname.startsWith('/dashboard') && !pathname.includes('/plan')) {
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_status, trial_ends_at')
      .eq('id', (await supabase.from('profiles').select('organization_id').eq('id', user.id).single()).data?.organization_id)
      .single()

    if (org) {
      const isTrialActive = org.trial_ends_at && new Date(org.trial_ends_at) > new Date()
      const isSubscriptionActive = org.subscription_status === 'active'
      
      if (!isTrialActive && !isSubscriptionActive) {
        return NextResponse.redirect(new URL('/dashboard/plan?blocked=true', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}