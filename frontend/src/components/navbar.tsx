'use client'

import { Menu, Bell, User, Settings, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-30 border-b border-plomo bg-negro-profundo/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gris-texto hover:bg-plomo hover:text-dorado"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-white">
            Panel de <span className="text-dorado">Control</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-gris-texto hover:bg-plomo hover:text-dorado"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <Button variant="ghost" size="icon" className="relative text-gris-texto hover:bg-plomo hover:text-dorado">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-dorado" />
          </Button>
          
          <div className="ml-2 flex items-center gap-2 rounded-full bg-dorado/10 p-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dorado">
              <User className="h-4 w-4 text-negro-profundo" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}