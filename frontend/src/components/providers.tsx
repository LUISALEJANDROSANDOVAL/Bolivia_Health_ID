'use client'

import { WalletProvider } from '@/contexts/wallet-context'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
