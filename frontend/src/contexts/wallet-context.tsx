'use client'

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAccount, useDisconnect } from 'wagmi'
import { useModal } from 'connectkit'
import { ParticleNetwork } from '@particle-network/auth'
import { ParticleProvider } from '@particle-network/provider'

let particle: ParticleNetwork | null = null;
let particleProvider: ParticleProvider | null = null;

if (typeof window !== 'undefined') {
  const projectId = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID;
  const clientKey = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY;
  const appId = process.env.NEXT_PUBLIC_PARTICLE_APP_ID;

  if (projectId && clientKey && appId) {
    try {
      particle = new ParticleNetwork({
        projectId,
        clientKey,
        appId,
        chainName: 'Avalanche',
        chainId: 43113,
        wallet: {
          displayWalletEntry: false, // Oculta el botón flotante de "Rendering..."
        }
      });
      particleProvider = new ParticleProvider(particle.auth);
    } catch (error) {
      console.error('Error initializing Particle Network:', error);
    }
  } else {
    console.warn('Particle Network environment variables are missing. Social login will be disabled.');
  }
}

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
  const [particleAddress, setParticleAddress] = useState<string | null>(null)
  const [particleConnected, setParticleConnected] = useState(false)
  const [particleUserInfo, setParticleUserInfo] = useState<{email?: string, name?: string} | null>(null)

  const syncProfile = useCallback(async (walletAddr: string, email?: string, name?: string) => {
    setLoading(true)
    try {
      const wallet = walletAddr.toLowerCase()

      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', wallet)
        .single()

      if (!fetchError && existing) {
        let needsUpdate = false;
        const updates: any = {};
        if (!existing.email && email) {
          updates.email = email;
          existing.email = email;
          needsUpdate = true;
        }
        if (name && existing.full_name?.startsWith('Paciente 0x')) {
          updates.full_name = name;
          existing.full_name = name;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await supabase.from('profiles').update(updates).eq('id', existing.id);
        }

        setProfile(existing)
        return
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      // Si no existe, usamos upsert por seguridad (evita errores de duplicidad en carreras de estado)
      const newFullName = name || `Paciente ${walletAddr.slice(0, 6)}`;
      const { data: profileData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          wallet_address: wallet,
          full_name: newFullName,
          email: email || null,
          role: 'paciente'
        }, { 
          onConflict: 'wallet_address',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (upsertError) throw upsertError

      setProfile(profileData)
    } catch (err) {
      console.error('Error sincronizando perfil:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (particle && particleProvider && particle.auth.isLogin()) {
      particleProvider.request({ method: 'eth_accounts' }).then((accounts: any) => {
        if (accounts && accounts.length > 0) {
          const userInfo: any = particle!.auth.getUserInfo();
          if (userInfo) {
            setParticleUserInfo({
              email: userInfo.google_email || userInfo.email || null,
              name: userInfo.name || null
            });
          }
          setParticleAddress(accounts[0]);
          setParticleConnected(true);
        }
      }).catch(console.error);
    }
  }, []);

  const activeAddress = particleAddress || address;
  const activeIsConnected = particleConnected || isConnected;

  useEffect(() => {
    if (activeIsConnected && activeAddress) {
      syncProfile(activeAddress, particleUserInfo?.email, particleUserInfo?.name)
    } else {
      setProfile(null)
    }
  }, [activeIsConnected, activeAddress, syncProfile, particleUserInfo])

  const userName = profile?.full_name || (activeIsConnected && activeAddress ? `Paciente (${activeAddress.slice(0, 4)})` : null)

  const connect = useCallback(async () => {
    if (particle && particleProvider) {
      try {
        const userInfo: any = await particle.auth.login({ preferredAuthType: 'google' });
        const accounts: any = await particleProvider.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          if (userInfo) {
            setParticleUserInfo({
              email: userInfo.google_email || userInfo.email || null,
              name: userInfo.name || null
            });
          }
          setParticleAddress(accounts[0]);
          setParticleConnected(true);
        }
      } catch (error) {
        console.error('Error logging in with Particle:', error);
      }
    } else {
      setOpen(true);
    }
  }, [setOpen])

  const disconnect = useCallback(async () => {
    try {
      if (particle && particleConnected) {
        await particle.auth.logout();
        setParticleConnected(false);
        setParticleAddress(null);
        setParticleUserInfo(null);
      }
      wagmiDisconnect()
      setProfile(null)
    } catch (error) {
      console.error('Error al desconectar:', error)
    }
  }, [wagmiDisconnect, particleConnected])

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!activeIsConnected,
        isDbConnected: !!profile,
        walletAddress: activeAddress || null,
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
