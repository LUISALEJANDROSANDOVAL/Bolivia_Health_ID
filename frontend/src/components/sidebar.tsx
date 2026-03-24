import { 
  LayoutDashboard, 
  FileText, 
  Shield, 
  Settings,
  Upload,
  ClipboardList,
  Pill,
} from 'lucide-react'
import { useWallet } from '@/contexts/wallet-context'
import { SidebarBase, NavItem } from '@/components/ui/sidebar-base'

const navigationItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Historial Médico', href: '/historial', icon: ClipboardList },
  { title: 'Medicamentos', href: '/medicamentos', icon: Pill },
  { title: 'Mis Registros', href: '/registros', icon: FileText },
  { title: 'Permisos', href: '/permisos', icon: Shield },
  { title: 'Subir Archivos', href: '/subir', icon: Upload },
  { title: 'Configuración', href: '/configuracion', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { disconnect, userName } = useWallet()

  return (
    <SidebarBase
      isOpen={isOpen}
      onClose={onClose}
      navigationItems={navigationItems}
      onLogout={() => {
        disconnect()
        onClose()
      }}
      panelTitle="Bolivia Health ID"
      panelTagline="Sistema Descentralizado"
      footerTitle="Protección Activa"
      footerSubtitle={userName || 'Registros Seguros'}
    />
  )
}