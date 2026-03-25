import { TrendingUp, Star, Wallet, UserCircle } from 'lucide-react'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { WelcomeBannerBase } from '@/components/ui/welcome-banner-base'
import { useWallet } from '@/contexts/wallet-context'

export function DoctorWelcomeBanner() {
  const { isDoctorAuthenticated, doctorName, doctorLicense, doctorConnect } = useDoctorAuth()
  const { connect: patientConnect } = useWallet()

  return (
    <WelcomeBannerBase
      isAuthenticated={isDoctorAuthenticated}
      actions={[
        { label: 'Ingresar como Doctor', onClick: doctorConnect, icon: UserCircle },
        { label: 'Conectar Wallet', onClick: patientConnect, icon: Wallet, variant: 'secondary' }
      ]}
      tagline="Panel Médico Descentralizado"
      title={isDoctorAuthenticated ? (
        <>Buen día, <br /><span className="opacity-90">{doctorName || 'Doctor'}</span></>
      ) : (
        <>Acceso Profesional <br /><span className="opacity-90">Bolivia Health ID</span></>
      )}
      description="Gestiona historiales médicos de forma segura con tecnología blockchain. Privacidad total para tus pacientes."
      subtitle={`Licencia: ${doctorLicense || 'Verificando...'}`}
      stats={[
        { label: 'Calificación', value: '4.9/5', icon: Star },
        { label: 'Atenciones', value: '+250', icon: TrendingUp }
      ]}
    />
  )
}
