'use client'

import { useState, type ReactNode } from 'react'
import { DoctorSidebar } from '@/components/doctor-sidebar'
import { DoctorNavbar } from '@/components/doctor-navbar'

interface DoctorLayoutProps {
  children: ReactNode
}

export function DoctorLayout({ children }: DoctorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <DoctorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
