import { DashboardLayout } from '@/components/dashboard-layout'
import { WelcomeBanner } from '@/components/welcome-banner'
import { HealthSummary } from '@/components/health-summary'
import { RecentActivity } from '@/components/recent-activity'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <WelcomeBanner />
        <HealthSummary />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">Estadísticas</h3>
            <p className="text-sm text-muted-foreground">Tu actividad en la plataforma</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Documentos Subidos</span>
                <span className="text-2xl font-bold text-foreground">12</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Permisos Activos</span>
                <span className="text-2xl font-bold text-foreground">3</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consultas Registradas</span>
                <span className="text-2xl font-bold text-foreground">8</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
