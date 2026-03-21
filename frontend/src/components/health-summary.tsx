'use client'

import { Droplet, AlertTriangle, Calendar, Activity, TrendingUp, TrendingDown } from 'lucide-react'

interface HealthMetric {
  label: string
  value: string
  change?: number
  icon: any
  color: string
  bgColor: string
}

const healthData: HealthMetric[] = [
  { 
    label: 'Tipo de Sangre', 
    value: 'O+', 
    icon: Droplet, 
    color: 'text-coral',
    bgColor: 'bg-coral/10',
    change: undefined
  },
  { 
    label: 'Alergias', 
    value: '3', 
    icon: AlertTriangle, 
    color: 'text-coral',
    bgColor: 'bg-coral/10',
    change: undefined
  },
  { 
    label: 'Presión Arterial', 
    value: '120/80', 
    icon: Activity, 
    color: 'text-turquesa',
    bgColor: 'bg-turquesa/10',
    change: -2
  },
  { 
    label: 'Última Consulta', 
    value: '15 Mar, 2026', 
    icon: Calendar, 
    color: 'text-azul-electrico',
    bgColor: 'bg-azul-hielo',
    change: undefined
  },
]

export function HealthSummary() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-azul-profundo">Resumen de Salud</h2>
          <p className="text-sm text-gris-grafito">Tus métricas más importantes</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData.map((metric) => (
          <div key={metric.label} className="card-premium p-5 hover:border-azul-electrico/30 transition-all">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl ${metric.bgColor} p-3`}>
                <metric.icon className={`size-5 ${metric.color}`} />
              </div>
              {metric.change && (
                <div className={`flex items-center gap-1 text-xs font-medium ${metric.change > 0 ? 'text-turquesa' : 'text-coral'}`}>
                  {metric.change > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-azul-profundo">{metric.value}</p>
              <p className="text-sm text-gris-grafito mt-1">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}