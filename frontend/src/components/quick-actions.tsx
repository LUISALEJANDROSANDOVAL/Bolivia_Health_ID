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
    <div className="animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Acciones Rápidas</h2>
          <p className="text-sm text-foreground/50 font-bold uppercase tracking-widest">Atajos de salud</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group relative overflow-hidden bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-3xl border border-border hover:border-cyan-500/20 transition-all hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1 shadow-lg shadow-black/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={`rounded-xl bg-foreground/5 p-3 group-hover:bg-cyan-500/10 transition-colors border border-border`}>
                <action.icon className={`size-6 text-cyan-500 group-hover:scale-110 transition-transform`} />
              </div>
              <ArrowRight className="size-4 text-foreground/20 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            
            <h3 className="text-lg font-black text-foreground group-hover:text-cyan-400 transition-colors tracking-tight">
              {action.title}
            </h3>
            <p className="mt-2 text-xs text-foreground/40 font-bold leading-relaxed group-hover:text-foreground/60 transition-colors">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}