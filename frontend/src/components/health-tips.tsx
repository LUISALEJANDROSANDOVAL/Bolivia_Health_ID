'use client'

import { Lightbulb, Activity, Droplets, Brain, Heart, Apple } from 'lucide-react'
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="size-5 text-coral" />
        <h2 className="text-xl font-semibold text-azul-profundo">Tips de Salud</h2>
      </div>
      
      <div className="space-y-3">
        {tips.map((tip, index) => (
          <Link key={index} href={tip.link} className="block">
            <div className="card-premium p-4 flex items-start gap-3 hover:border-azul-electrico/30 transition-all cursor-pointer">
              <div className={`rounded-lg ${tip.bgColor} p-2`}>
                <tip.icon className={`size-4 ${tip.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-azul-profundo">{tip.title}</h3>
                <p className="text-xs text-gris-grafito mt-1">{tip.description}</p>
                <p className="text-xs text-azul-electrico mt-2 hover:underline">{tip.linkText}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <Link href="/medicamentos">
        <div className="mt-4 p-4 rounded-xl bg-gradient-electric text-white cursor-pointer hover:shadow-lg transition-all">
          <div className="flex items-center gap-2">
            <Activity className="size-5 animate-pulse" />
            <span className="text-sm font-medium">Recordatorio</span>
          </div>
          <p className="text-xs mt-2 text-white/90">
            Tu próxima medicación es en 2 horas. No olvides tomar tu dosis.
          </p>
          <p className="text-xs text-white/80 mt-2 hover:underline">Ver mis medicamentos →</p>
        </div>
      </Link>
    </div>
  )
}