'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface DoctorAuthContextType {
  isDoctorAuthenticated: boolean
  doctorWallet: string | null
  doctorName: string | null
  doctorLicense: string | null
  doctorConnect: () => void
  doctorDisconnect: () => void
}

const defaultValue: DoctorAuthContextType = {
  isDoctorAuthenticated: false,
  doctorWallet: null,
  doctorName: null,
  doctorLicense: null,
  doctorConnect: () => {},
  doctorDisconnect: () => {},
}

const DoctorAuthContext = createContext<DoctorAuthContextType>(defaultValue)

function generateDoctorWallet(): string {
  const chars = '0123456789abcdef'
  let address = '0x'
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)]
  }
  return address
}

export function DoctorAuthProvider({ children }: { children: ReactNode }) {
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState(false)
  const [doctorWallet, setDoctorWallet] = useState<string | null>(null)
  const [doctorName, setDoctorName] = useState<string | null>(null)
  const [doctorLicense, setDoctorLicense] = useState<string | null>(null)

  useEffect(() => {
    const savedDoctorWallet = localStorage.getItem('doctorWallet')
    const savedDoctorName = localStorage.getItem('doctorName')
    const savedDoctorLicense = localStorage.getItem('doctorLicense')

    if (savedDoctorWallet && savedDoctorName) {
      setDoctorWallet(savedDoctorWallet)
      setDoctorName(savedDoctorName)
      setDoctorLicense(savedDoctorLicense || '')
      setIsDoctorAuthenticated(true)
    }
  }, [])

  const doctorConnect = useCallback(() => {
    const wallet = generateDoctorWallet()
    const name = 'Dr. Luis Fernández'
    const license = 'LIC-BOL-2024-00815'

    setDoctorWallet(wallet)
    setDoctorName(name)
    setDoctorLicense(license)
    setIsDoctorAuthenticated(true)

    localStorage.setItem('doctorWallet', wallet)
    localStorage.setItem('doctorName', name)
    localStorage.setItem('doctorLicense', license)
  }, [])

  const doctorDisconnect = useCallback(() => {
    setDoctorWallet(null)
    setDoctorName(null)
    setDoctorLicense(null)
    setIsDoctorAuthenticated(false)

    localStorage.removeItem('doctorWallet')
    localStorage.removeItem('doctorName')
    localStorage.removeItem('doctorLicense')
  }, [])

  return (
    <DoctorAuthContext.Provider
      value={{
        isDoctorAuthenticated,
        doctorWallet,
        doctorName,
        doctorLicense,
        doctorConnect,
        doctorDisconnect,
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  )
}

export function useDoctorAuth() {
  return useContext(DoctorAuthContext)
}
