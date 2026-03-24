'use client'

import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'

const appointments = [
  { time: '09:00', patient: 'Carlos Mendoza', type: 'Consulta General', status: 'Confirmada' },
  { time: '10:30', patient: 'María García', type: 'Seguimiento', status: 'Confirmada' },
  { time: '12:00', patient: 'Juan Pérez', type: 'Cardiología', status: 'Pendiente' },
  { time: '14:00', patient: 'Ana López', type: 'Control', status: 'Confirmada' },
]

export default function DoctorAgendaPage() {
  return (
    <DoctorLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Agenda</h1>
          <p className="text-muted-foreground">Citas programadas y seguimiento de pacientes</p>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Citas de Hoy - 24 de Marzo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map((apt, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 font-mono text-lg font-bold text-primary min-w-fit">
                      <Clock className="size-5" />
                      {apt.time}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{apt.patient}</p>
                      <p className="text-sm text-muted-foreground">{apt.type}</p>
                    </div>
                  </div>
                  <Badge variant={apt.status === 'Confirmada' ? 'default' : 'secondary'}>
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" className="h-10">Nueva Cita</Button>
              <Button variant="outline" className="h-10">Exportar Agenda</Button>
              <Button variant="outline" className="h-10">Notificar Pacientes</Button>
              <Button variant="outline" className="h-10">Ver Calendario</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DoctorLayout>
  )
}
