'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon, Heart, X, LogOut, Activity, Shield, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

interface SidebarBaseProps {
  isOpen: boolean
  onClose: () => void
  navigationItems: NavItem[]
  onLogout: () => void
  userName?: string
  userSubtitle?: string
  panelTitle: string
  panelTagline: string
  footerTitle: string
  footerSubtitle: string
}

export function SidebarBase({
  isOpen,
  onClose,
  navigationItems,
  onLogout,
  panelTitle,
  panelTagline,
  footerTitle,
  footerSubtitle
}: SidebarBaseProps) {
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
        {/* Logo Area */}
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
                <span className="text-lg font-bold text-white uppercase tracking-tight">
                  {panelTitle}
                </span>
                <span className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">
                  {panelTagline}
                </span>
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

        {/* Quick Stats */}
        <div className="mx-4 mt-6 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Estado del Nodo</p>
              <p className="text-2xl font-black text-white">Activo</p>
            </div>
            <Activity className="size-8 text-white/20" />
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/10">
            <div className="h-1.5 w-[100%] rounded-full bg-gradient-electric shadow-lg shadow-cyan-500/20" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 mt-4 overflow-y-auto">
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
          
          <button
            onClick={onLogout}
            className="group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 text-white/70 hover:bg-destructive/20 hover:text-destructive-foreground mt-4"
          >
            <LogOut className="size-5 relative z-10" />
            <span className="relative z-10">Cerrar Sesión</span>
          </button>
        </nav>

        {/* Footer info */}
        <div className="m-4 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-electric shadow-lg shadow-cyan-500/20">
              <Shield className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white tracking-tight uppercase text-[10px]">{footerTitle}</p>
              <p className="text-[9px] text-white/40 font-medium truncate uppercase tracking-widest">{footerSubtitle}</p>
            </div>
            <Sparkles className="size-4 text-cyan-400 animate-pulse" />
          </div>
        </div>
      </aside>
    </>
  )
}
