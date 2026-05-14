'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { MedicalStudies } from '@/components/medical-studies'

export default function EstudiosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <MedicalStudies />
      </div>
    </DashboardLayout>
  )
}
