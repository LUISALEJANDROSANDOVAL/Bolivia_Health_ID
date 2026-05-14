'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// Cargamos los Providers dinámicamente y SOLO en el cliente
const Providers = dynamic(
  () => import('./providers').then((mod) => mod.Providers),
  { ssr: false }
)

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
