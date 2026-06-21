import {
  Building2,
  UsersRound,
  LayoutDashboard
} from 'lucide-react'
import { useWallet } from '@/contexts/wallet-context'
import { SidebarBase, NavItem } from '@/components/ui/sidebar-base'
import { useRouter } from 'next/navigation'

const navigationItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Sucursales', href: '/admin/sucursales', icon: Building2 },
  { title: 'Doctores', href: '/admin/doctores', icon: UsersRound },
]

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
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
      panelTitle="Administración"
      panelTagline="Bolivia Health ID"
      footerTitle="Panel Central"
      footerSubtitle={userName || 'Administrador'}
    />
  )
}
