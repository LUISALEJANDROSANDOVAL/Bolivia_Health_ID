'use client'

import React, { useState, type ReactNode } from 'react'

interface AppLayoutBaseProps {
  children: ReactNode
  SidebarComponent: React.ComponentType<{ isOpen: boolean; onClose: () => void }>
  NavbarComponent: React.ComponentType<{ onMenuClick: () => void }>
}

export function AppLayoutBase({ children, SidebarComponent, NavbarComponent }: AppLayoutBaseProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <NavbarComponent onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
