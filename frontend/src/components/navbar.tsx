'use client'

import { Menu, Bell, ChevronDown, LogOut } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWallet, formatAddress } from '@/contexts/wallet-context'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { isConnected, walletAddress, userName, connect, disconnect } = useWallet()

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">BH</span>
          </div>
          <span className="font-semibold text-foreground">Bolivia Health ID</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isConnected && (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              3
            </span>
            <span className="sr-only">Notificaciones</span>
          </Button>
        )}

        {/* Standard Web3 Connect Button */}
        <div className="ml-2">
          <ConnectKitButton />
        </div>
      </div>
    </header>
  )
}
