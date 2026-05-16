import { Shield, TrendingUp, Wallet, Download } from 'lucide-react'
import { useWallet } from '@/contexts/wallet-context'
import { WelcomeBannerBase } from '@/components/ui/welcome-banner-base'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export function WelcomeBanner() {
  const { isConnected, walletAddress, userName, connect } = useWallet()
  const { toast } = useToast()

  const handleDownloadHistory = async () => {
    if (!walletAddress) return

    try {
      // 1. Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (!profile) return

      // 2. Get medical history
      const { data: history } = await supabase
        .from('medical_background')
        .select('*')
        .eq('patient_id', profile.id)

      // 3. Create and download file
      const report = {
        patient: profile.full_name,
        date: new Date().toLocaleDateString(),
        records: history || []
      }

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial_medico_${walletAddress.slice(0, 6)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Descarga completada',
        description: 'Tu historial médico ha sido exportado correctamente.',
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
        { label: 'Seguridad', value: 'Máxima', icon: Shield }
      ]}
    />
  )
}