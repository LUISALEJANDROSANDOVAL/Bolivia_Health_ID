'use client'

import { useState } from 'react'
import { FileText, Image, Download, Eye, Calendar, Filter, Search, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar registros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
      </div>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-foreground">No se encontraron registros</p>
            <p className="text-sm text-muted-foreground">
              Intenta ajustar los filtros de búsqueda
            </p>
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
    </div>
  )
}