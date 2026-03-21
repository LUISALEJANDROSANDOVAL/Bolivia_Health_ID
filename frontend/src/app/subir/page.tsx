'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { FileUpload } from '@/components/file-upload'
import { 
  Cloud, 
  Shield, 
  Lock, 
  CheckCircle2, 
  FileText, 
  Activity,
  Clock,
  Database,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const features = [
  {
    icon: Lock,
    title: 'Cifrado End-to-End',
    description: 'Tus archivos se cifran antes de ser subidos, garantizando que solo tú puedas acceder a ellos.',
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  {
    icon: Cloud,
    title: 'Almacenamiento IPFS',
    description: 'Los archivos se distribuyen en una red descentralizada, eliminando puntos únicos de fallo.',
    color: 'text-purple-500',
    bg: 'bg-purple-50'
  },
  {
    icon: Shield,
    title: 'Control de Acceso',
    description: 'Decide quién puede ver tus documentos y revoca permisos cuando lo desees.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50'
  },
  {
    icon: CheckCircle2,
    title: 'Verificación Blockchain',
    description: 'Cada documento tiene un hash único registrado en la blockchain para verificar su autenticidad.',
    color: 'text-amber-500',
    bg: 'bg-amber-50'
  },
]

const stats = [
  {
    icon: Database,
    label: 'Almacenamiento usado',
    value: '2.4 GB',
    total: 'de 10 GB',
    progress: 24,
    color: 'text-blue-500'
  },
  {
    icon: TrendingUp,
    label: 'Documentos subidos',
    value: '24',
    total: 'este mes',
    trend: '+12%',
    color: 'text-emerald-500'
  },
  {
    icon: Clock,
    label: 'Última subida',
    value: 'Hace 2 días',
    total: '15 Mar 2026',
    color: 'text-purple-500'
  }
]

export default function SubirPage() {
  const [uploadComplete, setUploadComplete] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-in">
        
        {/* Header con estadísticas */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
              <Cloud className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Subir Archivos</h1>
              <p className="text-sm text-gris-grafito">
                Sube tus documentos médicos de forma segura a la red descentralizada
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {stats.map((stat, idx) => (
              <Card key={idx} className="card-premium p-4 hover:border-azul-electrico/30 transition-all">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl p-2 ${stat.color} bg-opacity-10 bg-current`}>
                      <stat.icon className={`size-5 ${stat.color}`} />
                    </div>
                    {stat.trend && (
                      <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-azul-profundo">{stat.value}</p>
                    <p className="text-xs text-gris-grafito mt-1">{stat.label}</p>
                    {stat.total && (
                      <p className="text-xs text-gris-grafito/60 mt-0.5">{stat.total}</p>
                    )}
                  </div>
                  {stat.progress && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-electric rounded-full transition-all duration-500"
                          style={{ width: `${stat.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Banner de seguridad */}
        <div className="bg-gradient-electric rounded-2xl p-5 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10">
            <div className="text-9xl">🔒</div>
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg" />
                <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white/20 to-white/10">
                  <Shield className="size-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Almacenamiento seguro y descentralizado</h3>
                <p className="text-sm text-white/80 mt-1">
                  Tus archivos son cifrados y distribuidos en la red IPFS, garantizando su integridad y disponibilidad.
                </p>
              </div>
            </div>
            <Link href="/registros">
              <Button className="bg-white text-azul-electrico hover:bg-white/90">
                <FileText className="size-4 mr-2" />
                Ver mis documentos
              </Button>
            </Link>
          </div>
        </div>

        {/* Componente principal de subida */}
        <FileUpload onUploadComplete={() => setUploadComplete(true)} />

        {/* Características de IPFS */}
        <div>
          <h2 className="text-lg font-semibold text-azul-profundo mb-4 flex items-center gap-2">
            <Activity className="size-5 text-azul-electrico" />
            ¿Por qué usar IPFS?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, idx) => (
              <Card key={idx} className="card-premium p-4 hover:shadow-md transition-all group">
                <CardContent className="p-0">
                  <div className={`rounded-xl p-3 ${feature.bg} w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`size-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-azul-profundo text-sm">{feature.title}</h3>
                  <p className="text-xs text-gris-grafito mt-1 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Banner de recomendación */}
        {uploadComplete && (
          <div className="bg-gradient-electric rounded-2xl p-6 text-white animate-slide-in">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-xl p-3">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold">¡Archivo subido correctamente!</h3>
                  <p className="text-sm text-white/80 mt-1">
                    Tu documento ha sido cifrado y almacenado en IPFS. Puedes verlo en tus registros.
                  </p>
                </div>
              </div>
              <Link href="/registros">
                <Button className="bg-white text-azul-electrico hover:bg-white/90 px-6">
                  Ver en registros
                  <CheckCircle2 className="size-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}