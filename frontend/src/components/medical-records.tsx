'use client'

import { useState } from 'react'
import { FileText, Image, Download, Eye, Calendar, Filter, Search } from 'lucide-react'
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

const records = [
  {
    id: '1',
    name: 'Análisis de Sangre Completo',
    type: 'pdf',
    category: 'Laboratorio',
    date: '15 Mar, 2026',
    size: '2.4 MB',
    ipfsHash: 'Qm...x7kf',
  },
  {
    id: '2',
    name: 'Radiografía de Tórax',
    type: 'image',
    category: 'Imágenes',
    date: '10 Mar, 2026',
    size: '8.1 MB',
    ipfsHash: 'Qm...9d2a',
  },
  {
    id: '3',
    name: 'Electrocardiograma',
    type: 'pdf',
    category: 'Cardiología',
    date: '05 Mar, 2026',
    size: '1.2 MB',
    ipfsHash: 'Qm...p4qr',
  },
  {
    id: '4',
    name: 'Resonancia Magnética Cerebral',
    type: 'image',
    category: 'Imágenes',
    date: '28 Feb, 2026',
    size: '45.3 MB',
    ipfsHash: 'Qm...t8ws',
  },
  {
    id: '5',
    name: 'Receta Médica - Febrero',
    type: 'pdf',
    category: 'Recetas',
    date: '20 Feb, 2026',
    size: '0.5 MB',
    ipfsHash: 'Qm...n3bc',
  },
  {
    id: '6',
    name: 'Informe de Control General',
    type: 'pdf',
    category: 'Consultas',
    date: '15 Feb, 2026',
    size: '1.8 MB',
    ipfsHash: 'Qm...k7de',
  },
]

const categories = ['Todos', 'Laboratorio', 'Imágenes', 'Cardiología', 'Recetas', 'Consultas']

export function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || record.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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
        {filteredRecords.map((record) => (
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
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="mr-1 size-4" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="mr-1 size-4" />
                    Descargar
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
    </div>
  )
}
