import { DashboardLayout } from '@/components/dashboard-layout'
import { MedicalRecords } from '@/components/medical-records'

export default function RegistrosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Registros Médicos</h1>
          <p className="text-sm text-muted-foreground">
            Todos tus documentos y registros de salud en un solo lugar
          </p>
        </div>
        <MedicalRecords />
      </div>
    </DashboardLayout>
  )
}
