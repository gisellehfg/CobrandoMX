import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'CobrandoMX — Cobranza Inteligente para PYMES',
  description: 'Recupera tu cartera vencida con IA. Automatiza el seguimiento de clientes morosos por WhatsApp.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CobrandoMX',
  },
  openGraph: {
    title: 'CobrandoMX',
    description: 'Cobranza automatizada con IA para PYMES mexicanas',
    siteName: 'CobrandoMX',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0c12',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans min-h-screen`}>
        {children}
      </body>
    </html>
  )
}