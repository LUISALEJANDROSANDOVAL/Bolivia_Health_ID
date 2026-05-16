'use client'

import { type ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DoctorSidebar } from '@/components/doctor-sidebar'
import { DoctorNavbar } from '@/components/doctor-navbar'
import { AppLayoutBase } from '@/components/ui/app-layout-base'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { Loader2 } from 'lucide-react'

interface DoctorLayoutProps {
  children: ReactNode
}

export function DoctorLayout({ children }: DoctorLayoutProps) {
  const router = useRouter()
  const { approvalStatus, loading, isDoctorAuthenticated } = useDoctorAuth()

  useEffect(() => {
    if (!loading && isDoctorAuthenticated && approvalStatus && approvalStatus !== 'approved') {
      router.push('/verificando')
    }
  }, [approvalStatus, loading, isDoctorAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AppLayoutBase 
      SidebarComponent={DoctorSidebar}
      NavbarComponent={DoctorNavbar}
    >
      {children}
    </AppLayoutBase>
  )
}
