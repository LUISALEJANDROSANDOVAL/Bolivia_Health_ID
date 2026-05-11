import { Shield, TrendingUp, Wallet } from 'lucide-react'
import { useWallet } from '@/contexts/wallet-context'
import { WelcomeBannerBase } from '@/components/ui/welcome-banner-base'

export function WelcomeBanner() {
  const { isConnected, userName, connect } = useWallet()

  return (
    <WelcomeBannerBase
      isAuthenticated={isConnected}
      actions={[
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
        { label: 'Seguridad', value: 'Máxima', icon: Shield }
      ]}
    />
  )
}