// components/medical-records.tsx
'use client'

import { useState } from 'react'
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  Trash2, 
  ChevronRight,
  Calendar,
  User,
  Clock,
  FileCheck,
  AlertCircle,
  Upload,
  Share2,
  MoreVertical,
  File,
  Image,
  FileArchive,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  Pill,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Datos de ejemplo para registros médicos
const medicalRecordsData = [
  {
    id: '1',
    title: 'Resultados de Laboratorio',
    date: '15 Marzo, 2026',
    type: 'laboratorio',
    doctor: 'Dra. Ana María López',
    specialty: 'Medicina General',
    status: 'nuevo',
    description: 'Hemograma completo, perfil lipídico, glucosa en ayunas',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    attachments: 1
  },
  {
    id: '2',
    title: 'Radiografía de Tórax',
    date: '10 Marzo, 2026',
    type: 'imagen',
    doctor: 'Dr. Carlos Mendoza',
    specialty: 'Radiología',
    status: 'leido',
    description: 'Control post-neumonía',
    fileType: 'jpg',
    fileSize: '5.1 MB',
    attachments: 2
  },
  {
    id: '3',
    title: 'Consulta Cardiológica',
    date: '05 Marzo, 2026',
    type: 'consulta',
    doctor: 'Dr. Roberto Sánchez',
    specialty: 'Cardiología',
    status: 'archivado',
    description: 'Evaluación de presión arterial y ECG',
    fileType: 'pdf',
    fileSize: '1.8 MB',
    attachments: 1
  },
  {
    id: '4',
    title: 'Receta Médica - Losartan',
    date: '01 Marzo, 2026',
    type: 'receta',
    doctor: 'Dr. Carlos Mendoza',
    specialty: 'Cardiología',
    status: 'vigente',
    description: 'Losartan 50mg, 1 tableta diaria',
    fileType: 'pdf',
    fileSize: '0.5 MB',
    attachments: 1
  },
  {
    id: '5',
    title: 'Certificado de Vacunación',
    date: '20 Febrero, 2026',
    type: 'certificado',
    doctor: 'Dra. Laura Fernández',
    specialty: 'Medicina Preventiva',
    status: 'leido',
    description: 'Vacuna influenza 2026',
    fileType: 'pdf',
    fileSize: '0.8 MB',
    attachments: 1
  },
  {
    id: '6',
    title: 'Eco Doppler Venoso',
    date: '15 Febrero, 2026',
    type: 'imagen',
    doctor: 'Dr. Eduardo Torres',
    specialty: 'Radiología Vascular',
    status: 'nuevo',
    description: 'Estudio de circulación de miembros inferiores',
    fileType: 'zip',
    fileSize: '12.3 MB',
    attachments: 8
  },
  {
    id: '7',
    title: 'Resultados de Estrés',
    date: '10 Febrero, 2026',
    type: 'laboratorio',
    doctor: 'Dra. Ana María López',
    specialty: 'Medicina General',
    status: 'archivado',
    description: 'Prueba de esfuerzo y análisis de cortisol',
    fileType: 'pdf',
    fileSize: '3.2 MB',
    attachments: 1
  },
  {
    id: '8',
    title: 'Prescripción Nutricional',
    date: '05 Febrero, 2026',
    type: 'receta',
    doctor: 'Lic. Carolina Ruiz',
    specialty: 'Nutrición',
    status: 'vigente',
    description: 'Plan alimenticio para hipertensión',
    fileType: 'pdf',
    fileSize: '0.9 MB',
    attachments: 1
  }
]

// Configuración de tipos de registros
const recordTypeConfig = {
  laboratorio: { 
    icon: FileSpreadsheet, 
    bg: 'bg-blue-100', 
    color: 'text-blue-600',
    label: 'Laboratorio'
  },
  imagen: { 
    icon: Image, 
    bg: 'bg-purple-100', 
    color: 'text-purple-600',
    label: 'Imagen'
  },
  consulta: { 
    icon: Activity, 
    bg: 'bg-emerald-100', 
    color: 'text-emerald-600',
    label: 'Consulta'
  },
  receta: { 
    icon: FileText, 
    bg: 'bg-amber-100', 
    color: 'text-amber-600',
    label: 'Receta'
  },
  certificado: { 
    icon: FileCheck, 
    bg: 'bg-teal-100', 
    color: 'text-teal-600',
    label: 'Certificado'
  }
}

// Configuración de estados
const statusConfig = {
  nuevo: { 
    icon: AlertCircle, 
    color: 'text-coral', 
    bg: 'bg-coral/10', 
    label: 'Nuevo',
    borderColor: 'border-coral/20'
  },
  leido: { 
    icon: CheckCircle2, 
    color: 'text-turquesa', 
    bg: 'bg-turquesa/10', 
    label: 'Leído',
    borderColor: 'border-turquesa/20'
  },
  archivado: { 
    icon: FileArchive, 
    color: 'text-gris-grafito', 
    bg: 'bg-gris-perla', 
    label: 'Archivado',
    borderColor: 'border-gris-perla'
  },
  vigente: { 
    icon: CheckCircle2, 
    color: 'text-azul-electrico', 
    bg: 'bg-azul-electrico/10', 
    label: 'Vigente',
    borderColor: 'border-azul-electrico/20'
  }
}

// Configuración de iconos por tipo de archivo
const fileIconConfig = {
  pdf: { icon: FileText, bg: 'bg-red-50', color: 'text-red-500' },
  jpg: { icon: Image, bg: 'bg-blue-50', color: 'text-blue-500' },
  png: { icon: Image, bg: 'bg-blue-50', color: 'text-blue-500' },
  zip: { icon: FileArchive, bg: 'bg-amber-50', color: 'text-amber-500' },
  default: { icon: File, bg: 'bg-gray-50', color: 'text-gray-500' }
}

export function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('todos')
  const [selectedStatus, setSelectedStatus] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<'recientes' | 'archivados'>('recientes')
  const [isUploading, setIsUploading] = useState(false)

  // Filtrar registros
  const filteredRecords = medicalRecordsData.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (record.description && record.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === 'todos' || record.type === selectedType
    const matchesStatus = selectedStatus === 'todos' || record.status === selectedStatus
    const matchesView = viewMode === 'recientes' 
      ? record.status !== 'archivado' 
      : record.status === 'archivado'
    return matchesSearch && matchesType && matchesStatus && matchesView
  })

  // Estadísticas
  const stats = {
    total: medicalRecordsData.length,
    nuevos: medicalRecordsData.filter(r => r.status === 'nuevo').length,
    laboratorios: medicalRecordsData.filter(r => r.type === 'laboratorio').length,
    imagenes: medicalRecordsData.filter(r => r.type === 'imagen').length,
    recetas: medicalRecordsData.filter(r => r.type === 'receta').length
  }

  // Simular subida de archivo
  const handleUpload = () => {
    setIsUploading(true)
    setTimeout(() => {
      setIsUploading(false)
      // Aquí iría la lógica real de subida
    }, 1500)
  }

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Header con estadísticas */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
            <FileText className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Mis Registros Médicos</h1>
            <p className="text-sm text-gris-grafito">
              Todos tus documentos y registros de salud en un solo lugar
            </p>
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
            <p className="text-2xl font-bold text-azul-electrico">{stats.total}</p>
            <p className="text-xs text-gris-grafito">Total registros</p>
          </div>
          <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
            {stats.nuevos > 0 && (
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertCircle className="size-4 text-coral" />
                <p className="text-2xl font-bold text-coral">{stats.nuevos}</p>
              </div>
            )}
            {stats.nuevos === 0 && (
              <p className="text-2xl font-bold text-turquesa">0</p>
            )}
            <p className="text-xs text-gris-grafito">Nuevos</p>
          </div>
          <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
            <p className="text-2xl font-bold text-violeta">{stats.laboratorios}</p>
            <p className="text-xs text-gris-grafito">Laboratorios</p>
          </div>
          <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
            <p className="text-2xl font-bold text-turquesa">{stats.imagenes}</p>
            <p className="text-xs text-gris-grafito">Imágenes</p>
          </div>
          <div className="card-premium p-4 text-center hover:border-azul-electrico/30">
            <p className="text-2xl font-bold text-amber-600">{stats.recetas}</p>
            <p className="text-xs text-gris-grafito">Recetas</p>
          </div>
        </div>
      </div>

      {/* Banner de recordatorio */}
      {stats.nuevos > 0 && (
        <div className="bg-gradient-electric rounded-2xl p-5 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10">
            <div className="text-9xl">📄</div>
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg" />
                <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white/20 to-white/10">
                  <AlertCircle className="size-8 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-xl">Tienes {stats.nuevos} registro(s) nuevo(s)</h3>
                </div>
                <p className="text-sm text-white/80 mt-1">
                  Revisa tus resultados de laboratorio y estudios recientes
                </p>
              </div>
            </div>
            <Button className="bg-white text-azul-electrico hover:bg-white/90">
              <Eye className="size-4 mr-2" />
              Revisar ahora
            </Button>
          </div>
        </div>
      )}

      {/* Vista selector */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setViewMode('recientes')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            viewMode === 'recientes' 
              ? 'text-azul-electrico border-b-2 border-azul-electrico' 
              : 'text-gris-grafito hover:text-azul-profundo'
          }`}
        >
          Recientes
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            viewMode === 'recientes' ? 'bg-azul-electrico/10 text-azul-electrico' : 'bg-gris-perla'
          }`}>
            {medicalRecordsData.filter(r => r.status !== 'archivado').length}
          </span>
        </button>
        <button
          onClick={() => setViewMode('archivados')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            viewMode === 'archivados' 
              ? 'text-azul-electrico border-b-2 border-azul-electrico' 
              : 'text-gris-grafito hover:text-azul-profundo'
          }`}
        >
          Archivados
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            viewMode === 'archivados' ? 'bg-azul-electrico/10 text-azul-electrico' : 'bg-gris-perla'
          }`}>
            {medicalRecordsData.filter(r => r.status === 'archivado').length}
          </span>
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gris-grafito" />
          <Input
            placeholder="Buscar por título, doctor o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 input-premium"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-premium px-4 py-2 text-sm cursor-pointer"
          >
            <option value="todos">Todos los tipos</option>
            <option value="laboratorio">Laboratorio</option>
            <option value="imagen">Imágenes</option>
            <option value="consulta">Consultas</option>
            <option value="receta">Recetas</option>
            <option value="certificado">Certificados</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-premium px-4 py-2 text-sm cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="nuevo">Nuevos</option>
            <option value="leido">Leídos</option>
            <option value="vigente">Vigentes</option>
            <option value="archivado">Archivados</option>
          </select>
          
          <Button variant="outline" className="btn-outline-premium">
            <Filter className="size-4 mr-2" />
            Más filtros
          </Button>
          
          <Button 
            className="btn-premium"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Upload className="size-4 mr-2" />
            )}
            Subir registro
          </Button>
        </div>
      </div>

      {/* Lista de registros médicos */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <div className="flex justify-center mb-4">
              <FileText className="size-16 text-gris-grafito/30" />
            </div>
            <h3 className="text-lg font-semibold text-azul-profundo">No hay registros</h3>
            <p className="text-sm text-gris-grafito mt-1">
              {viewMode === 'recientes' 
                ? 'No tienes registros médicos. Sube tus documentos para tenerlos organizados.'
                : 'No hay registros archivados.'}
            </p>
            {viewMode === 'recientes' && (
              <Button className="mt-6 btn-premium" onClick={handleUpload}>
                <Upload className="size-4 mr-2" />
                Subir primer registro
              </Button>
            )}
          </div>
        ) : (
          filteredRecords.map((record) => {
            const TypeConfig = recordTypeConfig[record.type as keyof typeof recordTypeConfig] || recordTypeConfig.laboratorio
            const StatusConfig = statusConfig[record.status as keyof typeof statusConfig] || statusConfig.leido
            const StatusIcon = StatusConfig.icon
            const TypeIcon = TypeConfig.icon
            const FileIconConfig = fileIconConfig[record.fileType as keyof typeof fileIconConfig] || fileIconConfig.default
            const FileIcon = FileIconConfig.icon

            return (
              <div key={record.id} className={`card-premium p-5 hover:border-azul-electrico/30 transition-all group border-l-4 ${StatusConfig.borderColor}`}>
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  
                  {/* Icono de tipo de registro */}
                  <div className="relative shrink-0">
                    <div className={`absolute inset-0 rounded-2xl blur-md opacity-50 ${TypeConfig.bg}`} />
                    <div className={`relative rounded-2xl p-4 ${TypeConfig.bg} w-20 h-20 flex items-center justify-center`}>
                      <TypeIcon className={`size-8 ${TypeConfig.color}`} />
                    </div>
                    {record.status === 'nuevo' && (
                      <div className="absolute -top-2 -right-2 bg-coral text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                        Nuevo
                      </div>
                    )}
                  </div>
                  
                  {/* Contenido principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-azul-profundo">
                            {record.title}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${StatusConfig.bg} ${StatusConfig.color}`}>
                            <StatusIcon className="size-3 inline mr-1" />
                            {StatusConfig.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${TypeConfig.bg} ${TypeConfig.color}`}>
                            <TypeIcon className="size-3 inline mr-1" />
                            {TypeConfig.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${FileIconConfig.bg} ${FileIconConfig.color} flex items-center gap-1`}>
                            <FileIcon className="size-3" />
                            {record.fileType?.toUpperCase()} • {record.fileSize}
                          </span>
                        </div>
                        <p className="text-sm text-gris-grafito mt-2 line-clamp-2">
                          {record.description}
                        </p>
                      </div>
                      
                      {/* Acciones rápidas */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="text-gris-grafito hover:text-azul-electrico">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gris-grafito hover:text-azul-electrico">
                          <Download className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gris-grafito hover:text-azul-electrico">
                          <Share2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gris-grafito hover:text-coral">
                          <Trash2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gris-grafito">
                          <MoreVertical className="size-4" />
                        </Button>
                        <ChevronRight className="size-5 text-gris-grafito/40 group-hover:text-azul-electrico transition-colors" />
                      </div>
                    </div>
                    
                    {/* Detalles adicionales */}
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gris-grafito">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3 text-azul-electrico" />
                        <span>{record.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="size-3 text-violeta" />
                        <span>Dr. {record.doctor} • {record.specialty}</span>
                      </div>
                      {record.attachments && record.attachments > 1 && (
                        <div className="flex items-center gap-1">
                          <FileArchive className="size-3 text-amber-500" />
                          <span>{record.attachments} archivos adjuntos</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Botón de acción rápida si es receta vigente */}
                    {record.status === 'vigente' && (
                      <div className="mt-3">
                        <Button variant="outline" size="sm" className="btn-outline-premium text-xs">
                          <Pill className="size-3 mr-1" />
                          Solicitar renovación
                        </Button>
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
              <Share2 className="size-6" />
            </div>
            <div>
              <h3 className="font-semibold">Comparte tus registros con tu médico</h3>
              <p className="text-sm text-white/80 mt-1">
                Puedes compartir tus resultados de forma segura con tus especialistas de confianza.
              </p>
            </div>
          </div>
          <Button className="bg-white text-azul-electrico hover:bg-white/90 px-6">
            Compartir ahora
            <ChevronRight className="size-4 ml-2" />
          </Button>
        </div>
      </div>

    </div>
  )
}