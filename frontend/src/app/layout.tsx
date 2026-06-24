import type { Metadata, Viewport } from 'next'

import { Analytics } from '@vercel/analytics/next'
import { ClientWrapper } from '@/components/client-wrapper'
import './globals.css'

import { Outfit } from 'next/font/google'

const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit'
});

export const metadata: Metadata = {
  title: 'Bolivia Health ID - Sistema de Salud Descentralizado',
  description: 'Tu identidad de salud descentralizada. Gestiona tus registros médicos de forma segura con tecnología blockchain.',
  generator: 'v0.app',
  keywords: ['salud', 'blockchain', 'Bolivia', 'IPFS', 'registros médicos', 'descentralizado'],
  authors: [{ name: 'Bolivia Health ID' }],
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#007BFF',
  width: 'device-width',
  initialScale: 1,
}

import { Toaster } from 'sonner'
import { Toaster as ShadcnToaster } from '@/components/ui/toaster'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <ClientWrapper>
          {children}
        </ClientWrapper>
        <Toaster position="top-center" richColors />
        <ShadcnToaster />
        <Analytics />
      </body>
    </html>
  )
}
