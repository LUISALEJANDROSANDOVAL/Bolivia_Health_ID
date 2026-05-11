import { type ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { AppLayoutBase } from '@/components/ui/app-layout-base'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AppLayoutBase 
      SidebarComponent={Sidebar}
      NavbarComponent={Navbar}
    >
      {children}
    </AppLayoutBase>
  )
}
