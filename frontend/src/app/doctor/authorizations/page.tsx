'use client'

import { useState } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Shield, FileText, Users, Key, Activity, Send } from 'lucide-react'

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

const authStats = [
  {
    icon: Users,
    label: 'Total Solicitudes',
    value: '15',
    description: 'Histórico completo',
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  {
    icon: CheckCircle,
    label: 'Aprobadas',
    value: '12',
    description: 'Acceso activo',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50'
  },
  {
    icon: Clock,
    label: 'Pendientes',
    value: '2',
    description: 'En espera de respuesta',
    color: 'text-amber-500',
    bg: 'bg-amber-50'
  },
  {
    icon: XCircle,
    label: 'Rechazadas',
    value: '1',
    description: 'Acceso denegado',
    color: 'text-red-500',
    bg: 'bg-red-50'
  }
]

export default function DoctorAuthorizationsPage() {
  return (
    <DoctorLayout>
      <div className="space-y-8 animate-slide-in p-6">
        
        {/* Header con icono y gradiente */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Autorizaciones Web3</h1>
              <p className="text-sm text-gris-grafito">
                Centro de solicitudes de acceso registradas en blockchain
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {authStats.map((stat, idx) => (
              <Card key={idx} className="card-premium p-4 hover:border-azul-electrico/30 transition-all">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl p-2 ${stat.bg}`}>
                      <stat.icon className={`size-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-azul-profundo">{stat.value}</p>
                    <p className="text-xs text-gris-grafito mt-0.5">{stat.label}</p>
                    <p className="text-xs text-gris-grafito/60 mt-0.5">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Banner principal */}
        <div className="bg-gradient-electric rounded-2xl p-5 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10">
            <div className="text-9xl">🔐</div>
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg" />
                <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white/20 to-white/10">
                  <Key className="size-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Acceso Seguro a Historiales</h3>
                <p className="text-sm text-white/80 mt-1">
                  Pide acceso a nuevos pacientes. Cada aprobación queda registrada en la blockchain para máxima transparencia.
                </p>
              </div>
            </div>
            <Button className="bg-white text-azul-electrico hover:bg-white/90">
              <Send className="size-4 mr-2" />
              Nueva Solicitud
            </Button>
          </div>
        </div>

        {/* Authorizations List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-azul-profundo">Solicitudes Recientes</h3>
          {authorizations.map((auth, i) => (
            <Card key={i} className="card-premium hover:border-azul-electrico/30 transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-slate-100 p-3">
                      <FileText className="size-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-azul-profundo">{auth.patient}</h3>
                      <p className="text-sm text-gris-grafito mb-2">{auth.type}</p>
                      <div className="flex items-center gap-4 text-xs text-gris-grafito/80">
                        <span className="flex items-center gap-1"><Clock className="size-3" /> Solicitado: {auth.requestDate}</span>
                        <span className="flex items-center gap-1"><Activity className="size-3" /> Expira: {auth.expiresIn}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-3">
                    {auth.status === 'Pendiente' && (
                      <Badge className="bg-amber-100/50 text-amber-700 border-amber-200">
                        <Clock className="size-3 mr-1" /> {auth.status}
                      </Badge>
                    )}
                    {auth.status === 'Aprobado' && (
                      <Badge className="bg-emerald-100/50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="size-3 mr-1" /> {auth.status}
                      </Badge>
                    )}
                    {auth.status === 'Rechazado' && (
                      <Badge className="bg-red-100/50 text-red-700 border-red-200">
                        <XCircle className="size-3 mr-1" /> {auth.status}
                      </Badge>
                    )}
                    
                    {auth.status === 'Pendiente' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs hover:bg-slate-100">Cancelar</Button>
                        <Button size="sm" className="btn-premium py-1 h-8 text-xs">Recordar</Button>
                      </div>
                    )}
                    {auth.status === 'Aprobado' && (
                      <Button size="sm" className="btn-outline-premium py-1 h-8 text-xs">Ver Historial</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DoctorLayout>
  )
}
