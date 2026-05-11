'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Lock,
  Settings,
  LogOut,
  Heart,
  X,
  Pill,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { useRouter } from 'next/navigation'

interface DoctorSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/doctor',
    icon: LayoutDashboard,
  },
  {
    title: 'Pacientes',
    href: '/doctor/patients',
    icon: Users,
  },
  {
    title: 'Recetas',
    href: '/doctor/prescriptions',
    icon: Pill,
  },
  {
    title: 'Agenda',
    href: '/doctor/agenda',
    icon: Calendar,
  },
  {
    title: 'Autorizaciones Web3',
    href: '/doctor/authorizations',
    icon: Lock,
  },
  {
    title: 'Ajustes',
    href: '/doctor/settings',
    icon: Settings,
  },
]

export function DoctorSidebar({ isOpen, onClose }: DoctorSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { doctorDisconnect } = useDoctorAuth()

  const handleLogout = () => {
    doctorDisconnect()
    router.push('/doctor/login')
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sidebar-primary/20 p-2">
              <Heart className="size-5 text-sidebar-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">Bolivia Health ID</h1>
              <p className="text-xs text-sidebar-foreground/60">Panel Médico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-sidebar-accent/20 lg:hidden"
          >
            <X className="size-5 text-sidebar-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`w-full rounded-lg px-4 py-3 flex items-center gap-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
                  }`}
                >
                  <Icon className="size-5" />
                  {item.title}
                </button>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>
    </>
  )
}
