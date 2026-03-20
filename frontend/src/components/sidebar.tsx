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
  Pill
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Historial Médico',
    href: '/historial',
    icon: ClipboardList,
  },
  {
    title: 'Medicamentos',
    href: '/medicamentos',
    icon: Pill,
  },
  {
    title: 'Mis Registros',
    href: '/registros',
    icon: FileText,
  },
  {
    title: 'Permisos',
    href: '/permisos',
    icon: Shield,
  },
  {
    title: 'Subir Archivos',
    href: '/subir',
    icon: Upload,
  },
  {
    title: 'Configuración',
    href: '/configuracion',
    icon: Settings,
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
              <Heart className="size-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Bolivia Health ID</span>
              <span className="text-xs text-muted-foreground">Sistema Descentralizado</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="size-5" />
            <span className="sr-only">Cerrar menú</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn(
                  'size-5',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="rounded-lg bg-accent/50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <Shield className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Datos Protegidos</p>
                <p className="text-xs text-muted-foreground">Cifrado End-to-End</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
