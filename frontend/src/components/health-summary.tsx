'use client'

import { Droplet, AlertTriangle, Calendar, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const healthData = {
  bloodType: 'O+',
  allergies: ['Penicilina', 'Mariscos', 'Polen'],
  lastVisit: {
    date: '15 Mar, 2026',
    type: 'Control General',
    doctor: 'Dr. Roberto Mendoza',
    location: 'Hospital Obrero, La Paz',
  },
  vitals: {
    heartRate: '72 bpm',
    bloodPressure: '120/80',
    weight: '68 kg',
  },
}

export function HealthSummary() {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Resumen de Salud</h2>
        <p className="text-sm text-muted-foreground">Tu información médica más importante</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Blood Type Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tipo de Sangre
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
              <Droplet className="size-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{healthData.bloodType}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Compatible con O+, O-
            </p>
          </CardContent>
        </Card>

        {/* Allergies Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alergias
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="size-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {healthData.allergies.map((allergy) => (
                <Badge
                  key={allergy}
                  variant="destructive"
                  className="text-xs"
                >
                  {allergy}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {healthData.allergies.length} alergias registradas
            </p>
          </CardContent>
        </Card>

        {/* Last Visit Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última Consulta
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-foreground">
              {healthData.lastVisit.date}
            </div>
            <p className="text-sm text-muted-foreground">{healthData.lastVisit.type}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {healthData.lastVisit.doctor}
            </p>
          </CardContent>
        </Card>

        {/* Vitals Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Signos Vitales
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
              <Activity className="size-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pulso:</span>
                <span className="font-medium text-foreground">{healthData.vitals.heartRate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">P. Arterial:</span>
                <span className="font-medium text-foreground">{healthData.vitals.bloodPressure}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Peso:</span>
                <span className="font-medium text-foreground">{healthData.vitals.weight}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
