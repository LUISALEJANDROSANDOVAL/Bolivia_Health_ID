import { DashboardLayout } from '@/components/dashboard-layout'
import { MedicalRecords } from '@/components/medical-records'

export default function RegistrosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <MedicalRecords />
      </div>
    </DashboardLayout>
  )
}
