'use client'

import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
} from 'lucide-react'
import { useWallet } from '@/contexts/wallet-context'
import { useRouter } from 'next/navigation'
import { SidebarBase, NavItem } from '@/components/ui/sidebar-base'

const navigationItems: NavItem[] = [
  { title: 'Agenda y Citas', href: '/secretaria', icon: LayoutDashboard },
]

interface SecretariaSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function SecretariaSidebar({ isOpen, onClose }: SecretariaSidebarProps) {
  const router = useRouter()
  const { disconnect, userName } = useWallet()

  const handleLogout = () => {
    onClose()
    disconnect()
    router.replace('/')
  }

  return (
    <SidebarBase
      isOpen={isOpen}
      onClose={onClose}
      navigationItems={navigationItems}
      onLogout={handleLogout}
      panelTitle="Bolivia Health ID"
      panelTagline="Personal Administrativo"
      footerTitle="Módulo Recepción"
      footerSubtitle={userName || 'Secretaría'}
      homeHref="/secretaria"
    />
  )
}
