'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const Providers = dynamic(
  () => import('./providers').then((mod) => mod.Providers),
  { ssr: false }
)

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
