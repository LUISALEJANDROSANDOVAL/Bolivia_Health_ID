'use client'

import { Menu, Bell, Settings, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/wallet-context'
import dynamic from 'next/dynamic'
const NotificationPanel = dynamic(
  () => import('@/components/notification-panel').then(m => m.NotificationPanel),
  { ssr: false, loading: () => <div className="h-11 w-11 rounded-xl bg-foreground/5 animate-pulse" /> }
)
import { useProfile } from '@/hooks/useProfile'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { isConnected, walletAddress, userName, connect, disconnect } = useWallet()
  const { profile } = useProfile(walletAddress)
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  const formatAddress = (addr: string | null) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

  const handleLogout = () => {
    disconnect()
    router.replace('/login')
  }

  const patientName = profile?.full_name || userName || 'Paciente'
  const patientWallet = walletAddress

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-11 w-11 text-foreground/60 hover:bg-foreground/10 hover:text-cyan-500 rounded-xl border border-transparent hover:border-border/50 transition-all"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-black text-foreground tracking-tight">
            Panel de <span className="text-cyan-500">Control</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-11 w-11 min-w-[44px] text-foreground/60 hover:bg-foreground/10 hover:text-cyan-500 rounded-xl border border-transparent hover:border-border/50 transition-all flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          
          <NotificationPanel userId={profile?.id || null} />
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={isConnected ? undefined : connect} 
              className={`h-11 px-6 bg-foreground text-background font-black rounded-xl transition-all shadow-lg shadow-black/5 flex items-center justify-center ${!isConnected ? 'hover:scale-105' : 'cursor-default'}`}
            >
              {isConnected ? (userName ?? formatAddress(walletAddress)) : "Conectar con Google"}
            </Button>

            {isConnected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-11 items-center gap-3 rounded-xl pl-1 pr-4 bg-foreground/5 hover:bg-foreground/10 transition-all border border-border/50 group">
                    <Avatar className="size-9 rounded-lg border border-white/10">
                      <AvatarFallback className="bg-gradient-electric text-azul-profundo font-black text-xs">
                        {patientName ? patientName.split(' ').map((n: string) => n[0]).join('') : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex flex-col items-start leading-none gap-0.5">
                      <span className="text-xs font-black text-foreground truncate max-w-[100px]">
                        {patientName ? patientName.split(' ')[0] : 'Paciente'}
                      </span>
                      <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">
                        Paciente
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl bg-background/95 backdrop-blur-xl border-border shadow-2xl">
                  <div className="px-3 py-3 bg-foreground/5 rounded-xl mb-2">
                    <p className="text-sm font-black text-foreground">{patientName}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1 select-all">
                      {patientWallet ? formatAddress(patientWallet) : 'Sin Billetera'}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem 
                    className="rounded-lg h-10 font-bold focus:bg-cyan-500/10 focus:text-cyan-500 cursor-pointer"
                    onClick={() => router.push('/configuracion')}
                  >
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    className="rounded-lg h-10 font-bold text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                    onClick={handleLogout}
                  >
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}