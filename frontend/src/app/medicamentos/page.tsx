'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  Pill, 
  Search, 
  Filter, 
  Calendar, 
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  BellOff,
  Trash2,
  Edit,
  CalendarDays,
  Timer,
  Shield,
  Sparkles,
  Package,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import Image from 'next/image'

// Tipos de datos
interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  frequencyType: 'diario' | 'semanal' | 'mensual'
  startDate: string
  endDate: string | null
  status: 'activo' | 'completado' | 'suspendido'
  prescription: {
    doctor: string
    specialty: string
    date: string
  }
  reminders: boolean
  nextDose?: string
  stock?: number
  sideEffects?: string[]
  image?: string
  imageColor?: string
  form?: 'tableta' | 'capsula' | 'inyeccion' | 'jarabe' | 'crema'
}

// Imágenes de medicamentos (usando emojis y colores de fondo como alternativa visual)
const medicationImages: Record<string, { icon: string, color: string, bgGradient: string }> = {
  'Metformina': { icon: '💊', color: 'text-emerald-600', bgGradient: 'from-emerald-100 to-emerald-50' },
  'Losartán': { icon: '❤️', color: 'text-red-600', bgGradient: 'from-red-100 to-red-50' },
  'Amoxicilina': { icon: '🦠', color: 'text-blue-600', bgGradient: 'from-blue-100 to-blue-50' },
  'Atorvastatina': { icon: '⭐', color: 'text-purple-600', bgGradient: 'from-purple-100 to-purple-50' },
  'Paracetamol': { icon: '💊', color: 'text-orange-600', bgGradient: 'from-orange-100 to-orange-50' },
  'default': { icon: '💊', color: 'text-azul-electrico', bgGradient: 'from-azul-hielo to-azul-hielo/50' }
}

// Datos de ejemplo con imágenes
const medicationsData: Medication[] = [
  {
    id: '1',
    name: 'Metformina',
    dosage: '500 mg',
    frequency: '2 veces al día',
    frequencyType: 'diario',
    startDate: '01 Enero, 2026',
    endDate: null,
    status: 'activo',
    prescription: {
      doctor: 'Dra. Ana María López',
      specialty: 'Endocrinología',
      date: '01 Enero, 2026'
    },
    reminders: true,
    nextDose: 'Hoy, 8:00 PM',
    stock: 45,
    form: 'tableta',
    image: '/medications/metformina.png'
  },
  {
    id: '2',
    name: 'Losartán',
    dosage: '50 mg',
    frequency: '1 vez al día',
    frequencyType: 'diario',
    startDate: '15 Febrero, 2026',
    endDate: null,
    status: 'activo',
    prescription: {
      doctor: 'Dr. Carlos Mendoza',
      specialty: 'Cardiología',
      date: '15 Febrero, 2026'
    },
    reminders: true,
    nextDose: 'Mañana, 8:00 AM',
    stock: 28,
    form: 'capsula',
    image: '/medications/losartan.png'
  },
  {
    id: '3',
    name: 'Amoxicilina',
    dosage: '875 mg',
    frequency: 'Cada 8 horas',
    frequencyType: 'diario',
    startDate: '01 Marzo, 2026',
    endDate: '10 Marzo, 2026',
    status: 'completado',
    prescription: {
      doctor: 'Dra. Ana María López',
      specialty: 'Medicina General',
      date: '01 Marzo, 2026'
    },
    reminders: false,
    stock: 0,
    form: 'capsula',
    image: '/medications/amoxicilina.png'
  },
  {
    id: '4',
    name: 'Atorvastatina',
    dosage: '20 mg',
    frequency: '1 vez al día (noche)',
    frequencyType: 'diario',
    startDate: '10 Enero, 2026',
    endDate: null,
    status: 'activo',
    prescription: {
      doctor: 'Dr. Carlos Mendoza',
      specialty: 'Cardiología',
      date: '10 Enero, 2026'
    },
    reminders: true,
    nextDose: 'Hoy, 10:00 PM',
    stock: 52,
    form: 'tableta',
    image: '/medications/atorvastatina.png'
  },
  {
    id: '5',
    name: 'Paracetamol',
    dosage: '500 mg',
    frequency: 'Cada 6-8 horas si es necesario',
    frequencyType: 'diario',
    startDate: '20 Febrero, 2026',
    endDate: '25 Febrero, 2026',
    status: 'suspendido',
    prescription: {
      doctor: 'Dra. Ana María López',
      specialty: 'Medicina General',
      date: '20 Febrero, 2026'
    },
    reminders: false,
    stock: 10,
    form: 'tableta',
    image: '/medications/paracetamol.png'
  }
]

// Formas de medicamentos con iconos
const formConfig = {
  tableta: { icon: '💊', label: 'Tableta', bg: 'bg-blue-100', color: 'text-blue-600' },
  capsula: { icon: '💊', label: 'Cápsula', bg: 'bg-green-100', color: 'text-green-600' },
  inyeccion: { icon: '💉', label: 'Inyección', bg: 'bg-red-100', color: 'text-red-600' },
  jarabe: { icon: '🧪', label: 'Jarabe', bg: 'bg-orange-100', color: 'text-orange-600' },
  crema: { icon: '🧴', label: 'Crema', bg: 'bg-purple-100', color: 'text-purple-600' }
}

// Configuración de estados
const statusConfig = {
  activo: { 
    icon: CheckCircle2, 
    color: 'text-turquesa', 
    bg: 'bg-turquesa/10', 
    label: 'Activo',
    textColor: 'text-turquesa',
    borderColor: 'border-turquesa/20'
  },
  completado: { 
    icon: CheckCircle2, 
    color: 'text-gris-grafito', 
    bg: 'bg-gris-perla', 
    label: 'Completado',
    textColor: 'text-gris-grafito',
    borderColor: 'border-gris-perla'
  },
  suspendido: { 
    icon: XCircle, 
    color: 'text-coral', 
    bg: 'bg-coral/10', 
    label: 'Suspendido',
    textColor: 'text-coral',
    borderColor: 'border-coral/20'
  }
}

export default function MedicamentosPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<'activos' | 'historial'>('activos')

  // Filtrar medicamentos
  const filteredMedications = medicationsData.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          med.dosage.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'todos' || med.status === selectedStatus
    const matchesView = viewMode === 'activos' 
      ? med.status === 'activo' 
      : med.status !== 'activo'
    return matchesSearch && matchesStatus && matchesView
  })

  // Estadísticas
  const stats = {
    total: medicationsData.length,
    activos: medicationsData.filter(m => m.status === 'activo').length,
    completados: medicationsData.filter(m => m.status === 'completado').length,
    conRecordatorio: medicationsData.filter(m => m.reminders && m.status === 'activo').length,
    bajoStock: medicationsData.filter(m => m.stock && m.stock < 15 && m.status === 'activo').length
  }

  // Próxima dosis más cercana
  const nextDose = medicationsData.find(m => m.status === 'activo' && m.nextDose)

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-in">
        
        {/* Header con estadísticas */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
              <Pill className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Medicamentos</h1>
              <p className="text-sm text-gris-grafito">
                Gestiona tu medicación, recibe recordatorios y mantén el control
              </p>
            </div>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
              <p className="text-2xl font-bold text-azul-electrico">{stats.activos}</p>
              <p className="text-xs text-gris-grafito">Activos</p>
            </div>
            <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
              <p className="text-2xl font-bold text-turquesa">{stats.completados}</p>
              <p className="text-xs text-gris-grafito">Completados</p>
            </div>
            <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
              <p className="text-2xl font-bold text-violeta">{stats.conRecordatorio}</p>
              <p className="text-xs text-gris-grafito">Recordatorios</p>
            </div>
            <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
              {stats.bajoStock > 0 && (
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertCircle className="size-4 text-coral" />
                  <p className="text-2xl font-bold text-coral">{stats.bajoStock}</p>
                </div>
              )}
              {stats.bajoStock === 0 && (
                <p className="text-2xl font-bold text-turquesa">0</p>
              )}
              <p className="text-xs text-gris-grafito">Stock bajo</p>
            </div>
            <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
              <div className="flex items-center justify-center gap-1">
                <Timer className="size-4 text-coral" />
                <p className="text-sm font-medium text-coral truncate">{nextDose?.nextDose || 'Sin dosis'}</p>
              </div>
              <p className="text-xs text-gris-grafito mt-1">Próxima dosis</p>
            </div>
          </div>
        </div>

        {/* Próxima dosis destacada con imagen */}
        {nextDose && (
          <div className="bg-gradient-electric rounded-2xl p-5 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10">
              <div className="text-9xl">{medicationImages[nextDose.name]?.icon || medicationImages.default.icon}</div>
            </div>
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg" />
                  <div className={`relative rounded-2xl p-4 bg-gradient-to-br ${medicationImages[nextDose.name]?.bgGradient || medicationImages.default.bgGradient}`}>
                    <span className="text-4xl">{medicationImages[nextDose.name]?.icon || medicationImages.default.icon}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-xl">{nextDose.name}</h3>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{nextDose.dosage}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{nextDose.nextDose}</span>
                  </div>
                  <p className="text-sm text-white/80 mt-1">
                    Toma {nextDose.frequency}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    No olvides tomar tu medicación a tiempo
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-white text-azul-electrico hover:bg-white/90">
                  <CheckCircle2 className="size-4 mr-2" />
                  Marcar como tomada
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  <BellOff className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Vista selector */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setViewMode('activos')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              viewMode === 'activos' 
                ? 'text-azul-electrico border-b-2 border-azul-electrico' 
                : 'text-gris-grafito hover:text-azul-profundo'
            }`}
          >
            Activos
            {stats.activos > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                viewMode === 'activos' ? 'bg-azul-electrico/10 text-azul-electrico' : 'bg-gris-perla'
              }`}>
                {stats.activos}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode('historial')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              viewMode === 'historial' 
                ? 'text-azul-electrico border-b-2 border-azul-electrico' 
                : 'text-gris-grafito hover:text-azul-profundo'
            }`}
          >
            Historial
            {stats.completados > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                viewMode === 'historial' ? 'bg-azul-electrico/10 text-azul-electrico' : 'bg-gris-perla'
              }`}>
                {stats.completados}
              </span>
            )}
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gris-grafito" />
            <Input
              placeholder="Buscar por nombre, dosis o principio activo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 input-premium"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-premium px-4 py-2 text-sm cursor-pointer"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="completado">Completados</option>
              <option value="suspendido">Suspendidos</option>
            </select>
            
            <Button variant="outline" className="btn-outline-premium">
              <Filter className="size-4 mr-2" />
              Más filtros
            </Button>
            
            <Button className="btn-premium">
              <Plus className="size-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Lista de medicamentos con imágenes */}
        <div className="space-y-4">
          {filteredMedications.length === 0 ? (
            <div className="card-premium p-12 text-center">
              <div className="flex justify-center mb-4">
                <Pill className="size-16 text-gris-grafito/30" />
              </div>
              <h3 className="text-lg font-semibold text-azul-profundo">No hay medicamentos</h3>
              <p className="text-sm text-gris-grafito mt-1">
                {viewMode === 'activos' 
                  ? 'No tienes medicamentos activos. Agrega tu primer tratamiento.'
                  : 'No hay medicamentos en el historial.'}
              </p>
              {viewMode === 'activos' && (
                <Button className="mt-6 btn-premium">
                  <Plus className="size-4 mr-2" />
                  Agregar medicamento
                </Button>
              )}
            </div>
          ) : (
            filteredMedications.map((med) => {
              const Status = statusConfig[med.status]
              const StatusIcon = Status.icon
              const medImage = medicationImages[med.name] || medicationImages.default
              const medForm = formConfig[med.form || 'tableta']
              
              return (
                <div key={med.id} className={`card-premium p-5 hover:border-azul-electrico/30 transition-all group border-l-4 ${Status.borderColor}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    
                    {/* Imagen del medicamento */}
                    <div className="relative shrink-0">
                      <div className={`absolute inset-0 rounded-2xl blur-md opacity-50 bg-gradient-to-br ${medImage.bgGradient}`} />
                      <div className={`relative rounded-2xl p-4 bg-gradient-to-br ${medImage.bgGradient} w-20 h-20 flex items-center justify-center`}>
                        <span className="text-4xl">{medImage.icon}</span>
                      </div>
                      {med.status === 'activo' && med.stock && med.stock < 15 && (
                        <div className="absolute -top-2 -right-2 bg-coral text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                          Stock bajo
                        </div>
                      )}
                    </div>
                    
                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-azul-profundo">
                              {med.name}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${Status.bg} ${Status.color}`}>
                              <StatusIcon className="size-3 inline mr-1" />
                              {Status.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${medForm.bg} ${medForm.color}`}>
                              {medForm.icon} {medForm.label}
                            </span>
                            {med.reminders && med.status === 'activo' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-azul-hielo text-azul-electrico flex items-center gap-1">
                                <Bell className="size-3" />
                                Recordatorio
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <p className="text-sm font-medium text-azul-electrico">{med.dosage}</p>
                            <p className="text-sm text-gris-grafito">•</p>
                            <p className="text-sm text-gris-grafito">{med.frequency}</p>
                          </div>
                        </div>
                        
                        {/* Acciones rápidas */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="text-gris-grafito hover:text-azul-electrico">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gris-grafito hover:text-coral">
                            <Trash2 className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gris-grafito hover:text-azul-electrico">
                            {med.reminders ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                          </Button>
                          <ChevronRight className="size-5 text-gris-grafito/40 group-hover:text-azul-electrico transition-colors" />
                        </div>
                      </div>
                      
                      {/* Detalles adicionales */}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gris-grafito">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3 text-azul-electrico" />
                          <span>Inicio: {med.startDate}</span>
                        </div>
                        {med.endDate && (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="size-3 text-coral" />
                            <span>Fin: {med.endDate}</span>
                          </div>
                        )}
                        {med.stock && med.stock > 0 && (
                          <div className="flex items-center gap-1">
                            <Package className="size-3 text-turquesa" />
                            <span>{med.stock} unidades restantes</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Shield className="size-3 text-violeta" />
                          <span>Dr. {med.prescription.doctor}</span>
                        </div>
                      </div>
                      
                      {/* Próxima dosis si aplica */}
                      {med.status === 'activo' && med.nextDose && (
                        <div className="mt-3 flex items-center gap-2 text-xs bg-azul-hielo rounded-lg px-3 py-1.5 inline-flex">
                          <Clock className="size-3 text-azul-electrico" />
                          <span className="text-azul-profundo">Próxima dosis: {med.nextDose}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Banner de recomendación */}
        <div className="bg-gradient-electric rounded-2xl p-6 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-xl p-3">
                <Sparkles className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold">Control de medicamentos</h3>
                <p className="text-sm text-white/80 mt-1">
                  Activa los recordatorios para no olvidar ninguna dosis. Recibirás notificaciones en tu dispositivo.
                </p>
              </div>
            </div>
            <Button className="bg-white text-azul-electrico hover:bg-white/90 px-6">
              Configurar recordatorios
              <ChevronRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}