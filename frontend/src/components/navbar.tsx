'use client'

import { Menu, Bell, Settings, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/wallet-context'
import { NotificationPanel } from '@/components/notification-panel'
import { useProfile } from '@/hooks/useProfile'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { isConnected, walletAddress, userName, connect } = useWallet()
  const { profile } = useProfile(walletAddress)

  useEffect(() => setMounted(true), [])

  const formatAddress = (addr: string | null) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

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
          
          <div className="flex items-center">
            <Button 
              onClick={isConnected ? undefined : connect} 
              className={`h-11 px-6 bg-foreground text-background font-black rounded-xl transition-all shadow-lg shadow-black/5 flex items-center justify-center ${!isConnected ? 'hover:scale-105' : 'cursor-default'}`}
            >
              {isConnected ? (userName ?? formatAddress(walletAddress)) : "Conectar con Google"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}