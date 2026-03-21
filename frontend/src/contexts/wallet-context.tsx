'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface WalletContextType {
  isConnected: boolean
  walletAddress: string | null
  userName: string | null
  connect: () => void
  disconnect: () => void
}

const defaultValue: WalletContextType = {
  isConnected: false,
  walletAddress: null,
  userName: null,
  connect: () => {},
  disconnect: () => {},
}

const WalletContext = createContext<WalletContextType>(defaultValue)

function formatAddress(address: string | null): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    // Revisar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsConnected(true)
        setUserName(session.user.user_metadata?.full_name || session.user.email || 'Usuario')
      }
    })

    // Escuchar cambios (login, logout, refetch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsConnected(true)
        setUserName(session.user.user_metadata?.full_name || session.user.email || 'Usuario')
      } else {
        setIsConnected(false)
        setUserName(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const connect = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : 'http://localhost:3000'
      }
    })
  }, [])

  const disconnect = useCallback(async () => {
    await supabase.auth.signOut()
    setIsConnected(false)
    setUserName(null)
    setWalletAddress(null)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        userName,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}

export { formatAddress }
