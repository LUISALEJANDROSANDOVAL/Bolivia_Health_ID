'use client'

import { FileText, Shield, Upload, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const activities = [
  {
    id: '1',
    type: 'access',
    title: 'Hospital Obrero accedió a tu historial',
    description: 'Consulta de emergencia - Área de cardiología',
    time: 'Hace 2 horas',
    icon: Eye,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    id: '2',
    type: 'upload',
    title: 'Archivo subido exitosamente',
    description: 'Análisis de sangre - Marzo 2026.pdf',
    time: 'Hace 5 horas',
    icon: Upload,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    id: '3',
    type: 'permission',
    title: 'Permiso otorgado a Clínica del Sur',
    description: 'Acceso de solo lectura por 6 meses',
    time: 'Hace 1 día',
    icon: Shield,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  {
    id: '4',
    type: 'record',
    title: 'Nuevo registro médico añadido',
    description: 'Control de presión arterial',
    time: 'Hace 2 días',
    icon: FileText,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-3">
              <div className="relative flex flex-col items-center">
                <div className={`flex size-10 items-center justify-center rounded-full ${activity.iconBg}`}>
                  <activity.icon className={`size-4 ${activity.iconColor}`} />
                </div>
                {index < activities.length - 1 && (
                  <div className="absolute top-10 h-full w-px bg-border" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
