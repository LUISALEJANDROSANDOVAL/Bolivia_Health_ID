'use client'

import { FileText, Shield, Upload, Eye, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const activities = [
  {
    id: '1',
    type: 'access',
    title: 'Acceso a tu historial',
    description: 'Hospital Obrero - Cardiología',
    time: 'Hace 2 horas',
    icon: Eye,
    iconBg: 'bg-azul-hielo',
    iconColor: 'text-azul-electrico',
    href: '/historial',
  },
  {
    id: '2',
    type: 'upload',
    title: 'Archivo subido',
    description: 'Análisis de sangre - Marzo 2026.pdf',
    time: 'Hace 5 horas',
    icon: Upload,
    iconBg: 'bg-turquesa/10',
    iconColor: 'text-turquesa',
    href: '/registros',
  },
  {
    id: '3',
    type: 'permission',
    title: 'Permiso otorgado',
    description: 'Clínica del Sur - Acceso de lectura',
    time: 'Hace 1 día',
    icon: Shield,
    iconBg: 'bg-violeta/10',
    iconColor: 'text-violeta',
    href: '/permisos',
  },
  {
    id: '4',
    type: 'record',
    title: 'Nuevo registro médico',
    description: 'Control de presión arterial',
    time: 'Hace 2 días',
    icon: FileText,
    iconBg: 'bg-gris-perla',
    iconColor: 'text-gris-grafito',
    href: '/registros',
  },
]

export function RecentActivity() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-azul-profundo">Actividad Reciente</h2>
          <p className="text-sm text-gris-grafito">Lo último en tu cuenta</p>
        </div>
        <Link href="/historial" className="text-sm text-azul-electrico hover:text-azul-profundo flex items-center gap-1">
          Ver historial completo <ChevronRight className="size-4" />
        </Link>
      </div>
      
      <div className="card-premium p-5">
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <Link key={activity.id} href={activity.href} className="block group">
              <div className="flex gap-3">
                <div className="relative">
                  <div className={`flex size-10 items-center justify-center rounded-full ${activity.iconBg}`}>
                    <activity.icon className={`size-4 ${activity.iconColor}`} />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="absolute top-10 left-1/2 h-full w-px -translate-x-1/2 bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-azul-profundo group-hover:text-azul-electrico transition-colors">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gris-grafito">
                      <Clock className="size-3" />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gris-grafito mt-1">{activity.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}