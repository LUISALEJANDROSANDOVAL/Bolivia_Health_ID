'use client'

import { useState, useEffect } from 'react'
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
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'

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

// Configuración de iconos por tipo
const typeConfig = {
  consulta: { icon: Stethoscope, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Consulta' },
  examen: { icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Examen' },
  vacuna: { icon: Syringe, color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Vacuna' },
  receta: { icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Receta' },
  cirugia: { icon: Heart, color: 'text-rose-400', bg: 'bg-rose-400/10', label: 'Cirugía' }
}

// Configuración de estados
const statusConfig = {
  completado: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Completado' },
  pendiente: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Pendiente' },
  cancelado: { icon: XCircle, color: 'text-white/40', bg: 'bg-white/5', label: 'Cancelado' }
}

export default function HistorialPage() {
  const { isDbConnected, walletAddress } = useWallet()
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('todos')

  useEffect(() => {
    async function fetchHistory() {
      if (!walletAddress) return
      setLoading(true)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()

        if (profile) {
          // Fetch from medical_background
          const { data: background } = await supabase
            .from('medical_background')
            .select('*')
            .eq('patient_id', profile.id)

          // Fetch from health_records
          const { data: healthDocs } = await supabase
            .from('health_records')
            .select('*')
            .eq('patient_id', profile.id)

          const combined: HistoryRecord[] = [
            ...(background || []).map(b => ({
              id: b.id,
              title: b.title,
              description: b.description,
              date: b.date_recorded || new Date(b.created_at).toLocaleDateString(),
              type: (b.category === 'surgery' ? 'cirugia' : b.category === 'vaccine' ? 'vacuna' : 'consulta') as any,
              status: (b.status_detail === 'Completa' ? 'completado' : 'pendiente') as any,
              attachments: 0
            })),
            ...(healthDocs || []).map(h => ({
              id: h.id,
              title: h.title,
              description: `${h.category} - ${h.file_size}`,
              date: new Date(h.created_at).toLocaleDateString(),
              type: (h.category === 'Recetas' ? 'receta' : 'examen') as any,
              status: 'completado' as any,
              attachments: 1
            }))
          ]
          
          setRecords(combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        }
      } catch (err) {
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isDbConnected) {
      fetchHistory()
    }
  }, [isDbConnected, walletAddress])

  // Filtrar registros
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'todos' || record.type === selectedType
    return matchesSearch && matchesType
  })

  // Estadísticas
  const stats = {
    total: records.length,
    consultas: records.filter(r => r.type === 'consulta').length,
    examenes: records.filter(r => r.type === 'examen').length,
    vacunas: records.filter(r => r.type === 'vacuna').length
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
              <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">Historial Médico</h1>
              <p className="text-sm text-white/60">
                Todo tu historial clínico almacenado en la base de datos
              </p>
            </div>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
              <p className="text-2xl font-black text-foreground">{loading ? '...' : stats.total}</p>
              <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest">Total Registros</p>
            </div>
            <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
              <p className="text-2xl font-bold text-blue-500">{loading ? '...' : stats.consultas}</p>
              <p className="text-xs text-blue-500/50 font-bold uppercase tracking-widest">Consultas</p>
            </div>
            <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
              <p className="text-2xl font-bold text-emerald-500">{loading ? '...' : stats.examenes}</p>
              <p className="text-xs text-emerald-500/50 font-bold uppercase tracking-widest">Exámenes</p>
            </div>
            <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
              <p className="text-2xl font-bold text-purple-500">{loading ? '...' : stats.vacunas}</p>
              <p className="text-xs text-purple-500/50 font-bold uppercase tracking-widest">Vacunas</p>
            </div>
          </div>
        </div>

        {/* Timeline visual */}
        <div className="bg-foreground/5 backdrop-blur-sm p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="size-5 text-cyan-500" />
            <h2 className="text-lg font-black text-foreground tracking-tight">Línea de Tiempo Reciente</h2>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-foreground/10" />
            <div className="space-y-8">
              {loading ? (
                <div className="pl-12 text-foreground/40 font-bold uppercase tracking-widest animate-pulse">Cargando línea de tiempo...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="pl-12 text-foreground/40 font-bold uppercase tracking-widest italic">No hay registros para mostrar</div>
              ) : (
                filteredRecords.slice(0, 3).map((record) => {
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
                          <h3 className="font-black text-foreground tracking-tight">{record.title}</h3>
                          <span className="text-[10px] text-foreground/40 uppercase tracking-wider">{record.date}</span>
                        </div>
                        <p className="text-sm text-foreground/50 mt-1 line-clamp-2">{record.description}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <Input
              placeholder="Buscar por título o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-foreground/5 border-border text-foreground placeholder:text-foreground/30"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-foreground/5 border border-border text-foreground rounded-md px-4 py-2 text-sm cursor-pointer outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="todos" className="bg-background">Todos los tipos</option>
              <option value="consulta" className="bg-background">Consultas</option>
              <option value="examen" className="bg-background">Exámenes</option>
              <option value="vacuna" className="bg-background">Vacunas</option>
              <option value="receta" className="bg-background">Recetas</option>
            </select>
          </div>
        </div>

        {/* Lista de registros */}
        <div className="space-y-4">
            {loading ? (
               <div className="py-20 text-center text-foreground/40 font-bold uppercase tracking-widest animate-pulse">Cargando registros...</div>
            ) : filteredRecords.length === 0 ? (
            <div className="bg-foreground/5 border border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center transition-all hover:scale-[1.01] group">
              <div className="size-20 rounded-2xl bg-foreground/5 border border-dashed border-border flex items-center justify-center mb-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-electric opacity-5 group-hover:opacity-10 transition-opacity" />
                <ClipboardList className="size-10 text-foreground/20 group-hover:text-cyan-500 transition-all group-hover:scale-110" />
              </div>
              <h3 className="text-lg font-black text-foreground tracking-tight uppercase">No se encontraron registros</h3>
              <p className="text-sm text-foreground/40 mt-1 font-medium">
                Asegúrate de estar conectado o intenta con otros filtros.
              </p>
              <Link href="/subir" className="mt-6 block">
                <Button className="bg-foreground text-background font-black rounded-xl px-10 py-3 shadow-xl hover:scale-105 transition-all">
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
                <div key={record.id} className="bg-foreground/5 backdrop-blur-sm border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className={`rounded-xl ${typeConfig[record.type].bg} p-3 shrink-0 self-start`}>
                      <TypeIcon className={`size-6 ${typeConfig[record.type].color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-foreground group-hover:text-cyan-500 transition-colors tracking-tight">
                              {record.title}
                            </h3>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${typeConfig[record.type].bg} ${typeConfig[record.type].color}`}>
                              {typeConfig[record.type].label}
                            </span>
                          </div>
                          <p className="text-sm text-white/60 mt-1">{record.description}</p>
                        </div>
                        
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${Status.bg}`}>
                          <StatusIcon className={`size-3 ${Status.color}`} />
                          <span className={`text-[10px] font-bold uppercase ${Status.color}`}>{Status.label}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-6 text-xs text-foreground/40">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-cyan-500" />
                          <span>{record.date}</span>
                        </div>
                        {record.doctor && (
                          <div className="flex items-center gap-1.5">
                            <User className="size-3.5 text-cyan-500" />
                            <span>{record.doctor}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Hospital className="size-3.5 text-cyan-500" />
                          <span>{record.institution || 'Bolivia Health Network'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                      <Button variant="ghost" size="sm" className="text-foreground/60 hover:text-cyan-500 hover:bg-foreground/5 transition-all text-xs font-black uppercase tracking-widest">
                        <Eye className="size-4 mr-2" />
                        Ver detalle
                      </Button>
                      <ChevronRight className="size-5 text-foreground/20 group-hover:text-cyan-500 transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}