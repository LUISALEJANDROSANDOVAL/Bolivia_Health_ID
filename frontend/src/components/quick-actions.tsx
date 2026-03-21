'use client'

import { 
  FileUp, 
  PlusCircle, 
  Calendar, 
  Share2, 
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

const actions = [
  {
    title: 'Subir Registro',
    description: 'Añade un nuevo documento médico',
    icon: FileUp,
    href: '/subir',           // ✅ Conecta a página de subir archivos
    color: 'from-azul-electrico to-turquesa',
    bgColor: 'bg-azul-hielo',
    iconColor: 'text-azul-electrico'
  },
  {
    title: 'Agregar Medicamento',
    description: 'Registra tu medicación actual',
    icon: PlusCircle,
    href: '/medicamentos',     // ✅ Conecta a página de medicamentos
    color: 'from-violeta to-azul-electrico',
    bgColor: 'bg-violeta/10',
    iconColor: 'text-violeta'
  },
  {
    title: 'Ver Historial',
    description: 'Consulta tu historial médico',
    icon: Calendar,
    href: '/historial',        // ✅ Conecta a página de historial
    color: 'from-coral to-azul-electrico',
    bgColor: 'bg-coral/10',
    iconColor: 'text-coral'
  },
  {
    title: 'Compartir Acceso',
    description: 'Da permisos a un médico',
    icon: Share2,
    href: '/permisos',         // ✅ Conecta a página de permisos
    color: 'from-turquesa to-azul-electrico',
    bgColor: 'bg-turquesa/10',
    iconColor: 'text-turquesa'
  }
]

export function QuickActions() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-azul-profundo">Acciones Rápidas</h2>
          <p className="text-sm text-gris-grafito">Realiza las tareas más comunes</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group card-premium p-5 cursor-pointer hover:border-azul-electrico/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-xl ${action.bgColor} p-3`}>
                <action.icon className={`size-6 ${action.iconColor}`} />
              </div>
              <ArrowRight className="size-4 text-gris-grafito/40 group-hover:text-azul-electrico transition-colors" />
            </div>
            <h3 className="mt-4 font-semibold text-azul-profundo">{action.title}</h3>
            <p className="mt-1 text-xs text-gris-grafito">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}