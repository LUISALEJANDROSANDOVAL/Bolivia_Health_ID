'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  FileText, 
  Shield, 
  Settings,
  Upload,
  X,
  Heart,
  ClipboardList,
  Pill,
  Sparkles,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Historial Médico', href: '/historial', icon: ClipboardList },
  { title: 'Medicamentos', href: '/medicamentos', icon: Pill },
  { title: 'Mis Registros', href: '/registros', icon: FileText },
  { title: 'Permisos', href: '/permisos', icon: Shield },
  { title: 'Subir Archivos', href: '/subir', icon: Upload },
  { title: 'Configuración', href: '/configuracion', icon: Settings },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-80 flex-col bg-gradient-premium shadow-2xl transition-all duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-electric opacity-20" />
          <div className="relative flex h-24 items-center justify-between border-b border-white/20 px-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                <div className="relative flex size-12 items-center justify-center rounded-xl bg-white/20">
                  <Heart className="size-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">
                  Bolivia Health ID
                </span>
                <span className="text-xs text-white/60">Sistema Descentralizado</span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="mx-4 mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Salud General</p>
              <p className="text-xl font-bold text-white">92%</p>
            </div>
            <Activity className="size-8 text-white/40" />
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/20">
            <div className="h-1.5 w-[92%] rounded-full bg-gradient-electric" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 mt-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-white/50">
            Menú Principal
          </p>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 overflow-hidden',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-electric opacity-20" />
                )}
                <item.icon className={cn(
                  'size-5 relative z-10',
                  isActive ? 'text-white' : 'text-white/70'
                )} />
                <span className="relative z-10">{item.title}</span>
                {isActive && (
                  <div className="absolute right-0 h-full w-1 bg-white rounded-l-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="m-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-electric">
              <Shield className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Protección Activa</p>
              <p className="text-xs text-white/60">Cifrado End-to-End</p>
            </div>
            <Sparkles className="size-4 text-white/40 animate-pulse" />
          </div>
        </div>
      </aside>
    </>
  )
}