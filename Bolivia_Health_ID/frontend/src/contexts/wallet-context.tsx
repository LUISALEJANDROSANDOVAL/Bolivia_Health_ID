'use client'

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAccount, useDisconnect } from 'wagmi'
import { useModal } from 'connectkit'

interface WalletContextType {
  isConnected: boolean
  isDbConnected: boolean
  walletAddress: string | null
  userName: string | null
  connect: () => void
  connectDb: () => void
  disconnect: () => void
}

const defaultValue: WalletContextType = {
  isConnected: false,
  isDbConnected: false,
  walletAddress: null,
  userName: null,
  connect: () => {},
  connectDb: () => {},
  disconnect: () => {},
}

const WalletContext = createContext<WalletContextType>(defaultValue)

function formatAddress(address: string | null): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { setOpen } = useModal()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const syncProfile = useCallback(async (walletAddr: string) => {
    setLoading(true)
    try {
      const wallet = walletAddr.toLowerCase()

      // 1. Buscar perfil existente por wallet_address
      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', wallet)
        .single()

      if (!fetchError && existing) {
        setProfile(existing)
        return
      }

      // Solo crear si el error es "not found" (PGRST116)
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      // 2. Crear perfil — id se genera automáticamente (gen_random_uuid)
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert([{
          wallet_address: wallet,
          full_name: `Paciente ${walletAddr.slice(0, 6)}`,
          role: 'paciente'
        }])
        .select()
        .single()

      if (createError) throw createError

      setProfile(created)
    } catch (err) {
      console.error('Error sincronizando perfil:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isConnected && address) {
      syncProfile(address)
    } else {
      setProfile(null)
    }
  }, [isConnected, address, syncProfile])

  const userName = profile?.full_name || (isConnected && address ? `Paciente (${address.slice(0, 4)})` : null)

  const connect = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  const disconnect = useCallback(() => {
    try {
      wagmiDisconnect()
      setProfile(null)
    } catch (error) {
      console.error('Error al desconectar:', error)
    }
  }, [wagmiDisconnect])

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!isConnected,
        isDbConnected: !!profile,
        walletAddress: address || null,
        userName,
        connect,
        connectDb: connect,
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
