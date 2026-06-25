import { useEffect, useState } from 'react'
import { Shield, TrendingUp, Zap, Wallet, ShieldAlert, Key, ZapOff, FileText } from 'lucide-react'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { WelcomeBannerBase } from '@/components/ui/welcome-banner-base'
import { useWallet } from '@/contexts/wallet-context'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { generateDoctorActivityPDF } from '@/lib/pdf-helper'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DoctorWelcomeBanner() {
  const { isDoctorAuthenticated, doctorName, doctorLicense, doctorHospital, doctorBranches, loading } = useDoctorAuth()
  const { isConnected, connect, walletAddress, sessionActive, startClinicalSession } = useWallet()
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [activating, setActivating] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (walletAddress) {
      supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfileData(data)
        })
    }
  }, [walletAddress])

  // Evaluar parámetros de seguridad para Doctor
  let securityScore = 0
  if (isConnected) {
    securityScore += 20 // Billetera conectada
    if (profileData?.email) securityScore += 20 // Email configurado
    if (profileData?.identity_verified) securityScore += 20 // Identidad verificada (SEGIP)
    if (profileData?.license_verified) securityScore += 20 // Licencia SEDES verificada
    if (sessionActive) securityScore += 20 // Firma Silenciosa (llave de sesión) activa
  }

  // Si está conectado pero no es doctor, mostramos una advertencia
  const isNotDoctor = isConnected && !isDoctorAuthenticated && !loading

  const handleActivate = async (useMock: boolean) => {
    setActivating(true)
    try {
      await startClinicalSession(useMock)
      setShowActivationModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setActivating(false)
    }
  }

  const handleDownloadDoctorActivity = async () => {
    if (!walletAddress || !isDoctorAuthenticated) return

    setDownloadingPdf(true)
    try {
      const { data: docProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (!docProfile) throw new Error('No se pudo encontrar tu perfil de médico')

      const { data: records, error } = await supabase
        .from('medical_background')
        .select('*')
        .eq('doctor_id', docProfile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const tempRecords = records || []
      const patientIds = [...new Set(tempRecords.map((r: any) => r.patient_id).filter(Boolean))]
      
      let patientMap: Record<string, any> = {}
      if (patientIds.length > 0) {
        const { data: patients } = await supabase
          .from('profiles_public')
          .select('id, full_name, cedula_identidad')
          .in('id', patientIds)
        if (patients) {
          patientMap = Object.fromEntries(patients.map(p => [p.id, p]))
        }
      }

      const enrichedRecords = tempRecords.map((r: any) => {
        const ipfsMatch = (r.description || '').match(/IPFS:\s*([a-zA-Z0-9]+)/)
        const txMatch = (r.description || '').match(/Tx:\s*(0x[a-fA-F0-9]+)/)
        const pat = patientMap[r.patient_id]
        return {
          title: r.title,
          date: new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          patientName: pat?.full_name || 'Paciente',
          patientCi: pat?.cedula_identidad || 'N/A',
          txHash: txMatch ? txMatch[1] : null,
          ipfsHash: ipfsMatch ? ipfsMatch[1] : null
        }
      })

      const blob = await generateDoctorActivityPDF({
        doctorName: doctorName || 'Doctor',
        doctorLicense: doctorLicense || 'N/A',
        doctorWallet: walletAddress,
        records: enrichedRecords
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_firmas_medicas_${doctorName ? doctorName.replace(/\s+/g, '_') : 'doctor'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Reporte generado',
        description: 'El historial de tus firmas médicas ha sido descargado en PDF.',
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Error de reporte',
        description: err.message || 'No se pudo generar el reporte PDF.',
        variant: 'destructive'
      })
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <>
      <WelcomeBannerBase
        isAuthenticated={isDoctorAuthenticated}
        actions={!isConnected ? [
          { label: 'Conectar Wallet de Doctor', onClick: connect, icon: Wallet }
        ] : isNotDoctor ? [
          { label: 'Cambiar de Cuenta', onClick: connect, icon: ShieldAlert, variant: 'secondary' }
        ] : []}
        tagline="Panel Médico Descentralizado"
        title={isDoctorAuthenticated ? (
          <>Buen día, <br /><span className="opacity-90">{doctorName || 'Doctor'}</span></>
        ) : isNotDoctor ? (
          <>Acceso Restringido <br /><span className="opacity-90 text-red-400">Perfil no Médico</span></>
        ) : (
          <>Acceso Profesional <br /><span className="opacity-90">Bolivia Health ID</span></>
        )}
        description={isNotDoctor 
          ? "Esta wallet no está registrada como profesional médico en el sistema. Por favor, conecta tu wallet autorizada."
          : "Gestiona historiales médicos de forma segura con tecnología blockchain. Privacidad total para tus pacientes."
        }
        subtitle={isDoctorAuthenticated ? `Licencia: ${doctorLicense} | Hospital: ${doctorHospital || 'General'} | Sedes: ${doctorBranches && doctorBranches.length > 0 ? doctorBranches.join(', ') : 'Ninguna'}` : isConnected ? `Wallet: ${walletAddress?.slice(0,6)}...${walletAddress?.slice(-4)}` : "Verificando identidad digital..."}
        stats={[
          { 
            label: 'Historial de Firmas', 
            value: downloadingPdf ? '...' : 'PDF', 
            icon: FileText,
            onClick: handleDownloadDoctorActivity,
            buttonText: downloadingPdf ? 'Generando...' : 'Descargar Historial'
          },
          { label: 'Seguridad', value: isConnected ? `${securityScore}%` : '0%', icon: Shield }
        ]}
      />

      <Dialog open={showActivationModal} onOpenChange={setShowActivationModal}>
        <DialogContent className="max-w-md rounded-2xl bg-background/95 backdrop-blur-xl border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-500 animate-pulse" />
              Activar Firma Silenciosa
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Habilita la emisión rápida de recetas con un solo clic. Selecciona cómo prefieres autorizar la sesión:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Opción 1: Criptográfica */}
            <div className="p-4 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 rounded-2xl transition-all group flex flex-col gap-3">
              <div className="flex gap-2.5 items-start">
                <div className="p-2 bg-cyan-500/15 text-cyan-400 rounded-lg">
                  <Key className="size-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Firma Criptográfica (Web3)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Requiere una firma única de tu billetera Particle (Google). Otorga validez legal y criptográfica en la red Avalanche Fuji.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => handleActivate(false)} 
                disabled={activating}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl h-10 border-none transition-all shadow-md mt-1"
              >
                {activating ? 'Procesando...' : 'Autorizar con Wallet'}
              </Button>
            </div>

            {/* Opción 2: Modo Local Rápido */}
            <div className="p-4 bg-foreground/[0.02] hover:bg-foreground/[0.04] border border-border/50 rounded-2xl transition-all flex flex-col gap-3">
              <div className="flex gap-2.5 items-start">
                <div className="p-2 bg-foreground/5 text-muted-foreground rounded-lg">
                  <ZapOff className="size-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Activar Modo Rápido (Local/Prueba)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bypassea el popup de firma. Habilita firmas locales instantáneas en segundo plano de manera fluida y sin ventanas adicionales.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => handleActivate(true)} 
                disabled={activating}
                variant="outline"
                className="w-full border-border hover:bg-foreground/5 font-bold rounded-xl h-10 transition-all text-foreground"
              >
                Activar Modo Rápido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
