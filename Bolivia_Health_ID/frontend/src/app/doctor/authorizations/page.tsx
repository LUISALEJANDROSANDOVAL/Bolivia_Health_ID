'use client'

import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, CheckCircle, XCircle, Clock } from 'lucide-react'

const authorizations = [
  {
    patient: 'Carlos Mendoza',
    type: 'Ver Historial Completo',
    status: 'Pendiente',
    requestDate: '2024-03-21',
    expiresIn: '7 días',
  },
  {
    patient: 'María García',
    type: 'Acceso a Laboratorios',
    status: 'Aprobado',
    requestDate: '2024-03-15',
    expiresIn: '30 días',
  },
  {
    patient: 'Juan Pérez',
    type: 'Prescribir Medicamentos',
    status: 'Rechazado',
    requestDate: '2024-03-10',
    expiresIn: 'Expirado',
  },
]

export default function DoctorAuthorizationsPage() {
  return (
    <DoctorLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Autorizaciones Web3</h1>
          <p className="text-muted-foreground">Centro de solicitudes de acceso con blockchain</p>
        </div>

        {/* Info Alert */}
        <Alert className="border-primary bg-primary/5">
          <Lock className="size-4 text-primary" />
          <AlertDescription>
            Aquí aparecen las solicitudes de acceso que has pedido a tus pacientes para ver sus historiales médicos.
            Cada aprobación se registra en blockchain para máxima transparencia.
          </AlertDescription>
        </Alert>

        {/* Authorizations List */}
        <div className="space-y-4">
          {authorizations.map((auth, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{auth.patient}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{auth.type}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Solicitado: {auth.requestDate}</p>
                      <p>Expira en: {auth.expiresIn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {auth.status === 'Pendiente' && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Clock className="size-3 mr-1" />
                        {auth.status}
                      </Badge>
                    )}
                    {auth.status === 'Aprobado' && (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="size-3 mr-1" />
                        {auth.status}
                      </Badge>
                    )}
                    {auth.status === 'Rechazado' && (
                      <Badge className="bg-red-100 text-red-800 border-red-300">
                        <XCircle className="size-3 mr-1" />
                        {auth.status}
                      </Badge>
                    )}
                  </div>
                </div>
                {auth.status === 'Pendiente' && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">Cancelar Solicitud</Button>
                    <Button size="sm" variant="outline">Recordar al Paciente</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DoctorLayout>
  )
}
