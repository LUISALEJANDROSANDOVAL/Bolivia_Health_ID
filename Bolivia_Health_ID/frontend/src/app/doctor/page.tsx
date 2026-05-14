'use client'

import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, AlertCircle, Share2, TrendingUp } from 'lucide-react'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'

export default function DoctorDashboard() {
  const { doctorName, doctorLicense } = useDoctorAuth()

  const stats = [
    {
      title: 'Pacientes Citados Hoy',
      value: '8',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Solicitudes Pendientes',
      value: '3',
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Accesos Concedidos',
      value: '24',
      icon: Share2,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Diagnósticos Firmados (Hoy)',
      value: '5',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <DoctorLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Bienvenido, {doctorName}</h1>
          <p className="text-muted-foreground">Panel de Control - {doctorLicense}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                      <Icon className={`size-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Gestiona tus pacientes y registros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Button className="h-12 text-base" variant="outline">
                  <Users className="mr-2 size-5" />
                  Ver Pacientes
                </Button>
                <Button className="h-12 text-base" variant="outline">
                  <Clock className="mr-2 size-5" />
                  Programar Cita
                </Button>
                <Button className="h-12 text-base" variant="outline">
                  <AlertCircle className="mr-2 size-5" />
                  Solicitudes
                </Button>
                <Button className="h-12 text-base" variant="outline">
                  <Share2 className="mr-2 size-5" />
                  Compartir Acceso
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Status */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Red</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-foreground">Conectado a Polygon</span>
              </div>
              <div className="rounded-lg bg-secondary p-3 text-xs">
                <p className="text-muted-foreground mb-2">Smart Contract Status</p>
                <p className="font-mono text-foreground">0x2d7f...f9a2</p>
              </div>
              <Button variant="outline" className="w-full text-xs">
                Cambiar Red
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Acceso otorgado a paciente {i}
                    </p>
                    <p className="text-xs text-muted-foreground">Hace {i} horas</p>
                  </div>
                  <Badge variant="outline">Completado</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DoctorLayout>
  )
}
