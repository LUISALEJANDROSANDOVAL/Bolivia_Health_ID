import { type ReactNode } from 'react'
import { DoctorSidebar } from '@/components/doctor-sidebar'
import { DoctorNavbar } from '@/components/doctor-navbar'
import { AppLayoutBase } from '@/components/ui/app-layout-base'

interface DoctorLayoutProps {
  children: ReactNode
}

export function DoctorLayout({ children }: DoctorLayoutProps) {
  return (
    <AppLayoutBase 
      SidebarComponent={DoctorSidebar}
      NavbarComponent={DoctorNavbar}
    >
      {children}
    </AppLayoutBase>
  )
}
