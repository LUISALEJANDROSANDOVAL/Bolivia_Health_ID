'use client'

import { Menu, Bell, Search, Moon, Sun } from 'lucide-react'
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
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

import { ConnectKitButton } from 'connectkit'

interface DoctorNavbarProps {
  onMenuClick: () => void
}

export function DoctorNavbar({ onMenuClick }: DoctorNavbarProps) {
  const { doctorWallet, doctorName, doctorDisconnect } = useDoctorAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const handleLogout = () => {
    doctorDisconnect()
    router.push('/doctor/login')
  }

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground/60 hover:bg-foreground/10 hover:text-cyan-500"
            onClick={onMenuClick}
          >
            <Menu className="size-5" />
          </Button>
          <h2 className="text-lg font-black text-foreground tracking-tight">
            Panel de <span className="text-cyan-500">Control Médico</span>
          </h2>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
            <Input
              placeholder="Buscar paciente (CI, Health ID o Wallet)"
              className="pl-10 bg-foreground/5 border-border/50 focus:border-cyan-500/50 rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-11 w-11 text-foreground/60 hover:bg-foreground/10 hover:text-cyan-500 rounded-xl border border-transparent hover:border-border/50 transition-all"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-11 w-11 text-foreground/60 hover:bg-foreground/10 hover:text-cyan-500 rounded-xl border border-transparent hover:border-border/50 transition-all"
          >
            <Bell className="size-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          </Button>
          
          <div className="hidden sm:block">
            <ConnectKitButton.Custom>
              {({ isConnected, isConnecting, show, address, ensName }) => (
                <Button 
                  onClick={show} 
                  className="h-11 px-6 bg-foreground text-background font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-black/5"
                >
                  {isConnected ? (ensName ?? formatAddress(address!)) : "Connect Wallet"}
                </Button>
              )}
            </ConnectKitButton.Custom>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-11 items-center gap-3 rounded-xl pl-1 pr-4 bg-foreground/5 hover:bg-foreground/10 transition-all border border-border/50 group">
                <Avatar className="size-9 rounded-lg border border-white/10">
                  <AvatarFallback className="bg-gradient-electric text-azul-profundo font-black text-xs">
                    {doctorName?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start leading-none gap-0.5">
                  <span className="text-xs font-black text-foreground truncate max-w-[100px]">{doctorName?.split(' ')[0]}</span>
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">Dr. Verificado</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl bg-background/95 backdrop-blur-xl border-border shadow-2xl">
              <div className="px-3 py-3 bg-foreground/5 rounded-xl mb-2">
                <p className="text-sm font-black text-foreground">{doctorName}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-1 select-all">{doctorWallet && formatAddress(doctorWallet)}</p>
              </div>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem className="rounded-lg h-10 font-bold focus:bg-cyan-500/10 focus:text-cyan-500">Mi Perfil</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg h-10 font-bold focus:bg-cyan-500/10 focus:text-cyan-500">Configuración</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                className="rounded-lg h-10 font-bold text-destructive focus:bg-destructive/10 focus:text-destructive"
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

