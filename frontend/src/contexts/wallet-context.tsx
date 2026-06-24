'use client'

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAccount, useDisconnect, useSignMessage } from 'wagmi'
import { useModal } from 'connectkit'
import { ParticleNetwork } from '@particle-network/auth'
import { ParticleProvider } from '@particle-network/provider'
import { stringToHex } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { toast } from 'sonner'

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
  role: 'paciente' | 'medico' | null
  connect: () => void
  connectDb: () => void
  disconnect: () => void
  signMessage: (message: string) => Promise<string>
  sessionActive: boolean
  sessionAddress: string | null
  startClinicalSession: (useMock?: boolean) => Promise<void>
  signMessageWithSession: (message: string) => Promise<{ signature: string, sessionAddress: string, sessionAuthSignature: string }>
}

const defaultValue: WalletContextType = {
  isConnected: false,
  isDbConnected: false,
  walletAddress: null,
  userName: null,
  role: null,
  connect: () => {},
  connectDb: () => {},
  disconnect: () => {},
  signMessage: async () => '',
  sessionActive: false,
  sessionAddress: null,
  startClinicalSession: async (useMock?: boolean) => {},
  signMessageWithSession: async () => ({ signature: '', sessionAddress: '', sessionAuthSignature: '' }),
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
  const { signMessageAsync } = useSignMessage()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [particleAddress, setParticleAddress] = useState<string | null>(null)
  const [particleConnected, setParticleConnected] = useState(false)
  const [particleUserInfo, setParticleUserInfo] = useState<{email?: string, name?: string} | null>(null)

  const [sessionActive, setSessionActive] = useState(false)
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)

  const syncProfile = useCallback(async (walletAddr: string, email?: string, name?: string) => {
    setLoading(true)
    try {
      const wallet = walletAddr.toLowerCase()
      const emailAuth = `${wallet}@boliviahealth.com`
      const passwordAuth = `${wallet}_boliviahealth_secure_2026!`

      // A. Silent Auth Sign-In / Sign-Up determinista
      let { error: authError } = await supabase.auth.signInWithPassword({
        email: emailAuth,
        password: passwordAuth
      })

      if (authError && authError.message.toLowerCase().includes('invalid login credentials')) {
        // Registrar usuario si no existe en Supabase Auth
        const { error: signUpError } = await supabase.auth.signUp({
          email: emailAuth,
          password: passwordAuth
        })
        if (!signUpError) {
          const signInRes = await supabase.auth.signInWithPassword({
            email: emailAuth,
            password: passwordAuth
          })
          if (signInRes.error) {
            console.error('Error in secondary sign-in:', signInRes.error)
          }
        } else {
          console.error('Error signing up deterministic user:', signUpError)
        }
      } else if (authError) {
        console.error('Error signing in deterministic user:', authError)
      }

      // B. Sincronización de Perfil Público en Supabase
      // 1. Buscamos primero por wallet_address
      let { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', wallet)
        .single()

      if (fetchError && fetchError.code === 'PGRST116' && email) {
        // 2. Si no existe por wallet, buscamos por email (caso de médicos pre-registrados)
        const { data: existingByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email.toLowerCase())
          .single()
        
        if (existingByEmail) {
          // Encontramos un médico pre-registrado, actualizamos su wallet_address placeholder con el real
          await supabase.from('profiles').update({ wallet_address: wallet }).eq('id', existingByEmail.id);
          existing = { ...existingByEmail, wallet_address: wallet };
          fetchError = null;
        }
      }

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
    } catch (err: any) {
      console.error('Error sincronizando perfil:', err.message || JSON.stringify(err) || err)
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
    // Si ya está conectado, no permitir abrir el modal de login de nuevo
    if (activeIsConnected) return;

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
      } catch (error: any) {
        console.error('--- ERROR PARTICLE (FULL) ---')
        console.log(JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      }
    } else {
      setOpen(true);
    }
  }, [activeIsConnected, setOpen])

  const disconnect = useCallback(async () => {
    try {
      if (activeAddress) {
        const addrLower = activeAddress.toLowerCase()
        localStorage.removeItem(`clinical_session_key_${addrLower}`)
        localStorage.removeItem(`clinical_session_sig_${addrLower}`)
        localStorage.removeItem(`clinical_session_addr_${addrLower}`)
        localStorage.removeItem(`clinical_session_exp_${addrLower}`)
      }
      setSessionActive(false)
      setSessionAddress(null)
      
      // Cerrar sesión en Supabase Auth silenciosamente
      await supabase.auth.signOut()

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
  }, [wagmiDisconnect, particleConnected, activeAddress])

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (particleConnected && particleProvider && particleAddress) {
      try {
        const hexMsg = stringToHex(message)
        const signature = await particleProvider.request({
          method: 'personal_sign',
          params: [hexMsg, particleAddress]
        })
        if (typeof signature === 'string') {
          return signature
        }
        throw new Error('Firma con formato inválido devuelta por el proveedor social')
      } catch (err: any) {
        console.error('Error firmando con Particle Network:', err)
        throw err
      }
    }

    if (isConnected) {
      try {
        const signature = await signMessageAsync({ message })
        return signature
      } catch (err: any) {
        console.error('Error firmando con Wagmi/Wallet:', err)
        throw err
      }
    }

    throw new Error('No hay ninguna billetera conectada para realizar la firma digital.')
  }, [particleConnected, particleAddress, isConnected, signMessageAsync])

  // --- CONFIGURACIÓN DE LLAVES DE SESIÓN ---

  // Las llaves de sesión se gestionan dinámicamente abajo para poder usar startClinicalSession

  const startClinicalSession = useCallback(async (useMock = false) => {
    if (!activeAddress) {
      toast.error('Error de Identidad', {
        description: 'Debes conectar tu billetera antes de iniciar la sesión clínica.'
      })
      throw new Error('Debes conectar tu billetera.')
    }
    
    try {
      const privateKey = generatePrivateKey()
      const tempAccount = privateKeyToAccount(privateKey)
      const tempAddress = tempAccount.address

      let signature = ''
      if (useMock) {
        signature = `mock_session_auth_${tempAddress.toLowerCase()}`
      } else {
        const messageAuth = `Autorizar sesión clínica de Bolivia Health ID para la billetera temporal: ${tempAddress}`
        toast.info('Blockchain', {
          description: 'Por favor, firma la autorización para habilitar el modo de consulta rápida...'
        })
        signature = await signMessage(messageAuth)
      }

      const addrLower = activeAddress.toLowerCase()
      const expTime = (Date.now() + 24 * 60 * 60 * 1000).toString() // 24 horas

      localStorage.setItem(`clinical_session_key_${addrLower}`, privateKey)
      localStorage.setItem(`clinical_session_sig_${addrLower}`, signature)
      localStorage.setItem(`clinical_session_addr_${addrLower}`, tempAddress)
      localStorage.setItem(`clinical_session_exp_${addrLower}`, expTime)

      setSessionAddress(tempAddress)
      setSessionActive(true)

      toast.success('Sesión Blockchain Iniciada', {
        description: useMock 
          ? 'Modo rápido activado localmente. Las firmas serán automáticas y sin ventanas.'
          : 'La sesión se autorizó con éxito. Las firmas ahora serán automáticas y silenciosas durante las próximas 24 horas.'
      })
    } catch (err: any) {
      console.error('Error al iniciar sesión clínica:', err)
      toast.error('Inicio de Sesión Cancelado', {
        description: err.message || 'No se pudo firmar el inicio de turno.'
      })
      throw err
    }
  }, [activeAddress, signMessage])

  // Restaurar sesión activa o iniciarla en background (modo rápido) al iniciar sesión o conectar la wallet
  useEffect(() => {
    if (activeIsConnected && activeAddress) {
      const addrLower = activeAddress.toLowerCase()
      const privateKey = localStorage.getItem(`clinical_session_key_${addrLower}`)
      const sessionAuthSignature = localStorage.getItem(`clinical_session_sig_${addrLower}`)
      const cachedSessionAddr = localStorage.getItem(`clinical_session_addr_${addrLower}`)
      const expiration = localStorage.getItem(`clinical_session_exp_${addrLower}`)

      if (privateKey && sessionAuthSignature && cachedSessionAddr && expiration) {
        if (Date.now() < parseInt(expiration)) {
          setSessionAddress(cachedSessionAddr)
          setSessionActive(true)
          return
        } else {
          // Limpiar datos expirados
          localStorage.removeItem(`clinical_session_key_${addrLower}`)
          localStorage.removeItem(`clinical_session_sig_${addrLower}`)
          localStorage.removeItem(`clinical_session_addr_${addrLower}`)
          localStorage.removeItem(`clinical_session_exp_${addrLower}`)
        }
      }

      // Auto-iniciar la sesión clínica silenciosa (modo rápido local) sin pedir popups
      startClinicalSession(true).catch((err) => {
        console.error('Error auto-starting clinical session:', err)
      })
    } else {
      setSessionAddress(null)
      setSessionActive(false)
    }
  }, [activeIsConnected, activeAddress, startClinicalSession])

  const signMessageWithSession = useCallback(async (message: string) => {
    if (!activeAddress) {
      throw new Error('Billetera no conectada.')
    }
    const addrLower = activeAddress.toLowerCase()
    const privateKey = localStorage.getItem(`clinical_session_key_${addrLower}`)
    const sessionAuthSignature = localStorage.getItem(`clinical_session_sig_${addrLower}`)
    const cachedSessionAddr = localStorage.getItem(`clinical_session_addr_${addrLower}`)
    const expiration = localStorage.getItem(`clinical_session_exp_${addrLower}`)

    if (!privateKey || !sessionAuthSignature || !cachedSessionAddr || !expiration) {
      throw new Error('No hay una sesión clínica activa. Debes iniciar turno.')
    }

    if (Date.now() >= parseInt(expiration)) {
      localStorage.removeItem(`clinical_session_key_${addrLower}`)
      localStorage.removeItem(`clinical_session_sig_${addrLower}`)
      localStorage.removeItem(`clinical_session_addr_${addrLower}`)
      localStorage.removeItem(`clinical_session_exp_${addrLower}`)
      setSessionActive(false)
      setSessionAddress(null)
      throw new Error('La sesión clínica ha expirado. Por favor, inicia turno nuevamente.')
    }

    const tempAccount = privateKeyToAccount(privateKey as `0x${string}`)
    const signature = await tempAccount.signMessage({ message })

    return {
      signature,
      sessionAddress: cachedSessionAddr,
      sessionAuthSignature
    }
  }, [activeAddress])

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!activeIsConnected,
        isDbConnected: !!profile,
        walletAddress: activeAddress || null,
        userName,
        role: profile?.role || null,
        connect,
        connectDb: connect,
        disconnect,
        signMessage,
        sessionActive,
        sessionAddress,
        startClinicalSession,
        signMessageWithSession,
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


