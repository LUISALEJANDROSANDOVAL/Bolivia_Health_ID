'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Limpiar sesiones previas para forzar el inicio de sesión
    localStorage.removeItem('doctorWallet')
    localStorage.removeItem('patientSession')
    
    // Ir al login general
    router.replace('/login')
  }, [router])

  return null
}