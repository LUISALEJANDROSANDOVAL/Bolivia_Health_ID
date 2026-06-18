'use client'

import { Menu, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { useRouter } from 'next/navigation'

interface DoctorNavbarProps {
  onMenuClick: () => void
}

export function DoctorNavbar({ onMenuClick }: DoctorNavbarProps) {
  const { doctorWallet, doctorName, doctorDisconnect } = useDoctorAuth()
  const router = useRouter()

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const handleLogout = () => {
    doctorDisconnect()
    router.push('/doctor/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-secondary lg:hidden"
        >
          <Menu className="size-5 text-foreground" />
        </button>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente (CI, Health ID o Wallet)"
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5 text-foreground" />
            <span className="absolute top-1 right-1 size-2 bg-destructive rounded-full" />
          </Button>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
            <div className="size-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-foreground">Polygon</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-lg p-2 hover:bg-secondary">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {doctorName?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold text-foreground">{doctorName}</p>
                <p className="text-xs text-muted-foreground">{doctorWallet && formatAddress(doctorWallet)}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
