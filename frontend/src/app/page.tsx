'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { WelcomeBanner } from '@/components/welcome-banner'
import { HealthSummary } from '@/components/health-summary'
import { RecentActivity } from '@/components/recent-activity'
import { QuickActions } from '@/components/quick-actions'
import { UpcomingAppointments } from '@/components/upcoming-appointments'
import { HealthTips } from '@/components/health-tips'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-in">
        {/* Banner de bienvenida */}
        <WelcomeBanner />
        
        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Acciones rápidas */}
            <QuickActions />
            
            {/* Resumen de salud */}
            <HealthSummary />
            
            {/* Próximas citas */}
            <UpcomingAppointments />
          </div>
          
          {/* Columna derecha - 1/3 */}
          <div className="space-y-6">
            {/* Actividad reciente */}
            <RecentActivity />
            
            {/* Tips de salud */}
            <HealthTips />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}