import { 
  LayoutDashboard, 
  FileText, 
  Shield, 
  Settings,
  Upload,
  ClipboardList,
  Pill,
  Stethoscope,
  FlaskConical,
  CalendarCheck
} from 'lucide-react'
import { useWallet } from '@/contexts/wallet-context'
import { SidebarBase, NavItem } from '@/components/ui/sidebar-base'
import { useRouter } from 'next/navigation'

const navigationItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Mis Citas', href: '/citas', icon: CalendarCheck },
  { title: 'Línea del Tiempo', href: '/historial', icon: ClipboardList },
  { title: 'Medicamentos', href: '/medicamentos', icon: Pill },
  { title: 'Mis Diagnósticos', href: '/diagnosticos', icon: Stethoscope },
  { title: 'Mis Estudios', href: '/estudios', icon: FlaskConical },
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
  const router = useRouter()

  return (
    <SidebarBase
      isOpen={isOpen}
      onClose={onClose}
      navigationItems={navigationItems}
      onLogout={() => {
        onClose()
        disconnect()
        router.replace('/')
      }}
      panelTitle="Bolivia Health ID"
      panelTagline="Sistema Descentralizado"
      footerTitle="Protección Activa"
      footerSubtitle={userName || 'Registros Seguros'}
      homeHref="/dashboard"
    />
  )
}