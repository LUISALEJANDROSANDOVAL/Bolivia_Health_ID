import { useEffect, useState } from 'react'
import { Shield, TrendingUp, Zap, Wallet, ShieldAlert, Key, ZapOff } from 'lucide-react'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { WelcomeBannerBase } from '@/components/ui/welcome-banner-base'
import { useWallet } from '@/contexts/wallet-context'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DoctorWelcomeBanner() {
  const { isDoctorAuthenticated, doctorName, doctorLicense, loading } = useDoctorAuth()
  const { isConnected, connect, walletAddress, sessionActive, startClinicalSession } = useWallet()
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [activating, setActivating] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)

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
        subtitle={isDoctorAuthenticated ? `Licencia: ${doctorLicense}` : isConnected ? `Wallet: ${walletAddress?.slice(0,6)}...${walletAddress?.slice(-4)}` : "Verificando identidad digital..."}
        stats={[
          { 
            label: 'Firma Silenciosa', 
            value: sessionActive ? 'Activa' : 'Inactiva', 
            icon: Zap,
            onClick: !sessionActive ? () => setShowActivationModal(true) : undefined,
            buttonText: !sessionActive ? 'Activar' : undefined
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
