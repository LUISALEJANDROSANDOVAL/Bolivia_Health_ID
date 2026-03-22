'use client'

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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'

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
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-foreground/5 border border-border text-foreground rounded-md px-4 py-2 text-sm cursor-pointer outline-none focus:border-primary/50 transition-colors"
          >
            <option value="todos" className="bg-background">Todos los tipos</option>
            <option value="laboratorio" className="bg-background">Laboratorio</option>
            <option value="imagen" className="bg-background">Imágenes</option>
            <option value="receta" className="bg-background">Recetas</option>
          </select>
          
          <Button className="bg-foreground text-background font-black rounded-xl px-6 py-2 shadow-lg hover:scale-105 transition-all">
            <Upload className="size-4 mr-2" />
            Subir registro
          </Button>
        </div>
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

    </div>
  )
}