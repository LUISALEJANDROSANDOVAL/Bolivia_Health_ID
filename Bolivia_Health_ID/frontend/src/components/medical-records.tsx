'use client'

<<<<<<< HEAD
import { useState, useEffect } from 'react'
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  ChevronRight,
  Calendar,
  User,
  FileCheck,
  Upload,
  Share2,
  File,
  Image,
  FileSpreadsheet,
  Activity
} from 'lucide-react'
=======
import { useState } from 'react'
import { FileText, Image, Download, Eye, Calendar, Filter, Search, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
>>>>>>> feature/Arnez
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'

<<<<<<< HEAD
// Definición de tipos
interface RecordItem {
  id: string
  title: string
  date: string
  type: string
  description: string
  fileType: string
  fileSize: string
  fileUrl: string
}

// Configuración de tipos de registros
const recordTypeConfig = {
  laboratorio: { 
    icon: FileSpreadsheet, 
    bg: 'bg-blue-400/10', 
    color: 'text-blue-400',
    label: 'Laboratorio'
  },
  imagen: { 
    icon: Image, 
    bg: 'bg-purple-400/10', 
    color: 'text-purple-400',
    label: 'Imagen'
  },
  consulta: { 
    icon: Activity, 
    bg: 'bg-emerald-400/10', 
    color: 'text-emerald-400',
    label: 'Consulta'
  },
  receta: { 
    icon: FileText, 
    bg: 'bg-amber-400/10', 
    color: 'text-amber-400',
    label: 'Receta'
  },
  certificado: { 
    icon: FileCheck, 
    bg: 'bg-teal-400/10', 
    color: 'text-teal-400',
    label: 'Certificado'
  }
}

export function MedicalRecords() {
  const { isDbConnected, walletAddress } = useWallet()
  const [records, setRecords] = useState<RecordItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('todos')

  useEffect(() => {
    async function fetchRecords() {
      if (!walletAddress) return
      setLoading(true)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()

        if (profile) {
          const { data } = await supabase
            .from('health_records')
            .select('*')
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false })
          
          const mapped: RecordItem[] = (data || []).map(r => ({
            id: r.id,
            title: r.title,
            date: new Date(r.created_at).toLocaleDateString(),
            type: r.category === 'Laboratorio' ? 'laboratorio' : r.category === 'Imágenes' ? 'imagen' : 'receta',
            description: `${r.category} - ${r.file_size}`,
            fileType: 'pdf',
            fileSize: r.file_size,
            fileUrl: r.file_url ? `https://gateway.pinata.cloud/ipfs/${r.file_url}` : '#'
          }))
          
          setRecords(mapped)
        }
      } catch (err) {
        console.error('Error fetching records:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isDbConnected) {
      fetchRecords()
    }
  }, [isDbConnected, walletAddress])

  // Filtrar registros
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'todos' || record.type === selectedType
    return matchesSearch && matchesType
  })

  // Estadísticas
  const stats = {
    total: records.length,
    laboratorios: records.filter(r => r.type === 'laboratorio').length,
    imagenes: records.filter(r => r.type === 'imagen').length,
    recetas: records.filter(r => r.type === 'receta').length
=======
// Definir el tipo para los registros médicos
interface MedicalRecord {
  id: string
  name: string
  type: 'pdf' | 'image'
  category: string
  date: string
  size: string
  ipfsHash: string
  fileUrl: string
  previewUrl: string
}

// Definir el tipo para las props del Modal
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const records: MedicalRecord[] = [
  {
    id: '1',
    name: 'Análisis de Sangre Completo',
    type: 'pdf',
    category: 'Laboratorio',
    date: '15 Mar, 2026',
    size: '2.4 MB',
    ipfsHash: 'Qm...x7kf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    previewUrl: 'https://picsum.photos/800/600?random=1'
  },
  {
    id: '2',
    name: 'Radiografía de Tórax',
    type: 'image',
    category: 'Imágenes',
    date: '10 Mar, 2026',
    size: '8.1 MB',
    ipfsHash: 'Qm...9d2a',
    fileUrl: 'https://picsum.photos/800/600?random=2',
    previewUrl: 'https://picsum.photos/800/600?random=2'
  },
  {
    id: '3',
    name: 'Electrocardiograma',
    type: 'pdf',
    category: 'Cardiología',
    date: '05 Mar, 2026',
    size: '1.2 MB',
    ipfsHash: 'Qm...p4qr',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    previewUrl: 'https://picsum.photos/800/600?random=3'
  },
  {
    id: '4',
    name: 'Resonancia Magnética Cerebral',
    type: 'image',
    category: 'Imágenes',
    date: '28 Feb, 2026',
    size: '45.3 MB',
    ipfsHash: 'Qm...t8ws',
    fileUrl: 'https://picsum.photos/800/600?random=4',
    previewUrl: 'https://picsum.photos/800/600?random=4'
  },
  {
    id: '5',
    name: 'Receta Médica - Febrero',
    type: 'pdf',
    category: 'Recetas',
    date: '20 Feb, 2026',
    size: '0.5 MB',
    ipfsHash: 'Qm...n3bc',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    previewUrl: 'https://picsum.photos/800/600?random=5'
  },
  {
    id: '6',
    name: 'Informe de Control General',
    type: 'pdf',
    category: 'Consultas',
    date: '15 Feb, 2026',
    size: '1.8 MB',
    ipfsHash: 'Qm...k7de',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    previewUrl: 'https://picsum.photos/800/600?random=6'
  },
]

const categories: string[] = ['Todos', 'Laboratorio', 'Imágenes', 'Cardiología', 'Recetas', 'Consultas']

export function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const filteredRecords: MedicalRecord[] = records.filter((record: MedicalRecord) => {
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || record.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Función para ver el archivo
  const handleView = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  // Función para descargar archivo
  const handleDownload = async (record: MedicalRecord) => {
    try {
      setDownloadingId(record.id)
      
      // Método simple para descargar
      const link = document.createElement('a')
      link.href = record.fileUrl
      link.download = `${record.name}.${record.type === 'pdf' ? 'pdf' : 'jpg'}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Simular tiempo de carga
      setTimeout(() => {
        setDownloadingId(null)
      }, 1000)
      
    } catch (error) {
      console.error('Error al descargar:', error)
      alert('Error al descargar el archivo. Por favor, intenta de nuevo.')
      setDownloadingId(null)
    }
  }

  // Modal simple sin dependencias externas
  const Modal = ({ isOpen, onClose, children }: ModalProps) => {
    if (!isOpen) return null
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-lg hover:bg-muted"
          >
            <X className="size-5" />
          </button>
          {children}
        </div>
      </div>
    )
  }

  // Renderizar vista previa
  const renderPreview = () => {
    if (!selectedRecord) return null
    
    if (selectedRecord.type === 'pdf') {
      return (
        <iframe
          src={`${selectedRecord.fileUrl}#toolbar=0`}
          className="w-full h-[60vh] rounded-lg"
          title={selectedRecord.name}
        />
      )
    } else {
      return (
        <img
          src={selectedRecord.previewUrl}
          alt={selectedRecord.name}
          className="max-w-full max-h-[60vh] object-contain rounded-lg mx-auto"
        />
      )
    }
>>>>>>> feature/Arnez
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
            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">Mis Registros Médicos</h1>
            <p className="text-sm text-foreground/60 font-medium">
              Documentos almacenados de forma segura en la red
            </p>
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border text-foreground font-bold">
            <p className="text-2xl">{loading ? '...' : stats.total}</p>
            <p className="text-xs text-foreground/50">Total</p>
          </div>
          <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border text-blue-500 font-bold">
            <p className="text-2xl">{loading ? '...' : stats.laboratorios}</p>
            <p className="text-xs text-blue-500/60">Labs</p>
          </div>
          <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border text-violet-500 font-bold">
            <p className="text-2xl">{loading ? '...' : stats.imagenes}</p>
            <p className="text-xs text-violet-500/60">Imágenes</p>
          </div>
          <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border text-amber-500 font-bold">
            <p className="text-2xl">{loading ? '...' : stats.recetas}</p>
            <p className="text-xs text-amber-500/60">Recetas</p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Buscar por título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-foreground/5 border-border text-foreground placeholder:text-foreground/30"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="w-[180px] shrink-0">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-10 bg-foreground/5 border-border text-foreground hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="todos" className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">Todos los tipos</SelectItem>
                <SelectItem value="laboratorio" className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">Laboratorio</SelectItem>
                <SelectItem value="imagen" className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">Imágenes</SelectItem>
                <SelectItem value="receta" className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">Recetas</SelectItem>
              </SelectContent>
            </Select>
          </div>
<<<<<<< HEAD
          
          <Button className="bg-foreground text-background font-black rounded-xl px-6 py-2 shadow-lg hover:scale-105 transition-all">
            <Upload className="size-4 mr-2" />
            Subir registro
          </Button>
        </div>
=======
        </CardContent>
      </Card>

      {/* Records Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRecords.map((record: MedicalRecord) => (
          <Card key={record.id} className="group transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className={`flex size-12 items-center justify-center rounded-lg ${
                  record.type === 'pdf' ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                  {record.type === 'pdf' ? (
                    <FileText className="size-6 text-destructive" />
                  ) : (
                    <Image className="size-6 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-sm font-medium line-clamp-1">
                    {record.name}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {record.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  <span>{record.date}</span>
                  <span>•</span>
                  <span>{record.size}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">IPFS: {record.ipfsHash}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleView(record)}
                  >
                    <Eye className="mr-1 size-4" />
                    Ver
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDownload(record)}
                    disabled={downloadingId === record.id}
                  >
                    {downloadingId === record.id ? (
                      'Descargando...'
                    ) : (
                      <>
                        <Download className="mr-1 size-4" />
                        Descargar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
>>>>>>> feature/Arnez
      </div>

      {/* Lista de registros */}
      <div className="space-y-4">
        {loading ? (
           <div className="py-20 text-center text-foreground/40 font-bold uppercase tracking-widest animate-pulse">Cargando registros...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-foreground/5 border border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center transition-all hover:scale-[1.01] group">
            <div className="size-20 rounded-2xl bg-foreground/5 border border-dashed border-border flex items-center justify-center mb-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-electric opacity-0 group-hover:opacity-10 transition-opacity" />
              <FileText className="size-10 text-foreground/20 group-hover:text-cyan-500 transition-all group-hover:scale-110" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/40 text-center max-w-xs leading-relaxed">
              No se encontraron registros médicos para esta cuenta.
            </p>
<<<<<<< HEAD
          </div>
        ) : (
          filteredRecords.map((record) => {
            const TypeConfig = recordTypeConfig[record.type as keyof typeof recordTypeConfig] || recordTypeConfig.laboratorio
            const TypeIcon = TypeConfig.icon

            return (
              <div key={record.id} className="bg-foreground/5 backdrop-blur-sm p-6 rounded-2xl border border-border hover:border-primary/30 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className={`size-16 rounded-2xl ${TypeConfig.bg} flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`size-8 ${TypeConfig.color}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-foreground group-hover:text-cyan-500 transition-colors tracking-tight">
                          {record.title}
                        </h3>
                        <p className="text-sm text-foreground/40 mt-1">{record.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-foreground/40 hover:text-cyan-500 hover:bg-foreground/5"
                          onClick={() => window.open(record.fileUrl, '_blank')}
                        >
                          <Eye className="size-5 mr-2" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-foreground/40 hover:text-emerald-400 hover:bg-foreground/5"
                          onClick={() => window.open(record.fileUrl, '_blank')}
                        >
                          <Download className="size-5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-6 text-xs text-foreground/40">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-cyan-500" />
                        <span>Subido: {record.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 text-blue-400" />
                        <span>Bolivia Health ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <File className="size-3.5 text-amber-500" />
                        <span>{record.fileSize}</span>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="size-6 text-foreground/20 group-hover:text-cyan-500 transition-all" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Banner de acción */}
      <div className="bg-gradient-electric rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Share2 className="size-8 text-white" />
            </div>
            <div className="text-white">
              <h3 className="text-xl font-black tracking-tight">¿Necesitas compartir estos registros?</h3>
              <p className="text-white/80 font-medium">Comparte de forma segura tus resultados con médicos y especialistas.</p>
            </div>
          </div>
          <Button className="bg-white text-cyan-600 hover:scale-105 px-10 py-7 text-lg font-black rounded-2xl shadow-xl transition-all border-none">
            Compartir Ahora
          </Button>
        </div>
      </div>

=======
          </CardContent>
        </Card>
      )}

      {/* Modal de vista previa personalizado */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{selectedRecord?.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedRecord?.category} • {selectedRecord?.date} • {selectedRecord?.size}
            </p>
          </div>
          
          <div className="mt-4">
            {renderPreview()}
          </div>
          
          <div className="mt-4 flex justify-between items-center p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono">
              Hash IPFS: {selectedRecord?.ipfsHash}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedRecord && handleDownload(selectedRecord)}
            >
              <Download className="mr-1 size-4" />
              Descargar
            </Button>
          </div>
        </div>
      </Modal>
>>>>>>> feature/Arnez
    </div>
  )
}