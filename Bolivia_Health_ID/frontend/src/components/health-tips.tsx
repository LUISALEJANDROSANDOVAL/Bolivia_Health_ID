'use client'

import { Lightbulb, Activity, Droplets, Brain, Heart, Apple, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const tips = [
  {
    icon: Heart,
    title: 'Salud Cardiovascular',
    description: 'Realiza al menos 30 minutos de ejercicio diario',
    color: 'text-coral',
    bgColor: 'bg-coral/10',
    link: '/registros',
    linkText: 'Ver mis registros'
  },
  {
    icon: Droplets,
    title: 'Hidratación',
    description: 'Bebe 8 vasos de agua al día para mantenerte hidratado',
    color: 'text-azul-electrico',
    bgColor: 'bg-azul-hielo',
    link: '/medicamentos',
    linkText: 'Ver medicamentos'
  },
  {
    icon: Brain,
    title: 'Descanso',
    description: 'Duerme 7-8 horas para una buena recuperación',
    color: 'text-violeta',
    bgColor: 'bg-violeta/10',
    link: '/historial',
    linkText: 'Ver historial'
  },
  {
    icon: Apple,
    title: 'Alimentación',
    description: 'Incluye frutas y verduras en tu dieta diaria',
    color: 'text-turquesa',
    bgColor: 'bg-turquesa/10',
    link: '/subir',
    linkText: 'Subir análisis'
  }
]

export function HealthTips() {
  return (
    <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <Lightbulb className="size-5 text-cyan-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Tips de Salud</h2>
        </div>
      </div>
      
      <div className="space-y-4">
        {tips.map((tip) => (
          <div key={tip.title} className="relative overflow-hidden bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-3xl border border-border hover:border-cyan-500/20 transition-all hover:shadow-2xl hover:shadow-cyan-500/5 group shadow-lg shadow-black/5">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-foreground/5 group-hover:bg-cyan-500/10 transition-colors border border-border">
                <tip.icon className="size-6 text-cyan-500 group-hover:text-turquesa transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground group-hover:text-turquesa transition-colors leading-tight">
                  {tip.title}
                </h3>
                <p className="text-xs text-foreground/40 mt-1.5 leading-relaxed font-medium group-hover:text-foreground/60 transition-colors">
                  {tip.description}
                </p>
                <Link
                  href="/mis-registros"
                  className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-cyan-500/60 hover:text-cyan-400 mt-4 gap-2 transition-all"
                >
                  Ver mis registros <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Link href="/medicamentos">
        <div className="mt-6 p-5 rounded-3xl bg-gradient-electric text-azul-profundo cursor-pointer hover:shadow-2xl hover:shadow-cyan-500/10 transition-all group border border-azul-profundo/10 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-azul-profundo/10 rounded-lg">
               <Activity className="size-5 animate-pulse text-azul-profundo" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-azul-profundo/70">Recordatorio</span>
          </div>
          <p className="text-sm mt-3 text-azul-profundo font-bold leading-snug">
            Tu próxima medicación es en 2 horas. No olvides tomar tu dosis.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-black uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity text-azul-profundo">
             Ver mis medicamentos →
          </div>
        </div>
      </Link>
    </div>
  )
}