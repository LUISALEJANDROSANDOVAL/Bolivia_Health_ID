import { TrendingUp, Star, Wallet, ShieldAlert } from 'lucide-react'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { WelcomeBannerBase } from '@/components/ui/welcome-banner-base'
import { useWallet } from '@/contexts/wallet-context'

export function DoctorWelcomeBanner() {
  const { isDoctorAuthenticated, doctorName, doctorLicense, loading } = useDoctorAuth()
  const { isConnected, connect, walletAddress } = useWallet()

  // Si está conectado pero no es doctor, mostramos una advertencia
  const isNotDoctor = isConnected && !isDoctorAuthenticated && !loading

  return (
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
        { label: 'Calificación', value: '4.9/5', icon: Star },
        { label: 'Atenciones', value: '+250', icon: TrendingUp }
      ]}
    />
  )
}
