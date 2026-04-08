import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: NextRequest) {
  try {
    const { phone, name, amount } = await request.json()

    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(parseFloat(amount))

    const message = `Hola ${name}, te contactamos para informarte que tienes un saldo pendiente de *${formattedAmount}*. Estamos aquí para ayudarte a encontrar la mejor opción de pago. ¿Cuándo podríamos hablar? 😊`

    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to: `whatsapp:+${phone}`,
      body: message,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Welcome message error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}