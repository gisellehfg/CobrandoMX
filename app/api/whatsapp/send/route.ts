import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: NextRequest) {
  try {
    const { customerId, type } = await request.json()

    const supabase = createClient()
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const phone = `whatsapp:+${customer.phone_encrypted}`
    
    let message = ''
    if (type === 'reminder') {
      const amount = new Intl.NumberFormat('es-MX', { 
        style: 'currency', currency: 'MXN' 
      }).format(customer.amount_owed)
      
      message = `Hola ${customer.name}, te contactamos de parte de tu proveedor. Tienes un saldo pendiente de *${amount}*. ¿Podemos ayudarte a regularizar tu cuenta? Responde este mensaje para coordinar tu pago. 🙏`
    }

    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to: phone,
      body: message,
    })

    // Actualizar último contacto
    await supabase
      .from('customers')
      .update({ 
        last_contact_at: new Date().toISOString(),
        contact_attempts: (customer.contact_attempts || 0) + 1
      })
      .eq('id', customerId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('WhatsApp error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}