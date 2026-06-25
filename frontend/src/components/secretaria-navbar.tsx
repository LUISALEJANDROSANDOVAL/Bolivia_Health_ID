'use client'

import { Menu, Bell, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWallet } from '@/contexts/wallet-context'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

interface SecretariaNavbarProps {
  onMenuClick: () => void
}

export function SecretariaNavbar({ onMenuClick }: SecretariaNavbarProps) {
  const { disconnect, userName, isConnected } = useWallet()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleLogout = () => {
    disconnect()
    router.replace('/')
  }

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground/60 hover:bg-foreground/10 hover:text-amber-500"
            onClick={onMenuClick}
          >
            <Menu className="size-5" />
          </Button>
          <h2 className="text-lg font-black text-foreground tracking-tight">
            Módulo de <span className="text-amber-500">Recepción y Secretaría</span>
          </h2>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-11 w-11 text-foreground/60 hover:bg-foreground/10 hover:text-amber-500 rounded-xl border border-transparent hover:border-border/50 transition-all"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-11 items-center gap-3 rounded-xl pl-1 pr-4 bg-foreground/5 hover:bg-foreground/10 transition-all border border-border/50 group">
                <Avatar className="size-9 rounded-lg border border-white/10">
                  <AvatarFallback className="bg-gradient-electric text-azul-profundo font-black text-xs">
                    {userName ? userName.split(' ').map(n => n[0]).join('') : 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start leading-none gap-0.5">
                  <span className="text-xs font-black text-foreground truncate max-w-[120px]">
                    {userName ? userName.split(' ')[0] : 'Secretaría'}
                  </span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                    Personal Administrativo
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/50">
              <DropdownMenuItem onClick={handleLogout} className="text-rose-500 focus:text-rose-500 font-bold rounded-xl m-1 cursor-pointer">
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
