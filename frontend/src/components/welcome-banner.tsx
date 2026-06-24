'use client'

import { useState, useEffect } from 'react'
import { Shield, TrendingUp, Wallet, Download } from 'lucide-react'
import { useWallet } from '@/contexts/wallet-context'
import { WelcomeBannerBase } from '@/components/ui/welcome-banner-base'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { generatePatientHistoryPDF } from '@/lib/pdf-helper'

export function WelcomeBanner() {
  const { isConnected, isDbConnected, walletAddress, userName, connect } = useWallet()
  const { toast } = useToast()
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    if (walletAddress && isDbConnected) {
      supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfileData(data)
        })
    }
  }, [walletAddress, isDbConnected])

  // Evaluar parámetros de seguridad para Paciente
  let securityScore = 0
  if (isConnected) {
    securityScore += 20 // Billetera conectada
    if (profileData?.email) securityScore += 20 // Email configurado
    if (profileData?.identity_verified) securityScore += 20 // Identidad verificada (SEGIP)
    if (profileData?.preferences?.security?.twoFAEnabled !== false) securityScore += 20 // 2FA activo
    if (profileData?.preferences?.security?.biometricEnabled === true) securityScore += 20 // Biometría facial/dactilar activa
  }

  const handleDownloadHistory = async () => {
    if (!walletAddress) return

    try {
      // 1. Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, cedula_identidad')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (!profile) return

      // 2. Get medical history
      const { data: history } = await supabase
        .from('medical_background')
        .select('*')
        .eq('patient_id', profile.id)
        .not('doctor_id', 'is', null)
        .order('created_at', { ascending: false })

      // Fetch doctor profiles
      const doctorIds = [...new Set((history || []).map(r => r.doctor_id).filter(Boolean))]
      let doctorMap: Record<string, any> = {}
      if (doctorIds.length > 0) {
        const { data: doctors } = await supabase
          .from('profiles_public')
          .select('id, full_name, specialty')
          .in('id', doctorIds)
        if (doctors) {
          doctorMap = Object.fromEntries(doctors.map(d => [d.id, d]))
        }
      }

      // Fetch patient medications
      const { data: medications } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', profile.id)

      // Format records
      const formattedRecords = (history || []).map((r: any) => {
        const ipfsMatch = (r.description || '').match(/IPFS:\s*([a-zA-Z0-9]+)/)
        const txMatch = (r.description || '').match(/Tx:\s*(0x[a-fA-F0-9]+)/)
        const docInfo = doctorMap[r.doctor_id]
        
        // Filter medications
        const dateStr = r.date_recorded || (r.created_at ? r.created_at.split('T')[0] : '')
        const itemMeds = (medications || []).filter((m: any) => {
          if (r.diagnosis_id) return m.diagnosis_id === r.diagnosis_id
          return m.start_date === dateStr
        })

        return {
          title: r.title,
          date: new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
          category: r.category || 'consulta',
          doctor: docInfo?.full_name || 'Médico del Sistema',
          doctorSpecialty: docInfo?.specialty,
          description: r.description || '',
          medications: itemMeds,
          ipfsHash: ipfsMatch ? ipfsMatch[1] : null,
          txHash: txMatch ? txMatch[1] : null
        }
      })

      const blob = await generatePatientHistoryPDF({
        patientName: profile.full_name || 'Paciente',
        patientCi: profile.cedula_identidad || 'N/A',
        records: formattedRecords
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial_clinico_${profile.full_name ? profile.full_name.replace(/\s+/g, '_') : 'paciente'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Descarga completada',
        description: 'Tu historial clínico ha sido exportado en PDF correctamente.',
      })
    } catch (error) {
      console.error('Error downloading history:', error)
      toast({
        title: 'Error de descarga',
        description: 'No se pudo generar el reporte médico.',
        variant: 'destructive'
      })
    }
  }

  return (
    <WelcomeBannerBase
      isAuthenticated={isConnected}
      actions={isConnected ? [
        { label: 'Descargar Historial', onClick: handleDownloadHistory, icon: Download, variant: 'secondary' }
      ] : [
        { label: 'Conectar Wallet', onClick: connect, icon: Wallet }
      ]}
      tagline="Blockchain Health Identity"
      title={isConnected ? (
        <>Hola, <br /><span className="opacity-90">{userName?.split(' ')[0] || 'Usuario'}</span></>
      ) : (
        <>Bienvenido a <br /><span className="opacity-90">Bolivia Health ID</span></>
      )}
      description="Tu identidad de salud descentralizada gestionada por tu propia Wallet. Seguridad inquebrantable para tus registros médicos."
      subtitle="Tu historial médico está sincronizado y protegido en la red Avalanche Fuji."
      stats={[
        { label: 'Cumplimiento', value: '98%', icon: TrendingUp },
        { label: 'Seguridad', value: isConnected ? `${securityScore}%` : '0%', icon: Shield }
      ]}
    />
  )
}