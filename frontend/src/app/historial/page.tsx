'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  ClipboardList, 
  Search,
  Calendar, 
  Activity,
  Heart,
  Stethoscope,
  Syringe,
  FileText,
  Clock,
  User,
  Hospital,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react'
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
import { MockDataGenerator } from '@/components/mock-data-generator'

interface HistoryRecord {
  id: string
  title: string
  description: string
  date: string
  rawDate: Date
  type: 'consulta' | 'examen' | 'vacuna' | 'receta' | 'cirugia'
  doctor?: string
  institution?: string
  status: 'completado' | 'pendiente' | 'cancelado'
  attachments?: number
}

const typeConfig = {
  consulta: { icon: Stethoscope, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', dot: 'bg-blue-400', label: 'Consulta' },
  examen:   { icon: Activity,    color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', dot: 'bg-emerald-400', label: 'Examen' },
  vacuna:   { icon: Syringe,     color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', dot: 'bg-purple-400', label: 'Vacuna' },
  receta:   { icon: FileText,    color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', dot: 'bg-amber-400', label: 'Receta' },
  cirugia:  { icon: Heart,       color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', dot: 'bg-rose-400', label: 'Cirugía' },
}

const statusConfig = {
  completado: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Completado' },
  pendiente:  { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-400/10',   label: 'Pendiente' },
  cancelado:  { icon: XCircle,      color: 'text-white/40',    bg: 'bg-white/5',         label: 'Cancelado' },
}

export default function HistorialPage() {
  const { walletAddress } = useWallet()
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
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
          const { data: background } = await supabase
            .from('medical_background')
            .select('*')
            .eq('patient_id', profile.id)

          const { data: healthDocs } = await supabase
            .from('health_records')
            .select('*')
            .eq('patient_id', profile.id)

          const combined: HistoryRecord[] = [
            ...(background || []).map(b => ({
              id: b.id,
              title: b.title,
              description: b.description,
              rawDate: new Date(b.created_at),
              date: new Date(b.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              type: (b.category === 'surgery' ? 'cirugia' : b.category === 'vaccine' ? 'vacuna' : 'consulta') as any,
              status: (b.status_detail === 'Completa' ? 'completado' : 'pendiente') as any,
              institution: b.institution,
              doctor: b.doctor,
              attachments: 0,
            })),
            ...(healthDocs || []).map(h => ({
              id: h.id,
              title: h.title,
              description: `${h.category} · ${h.file_size}`,
              rawDate: new Date(h.created_at),
              date: new Date(h.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              type: (h.category === 'Recetas' ? 'receta' : 'examen') as any,
              status: 'completado' as any,
              attachments: 1,
            }))
          ]

          setRecords(combined.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()))
        }
      } catch (err) {
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [walletAddress])

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'todos' || record.type === selectedType
    return matchesSearch && matchesType
  })

  // Group records by year
  const groupedByYear = filteredRecords.reduce<Record<string, HistoryRecord[]>>((acc, record) => {
    const year = record.rawDate.getFullYear().toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(record)
    return acc
  }, {})

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a))

  const stats = {
    total:     records.length,
    consultas: records.filter(r => r.type === 'consulta').length,
    examenes:  records.filter(r => r.type === 'examen').length,
    vacunas:   records.filter(r => r.type === 'vacuna').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-in">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
              <ClipboardList className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">Línea del Tiempo</h1>
              <p className="text-sm text-white/60">Tu historial clínico en orden cronológico</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Total Registros', value: stats.total, color: 'text-foreground', subColor: 'text-foreground/50' },
              { label: 'Consultas',       value: stats.consultas, color: 'text-blue-400',    subColor: 'text-blue-400/50' },
              { label: 'Exámenes',        value: stats.examenes,  color: 'text-emerald-400', subColor: 'text-emerald-400/50' },
              { label: 'Vacunas',         value: stats.vacunas,   color: 'text-purple-400',  subColor: 'text-purple-400/50' },
            ].map(stat => (
              <div key={stat.label} className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
                <p className={`text-2xl font-black ${stat.color}`}>{loading ? '…' : stat.value}</p>
                <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${stat.subColor}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <Input
              placeholder="Buscar evento médico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-foreground/5 border-border text-foreground placeholder:text-foreground/30"
            />
          </div>
          <div className="flex gap-2 w-full lg:w-[220px] shrink-0">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-10 bg-foreground/5 border-border text-foreground hover:border-cyan-500/50 transition-colors">
                <Filter className="size-3.5 mr-2 text-foreground/40" />
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="consulta">Consultas</SelectItem>
                <SelectItem value="examen">Exámenes</SelectItem>
                <SelectItem value="vacuna">Vacunas</SelectItem>
                <SelectItem value="receta">Recetas</SelectItem>
                <SelectItem value="cirugia">Cirugías</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <MockDataGenerator onGenerate={() => window.location.reload()} />
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-6 animate-pulse">
                <div className="flex flex-col items-center">
                  <div className="size-10 rounded-full bg-foreground/10" />
                  <div className="w-px flex-1 bg-foreground/5 mt-2" />
                </div>
                <div className="flex-1 pb-8">
                  <div className="h-4 bg-foreground/10 rounded w-1/4 mb-3" />
                  <div className="h-24 bg-foreground/5 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-foreground/5 border border-dashed border-border rounded-2xl p-16 flex flex-col items-center justify-center">
            <div className="size-20 rounded-2xl bg-foreground/5 border border-dashed border-border flex items-center justify-center mb-6">
              <ClipboardList className="size-10 text-foreground/20" />
            </div>
            <h3 className="text-lg font-black text-foreground tracking-tight uppercase">Sin eventos registrados</h3>
            <p className="text-sm text-foreground/40 mt-1 font-medium text-center">
              Conecta tu cuenta o intenta con otros filtros.
            </p>
          </div>
        ) : (
          <div className="relative">
            {sortedYears.map((year, yearIdx) => (
              <div key={year} className="mb-2">
                {/* Year marker */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center px-4 py-1.5 rounded-full bg-gradient-electric text-white text-sm font-black tracking-widest shadow-lg">
                    {year}
                  </div>
                  <div className="flex-1 h-px bg-foreground/10" />
                  <span className="text-xs text-foreground/30 font-bold uppercase tracking-widest">
                    {groupedByYear[year].length} evento{groupedByYear[year].length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Events in this year */}
                <div className="relative ml-3">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-foreground/10" />

                  <div className="space-y-4">
                    {groupedByYear[year].map((record, idx) => {
                      const cfg = typeConfig[record.type]
                      const TypeIcon = cfg.icon
                      const StatusCfg = statusConfig[record.status]
                      const StatusIcon = StatusCfg.icon
                      const isLast = idx === groupedByYear[year].length - 1 && yearIdx === sortedYears.length - 1

                      return (
                        <div key={record.id} className="relative flex gap-5 pb-4">
                          {/* Timeline dot */}
                          <div className="relative z-10 flex flex-col items-center shrink-0">
                            <div className={`size-9 rounded-full ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center shadow-lg`}>
                              <TypeIcon className={`size-4 ${cfg.color}`} />
                            </div>
                          </div>

                          {/* Card */}
                          <div className={`flex-1 ${cfg.bg} border ${cfg.border} rounded-2xl p-5 hover:scale-[1.01] transition-all group cursor-pointer`}>
                            {/* Card header */}
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                                  {cfg.label}
                                </span>
                                <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full ${StatusCfg.bg}`}>
                                  <StatusIcon className={`size-3 ${StatusCfg.color}`} />
                                  <span className={`text-[10px] font-bold uppercase ${StatusCfg.color}`}>{StatusCfg.label}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-foreground/40">
                                <Calendar className="size-3.5 text-cyan-500" />
                                <span>{record.date}</span>
                              </div>
                            </div>

                            {/* Title & description */}
                            <h3 className={`text-base font-black text-foreground tracking-tight group-hover:${cfg.color} transition-colors`}>
                              {record.title}
                            </h3>
                            <p className="text-sm text-foreground/50 mt-1 leading-relaxed">{record.description}</p>

                            {/* Meta */}
                            <div className="mt-4 flex flex-wrap gap-4 text-xs text-foreground/40">
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
                              {record.attachments ? (
                                <div className="flex items-center gap-1.5">
                                  <FileText className="size-3.5 text-amber-400" />
                                  <span>{record.attachments} archivo{record.attachments > 1 ? 's' : ''} adjunto{record.attachments > 1 ? 's' : ''}</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* End of timeline marker */}
            <div className="flex items-center gap-3 ml-3 mt-2">
              <div className="size-9 rounded-full bg-foreground/5 border-2 border-dashed border-border flex items-center justify-center">
                <Clock className="size-4 text-foreground/20" />
              </div>
              <span className="text-xs text-foreground/30 font-bold uppercase tracking-widest">Inicio del historial</span>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}