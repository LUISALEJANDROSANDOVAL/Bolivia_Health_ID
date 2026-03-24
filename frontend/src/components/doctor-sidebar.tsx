import {
  LayoutDashboard,
  Users,
  Calendar,
  Lock,
  Settings,
  Pill,
} from 'lucide-react'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { useRouter } from 'next/navigation'
import { SidebarBase, NavItem } from '@/components/ui/sidebar-base'

const navigationItems: NavItem[] = [
  { title: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
  { title: 'Pacientes', href: '/doctor/patients', icon: Users },
  { title: 'Recetas', href: '/doctor/prescriptions', icon: Pill },
  { title: 'Agenda', href: '/doctor/agenda', icon: Calendar },
  { title: 'Autorizaciones Web3', href: '/doctor/authorizations', icon: Lock },
  { title: 'Configuración', href: '/doctor/settings', icon: Settings },
]

interface DoctorSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function DoctorSidebar({ isOpen, onClose }: DoctorSidebarProps) {
  const router = useRouter()
  const { doctorDisconnect, doctorLicense } = useDoctorAuth()

  const handleLogout = () => {
    doctorDisconnect()
    router.push('/doctor/login')
    onClose()
  }

  return (
    <SidebarBase
      isOpen={isOpen}
      onClose={onClose}
      navigationItems={navigationItems}
      onLogout={handleLogout}
      panelTitle="Bolivia Health ID"
      panelTagline="Panel Médico"
      footerTitle="Cifrado Activo"
      footerSubtitle={doctorLicense || 'Verified'}
    />
  )
}

