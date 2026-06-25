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
  doctorSpecialty: string | null
  doctorHospital: string | null
  doctorBranches: string[]
  approvalStatus: 'pending' | 'approved' | 'rejected' | null
  identityVerified: boolean
  licenseVerified: boolean
  loading: boolean
  refreshProfile: () => Promise<void>
  doctorDisconnect: () => void
}

const defaultValue: DoctorAuthContextType = {
  isDoctorAuthenticated: false,
  doctorWallet: null,
  doctorName: null,
  doctorLicense: null,
  doctorId: null,
  doctorSpecialty: null,
  doctorHospital: null,
  doctorBranches: [],
  approvalStatus: null,
  identityVerified: false,
  licenseVerified: false,
  loading: false,
  refreshProfile: async () => {},
  doctorDisconnect: () => {},
}

const DoctorAuthContext = createContext<DoctorAuthContextType>(defaultValue)

export function DoctorAuthProvider({ children }: { children: ReactNode }) {
  const { walletAddress: address, isConnected, disconnect } = useWallet()
  const [doctorName, setDoctorName] = useState<string | null>(null)
  const [doctorLicense, setDoctorLicense] = useState<string | null>(null)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [doctorSpecialty, setDoctorSpecialty] = useState<string | null>(null)
  const [doctorHospital, setDoctorHospital] = useState<string | null>(null)
  const [doctorBranches, setDoctorBranches] = useState<string[]>([])
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [identityVerified, setIdentityVerified] = useState(false)
  const [licenseVerified, setLicenseVerified] = useState(false)
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)

  const doctorDisconnect = useCallback(() => {
    disconnect()
    setIsDoctorAuthenticated(false)
    setDoctorName(null)
    setDoctorId(null)
    setDoctorHospital(null)
    setDoctorBranches([])
  }, [disconnect])

  const fetchDoctorProfile = useCallback(async (walletAddr: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, hospitals(name)')
        .eq('wallet_address', walletAddr.toLowerCase())
        .single()

      if (data && data.role === 'medico') {
        setDoctorName(data.full_name)
        setDoctorId(data.id)
        setDoctorSpecialty(data.specialty || 'General')
        setDoctorLicense(data.license_number || data.cedula_identidad || 'PENDIENTE')
        setApprovalStatus(data.approval_status)
        setIdentityVerified(data.identity_verified || false)
        setLicenseVerified(data.license_verified || false)
        setDoctorHospital(data.hospitals?.name || 'Hospital del Sistema')

        // Cargar sucursales del doctor
        const { data: sucs } = await supabase
          .from('doctor_sucursal')
          .select('sucursales(name)')
          .eq('doctor_id', data.id)
        
        const branchNames = sucs?.map((s: any) => s.sucursales?.name).filter(Boolean) || []
        setDoctorBranches(branchNames)
        setIsDoctorAuthenticated(true)
      } else {
        setIsDoctorAuthenticated(false)
        setDoctorName(null)
        setDoctorId(null)
        setDoctorSpecialty(null)
        setDoctorLicense(null)
        setApprovalStatus(null)
        setIdentityVerified(false)
        setLicenseVerified(false)
        setDoctorHospital(null)
        setDoctorBranches([])
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

      // Suscripción en tiempo real para detectar cuando los triggers validan al doctor
      const channel = supabase
        .channel(`profile_changes_${address.toLowerCase()}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `wallet_address=eq.${address.toLowerCase()}`
          },
          (payload) => {
            if (payload.new) {
              const updated = payload.new
              setDoctorName(updated.full_name)
              setDoctorSpecialty(updated.specialty || 'General')
              setDoctorLicense(updated.license_number || updated.cedula_identidad || 'PENDIENTE')
              setApprovalStatus(updated.approval_status)
              setIdentityVerified(updated.identity_verified || false)
              setLicenseVerified(updated.license_verified || false)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } else {
      setIsDoctorAuthenticated(false)
      setDoctorName(null)
      setDoctorLicense(null)
      setDoctorId(null)
      setDoctorSpecialty(null)
      setApprovalStatus(null)
      setIdentityVerified(false)
      setLicenseVerified(false)
      setDoctorHospital(null)
      setDoctorBranches([])
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
        doctorSpecialty,
        doctorHospital,
        doctorBranches,
        approvalStatus,
        identityVerified,
        licenseVerified,
        loading,
        refreshProfile: async () => { if (address) await fetchDoctorProfile(address) },
        doctorDisconnect
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  )
}

export function useDoctorAuth() {
  return useContext(DoctorAuthContext)
}
