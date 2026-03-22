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

  // Sync profile with Supabase based on wallet address
  const syncProfile = useCallback(async (walletAddr: string) => {
    setLoading(true)
    try {
      // 1. Check if profile exists
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddr.toLowerCase())
        .single()

      if (error && error.code === 'PGRST116') {
        // 2. Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            { 
              wallet_address: walletAddr.toLowerCase(),
              full_name: `Paciente ${walletAddr.slice(0, 6)}`,
              role: 'patient'
            }
          ])
          .select()
          .single()

        if (createError) throw createError
        data = newProfile
      } else if (error) {
        throw error
      }

      setProfile(data)
    } catch (err) {
      console.error('Error syncing profile:', err)
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

  const userName = profile?.full_name || (isConnected && address ? `Usuario (${address.slice(0, 4)})` : null)

  const connect = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  const disconnect = useCallback(async () => {
    try {
      wagmiDisconnect()
      setProfile(null)
      // Note: We don't call signOut() since we're not using Supabase Auth (OAuth/Email)
      // but instead using Wallet as the identity filter.
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }, [wagmiDisconnect])

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!isConnected,
        isDbConnected: !!profile, // Profile presence acts as DB connection
        walletAddress: address || null,
        userName,
        connect,
        connectDb: connect, // Redundant now, both point to wallet connect
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
