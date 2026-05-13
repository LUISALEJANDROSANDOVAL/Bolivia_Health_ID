'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useWallet } from '@/contexts/wallet-context'
import { supabase } from '@/lib/supabase'

interface DoctorAuthContextType {
  isDoctorAuthenticated: boolean
  doctorWallet: string | null
  doctorName: string | null
  doctorLicense: string | null
  doctorId: string | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const defaultValue: DoctorAuthContextType = {
  isDoctorAuthenticated: false,
  doctorWallet: null,
  doctorName: null,
  doctorLicense: null,
  doctorId: null,
  loading: false,
  refreshProfile: async () => {},
}

const DoctorAuthContext = createContext<DoctorAuthContextType>(defaultValue)

export function DoctorAuthProvider({ children }: { children: ReactNode }) {
  const { walletAddress: address, isConnected } = useWallet()
  const [doctorName, setDoctorName] = useState<string | null>(null)
  const [doctorLicense, setDoctorLicense] = useState<string | null>(null)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchDoctorProfile = useCallback(async (walletAddr: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddr.toLowerCase())
        .single()

      if (data && data.role === 'medico') {
        setDoctorName(data.full_name)
        setDoctorId(data.id)
        // Usamos la cédula o un campo de licencia si existe, si no, uno por defecto
        setDoctorLicense(data.cedula_identidad || 'LIC-BOL-ACTIVA')
        setIsDoctorAuthenticated(true)
      } else {
        setIsDoctorAuthenticated(false)
        setDoctorName(null)
        setDoctorId(null)
        setDoctorLicense(null)
      }
    } catch (err) {
      console.error('Error al verificar perfil de doctor:', err)
      setIsDoctorAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isConnected && address) {
      fetchDoctorProfile(address)
    } else {
      setIsDoctorAuthenticated(false)
      setDoctorName(null)
      setDoctorLicense(null)
    }
  }, [isConnected, address, fetchDoctorProfile])

  return (
    <DoctorAuthContext.Provider
      value={{
        isDoctorAuthenticated,
        doctorWallet: address || null,
        doctorName,
        doctorLicense,
        doctorId,
        loading,
        refreshProfile: async () => { if (address) await fetchDoctorProfile(address) }
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  )
}

export function useDoctorAuth() {
  return useContext(DoctorAuthContext)
}
