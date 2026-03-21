'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Calendar, 
  ChevronRight,
  Activity,
  Heart,
  Stethoscope,
  Syringe,
  FileText,
  Eye,
  Download,
  Clock,
  User,
  Hospital,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// Tipos de datos
interface HistoryRecord {
  id: string
  title: string
  description: string
  date: string
  type: 'consulta' | 'examen' | 'vacuna' | 'receta' | 'cirugia'
  doctor?: string
  institution?: string
  status: 'completado' | 'pendiente' | 'cancelado'
  attachments?: number
}

// Datos de ejemplo
const historyData: HistoryRecord[] = [
  {
    id: '1',
    title: 'Consulta de Cardiología',
    description: 'Control anual - Evaluación cardiovascular',
    date: '15 Marzo, 2026',
    type: 'consulta',
    doctor: 'Dra. Ana María López',
    institution: 'Hospital Obrero',
    status: 'completado',
    attachments: 2
  },
  {
    id: '2',
    title: 'Análisis de Sangre',
    description: 'Hemograma completo, perfil lipídico, glucosa',
    date: '10 Marzo, 2026',
    type: 'examen',
    doctor: 'Dr. Carlos Mendoza',
    institution: 'Laboratorio Clínico Central',
    status: 'completado',
    attachments: 3
  },
  {
    id: '3',
    title: 'Vacuna COVID-19',
    description: 'Tercera dosis - Refuerzo',
    date: '5 Marzo, 2026',
    type: 'vacuna',
    institution: 'Centro de Vacunación Municipal',
    status: 'completado'
  },
  {
    id: '4',
    title: 'Receta - Losartán 50mg',
    description: 'Tratamiento para hipertensión - 30 días',
    date: '1 Marzo, 2026',
    type: 'receta',
    doctor: 'Dra. Ana María López',
    status: 'pendiente'
  },
  {
    id: '5',
    title: 'Radiografía de Tórax',
    description: 'Control post-neumonía',
    date: '20 Febrero, 2026',
    type: 'examen',
    doctor: 'Dr. Roberto Sánchez',
    institution: 'Clínica del Sur',
    status: 'completado',
    attachments: 1
  },
  {
    id: '6',
    title: 'Consulta de Medicina General',
    description: 'Síntomas gripales - Seguimiento',
    date: '15 Febrero, 2026',
    type: 'consulta',
    doctor: 'Dr. Carlos Mendoza',
    institution: 'Centro de Salud La Paz',
    status: 'completado'
  }
]

// Configuración de iconos por tipo
const typeConfig = {
  consulta: { icon: Stethoscope, color: 'text-azul-electrico', bg: 'bg-azul-hielo', label: 'Consulta' },
  examen: { icon: Activity, color: 'text-turquesa', bg: 'bg-turquesa/10', label: 'Examen' },
  vacuna: { icon: Syringe, color: 'text-violeta', bg: 'bg-violeta/10', label: 'Vacuna' },
  receta: { icon: FileText, color: 'text-coral', bg: 'bg-coral/10', label: 'Receta' },
  cirugia: { icon: Heart, color: 'text-azul-electrico', bg: 'bg-azul-hielo', label: 'Cirugía' }
}

// Configuración de estados
const statusConfig = {
  completado: { icon: CheckCircle2, color: 'text-turquesa', bg: 'bg-turquesa/10', label: 'Completado' },
  pendiente: { icon: Clock, color: 'text-coral', bg: 'bg-coral/10', label: 'Pendiente' },
  cancelado: { icon: XCircle, color: 'text-gris-grafito', bg: 'bg-gris-perla', label: 'Cancelado' }
}

export default function HistorialPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('todos')
  const [selectedYear, setSelectedYear] = useState<string>('2026')

  // Filtrar registros
  const filteredRecords = historyData.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'todos' || record.type === selectedType
    const matchesYear = record.date.includes(selectedYear)
    return matchesSearch && matchesType && matchesYear
  })

  // Estadísticas
  const stats = {
    total: historyData.length,
    consultas: historyData.filter(r => r.type === 'consulta').length,
    examenes: historyData.filter(r => r.type === 'examen').length,
    vacunas: historyData.filter(r => r.type === 'vacuna').length
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-in">
        
        {/* Header con estadísticas */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
              <ClipboardList className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Historial Médico</h1>
              <p className="text-sm text-gris-grafito">
                Todo tu historial clínico en un solo lugar
              </p>
            </div>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
              <p className="text-2xl font-bold text-azul-electrico">{stats.total}</p>
              <p className="text-xs text-gris-grafito">Total Registros</p>
            </div>
            <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
              <p className="text-2xl font-bold text-azul-electrico">{stats.consultas}</p>
              <p className="text-xs text-gris-grafito">Consultas</p>
            </div>
            <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
              <p className="text-2xl font-bold text-turquesa">{stats.examenes}</p>
              <p className="text-xs text-gris-grafito">Exámenes</p>
            </div>
            <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
              <p className="text-2xl font-bold text-violeta">{stats.vacunas}</p>
              <p className="text-xs text-gris-grafito">Vacunas</p>
            </div>
          </div>
        </div>

        {/* Timeline visual */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="size-5 text-azul-electrico" />
            <h2 className="text-lg font-semibold text-azul-profundo">Línea de Tiempo</h2>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-azul-electrico via-azul-electrico/50 to-transparent" />
            <div className="space-y-6">
              {filteredRecords.slice(0, 3).map((record, idx) => {
                const TypeIcon = typeConfig[record.type].icon
                return (
                  <div key={record.id} className="relative pl-12">
                    <div className="absolute left-0 top-0">
                      <div className={`flex size-8 items-center justify-center rounded-full ${typeConfig[record.type].bg}`}>
                        <TypeIcon className={`size-4 ${typeConfig[record.type].color}`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-azul-profundo">{record.title}</h3>
                        <span className="text-xs text-gris-grafito">{record.date}</span>
                      </div>
                      <p className="text-sm text-gris-grafito mt-1">{record.description}</p>
                      {record.doctor && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gris-grafito">
                          <User className="size-3" />
                          <span>{record.doctor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gris-grafito" />
            <Input
              placeholder="Buscar por título o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 input-premium"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-premium px-4 py-2 text-sm cursor-pointer"
            >
              <option value="todos">Todos los tipos</option>
              <option value="consulta">Consultas</option>
              <option value="examen">Exámenes</option>
              <option value="vacuna">Vacunas</option>
              <option value="receta">Recetas</option>
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input-premium px-4 py-2 text-sm cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>

        {/* Lista de registros */}
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="card-premium p-12 text-center">
              <div className="flex justify-center mb-4">
                <ClipboardList className="size-16 text-gris-grafito/30" />
              </div>
              <h3 className="text-lg font-semibold text-azul-profundo">No se encontraron registros</h3>
              <p className="text-sm text-gris-grafito mt-1">
                Intenta con otros filtros o sube tu primer registro médico
              </p>
              <Link href="/subir">
                <Button className="mt-6 btn-premium">
                  Subir mi primer registro
                </Button>
              </Link>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const TypeIcon = typeConfig[record.type].icon
              const StatusIcon = statusConfig[record.status].icon
              const Status = statusConfig[record.status]
              
              return (
                <Link key={record.id} href={`/historial/${record.id}`} className="block">
                  <div className="card-premium p-5 hover:border-azul-electrico/30 transition-all cursor-pointer group">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      
                      {/* Icono de tipo */}
                      <div className={`rounded-xl ${typeConfig[record.type].bg} p-3 shrink-0 self-start`}>
                        <TypeIcon className={`size-6 ${typeConfig[record.type].color}`} />
                      </div>
                      
                      {/* Contenido principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-azul-profundo group-hover:text-azul-electrico transition-colors">
                                {record.title}
                              </h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig[record.type].bg} ${typeConfig[record.type].color}`}>
                                {typeConfig[record.type].label}
                              </span>
                            </div>
                            <p className="text-sm text-gris-grafito mt-1">{record.description}</p>
                          </div>
                          
                          {/* Estado */}
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${Status.bg}`}>
                            <StatusIcon className={`size-3 ${Status.color}`} />
                            <span className={`text-xs ${Status.color}`}>{Status.label}</span>
                          </div>
                        </div>
                        
                        {/* Detalles adicionales */}
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gris-grafito">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3 text-azul-electrico" />
                            <span>{record.date}</span>
                          </div>
                          {record.doctor && (
                            <div className="flex items-center gap-1">
                              <User className="size-3 text-azul-electrico" />
                              <span>{record.doctor}</span>
                            </div>
                          )}
                          {record.institution && (
                            <div className="flex items-center gap-1">
                              <Hospital className="size-3 text-azul-electrico" />
                              <span>{record.institution}</span>
                            </div>
                          )}
                          {record.attachments && (
                            <div className="flex items-center gap-1">
                              <FileText className="size-3 text-azul-electrico" />
                              <span>{record.attachments} documentos</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        <Button variant="ghost" size="sm" className="text-gris-grafito hover:text-azul-electrico">
                          <Eye className="size-4 mr-1" />
                          Ver
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gris-grafito hover:text-azul-electrico">
                          <Download className="size-4" />
                        </Button>
                        <ChevronRight className="size-5 text-gris-grafito/40 group-hover:text-azul-electrico transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Banner de recomendación */}
        <div className="bg-gradient-electric rounded-2xl p-6 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-xl p-3">
                <AlertCircle className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold">¿Te falta algún registro?</h3>
                <p className="text-sm text-white/80 mt-1">
                  Puedes subir tus documentos médicos, recetas y análisis para tener todo centralizado.
                </p>
              </div>
            </div>
            <Link href="/subir">
              <Button className="bg-white text-azul-electrico hover:bg-white/90 px-6">
                Subir registro
                <ChevronRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}