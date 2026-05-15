'use client'

import { useState, useEffect } from 'react'
import {
  Stethoscope,
  Search,
  ChevronRight,
  Calendar,
  User,
  Upload,
  Share2,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  HeartPulse,
  Syringe,
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
import Link from 'next/link'

interface DiagnosisItem {
  id: string
  title: string
  date: string
  category: string
  status: string
  description: string
  doctor?: string
  doctorSpecialty?: string
  diagnosisCode?: string
  diagnosisDescription?: string
  isChronic?: boolean
}

const categoryConfig: Record<string, { icon: any; bg: string; color: string; border: string; label: string }> = {
  consulta: {
    icon: Stethoscope,
    bg: 'bg-blue-500/15',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Consulta',
  },
  vaccine: {
    icon: Syringe,
    bg: 'bg-purple-500/15',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    label: 'Vacuna',
  },
  surgery: {
    icon: HeartPulse,
    bg: 'bg-rose-500/15',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    label: 'Cirugía',
  },
  chronic: {
    icon: Activity,
    bg: 'bg-orange-500/15',
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    label: 'Crónico',
  },
  default: {
    icon: FileText,
    bg: 'bg-teal-500/15',
    color: 'text-teal-400',
    border: 'border-teal-500/30',
    label: 'Diagnóstico',
  },
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  Completa: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Completado' },
  Pendiente: { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-400/10',   label: 'Pendiente'  },
  default:   { icon: XCircle,      color: 'text-white/40',    bg: 'bg-white/5',         label: 'Registrado' },
}

export function MedicalRecords() {
  const { walletAddress } = useWallet()
  const [records, setRecords] = useState<DiagnosisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('todos')

  useEffect(() => {
    async function fetchDiagnoses() {
      if (!walletAddress) return
      setLoading(true)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()

        if (profile) {
          const { data, error } = await supabase
            .from('medical_background')
            .select(`
              *,
              diagnosis_catalog (
                code,
                description,
                is_chronic
              ),
              doctor:profiles!medical_background_doctor_id_fkey (
                full_name,
                specialty
              )
            `)
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false })

          if (error) console.error('Supabase error:', error)

          const mapped: DiagnosisItem[] = (data || []).map(r => ({
            id: r.id,
            title: r.title,
            date: new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
            category: r.category || 'consulta',
            status: r.status_detail || 'Registrado',
            description: r.description || '',
            doctor: (r.doctor as any)?.full_name,
            doctorSpecialty: (r.doctor as any)?.specialty,
            diagnosisCode: (r.diagnosis_catalog as any)?.code,
            diagnosisDescription: (r.diagnosis_catalog as any)?.description,
            isChronic: (r.diagnosis_catalog as any)?.is_chronic,
          }))

          setRecords(mapped)
        }
      } catch (err) {
        console.error('Error fetching diagnoses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDiagnoses()
  }, [walletAddress])

  const filteredRecords = records.filter(record => {
    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.diagnosisCode?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesType = selectedType === 'todos' || record.category === selectedType
    return matchesSearch && matchesType
  })

  const stats = {
    total:     records.length,
    consultas: records.filter(r => r.category === 'consulta').length,
    recetas:   records.filter(r => r.category === 'chronic').length,
    certs:     records.filter(r => r.category === 'vaccine' || r.category === 'surgery').length,
  }

  return (
    <div className="space-y-8 animate-slide-in">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
            <Activity className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">Mis Diagnósticos</h1>
            <p className="text-sm text-foreground/60 font-medium">
              Consultas, recetas y certificados de tu historial clínico
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
            <p className="text-2xl font-black text-foreground">{loading ? '…' : stats.total}</p>
            <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest mt-1">Total</p>
          </div>
          <div className="bg-blue-500/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-blue-500/20">
            <p className="text-2xl font-black text-blue-400">{loading ? '…' : stats.consultas}</p>
            <p className="text-xs text-blue-400/50 font-bold uppercase tracking-widest mt-1">Consultas</p>
          </div>
          <div className="bg-orange-500/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-orange-500/20">
            <p className="text-2xl font-black text-orange-400">{loading ? '…' : stats.recetas}</p>
            <p className="text-xs text-orange-400/50 font-bold uppercase tracking-widest mt-1">Crónicos</p>
          </div>
          <div className="bg-purple-500/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-purple-500/20">
            <p className="text-2xl font-black text-purple-400">{loading ? '…' : stats.certs}</p>
            <p className="text-xs text-purple-400/50 font-bold uppercase tracking-widest mt-1">Vacunas / Cirugías</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <Input
            placeholder="Buscar por nombre o código CIE-10..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-foreground/5 border-border text-foreground placeholder:text-foreground/30"
          />
        </div>
        <div className="flex gap-3">
          <div className="w-[180px] shrink-0">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-10 bg-foreground/5 border-border text-foreground hover:border-primary/50 transition-colors">
                <Filter className="size-3.5 mr-2 text-foreground/40" />
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="consulta">Consultas</SelectItem>
                <SelectItem value="chronic">Crónicos</SelectItem>
                <SelectItem value="vaccine">Vacunas</SelectItem>
                <SelectItem value="surgery">Cirugías</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-foreground/40 font-bold uppercase tracking-widest animate-pulse">
            Cargando diagnósticos…
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-foreground/5 border border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center group hover:scale-[1.01] transition-all">
            <div className="size-20 rounded-2xl bg-foreground/5 border border-dashed border-border flex items-center justify-center mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-electric opacity-0 group-hover:opacity-10 transition-opacity" />
              <Stethoscope className="size-10 text-foreground/20 group-hover:text-cyan-500 transition-all group-hover:scale-110" />
            </div>
            <h3 className="text-lg font-black text-foreground tracking-tight uppercase">Sin diagnósticos registrados</h3>
            <p className="text-sm text-foreground/40 mt-1 font-medium text-center max-w-xs">
              Los diagnósticos emitidos por tu médico aparecerán aquí.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const cfg = categoryConfig[record.category] ?? categoryConfig.default
            const TypeIcon = cfg.icon
            const scfg = statusConfig[record.status] ?? statusConfig.default
            const StatusIcon = scfg.icon

            return (
              <div
                key={record.id}
                className={`${cfg.bg} border ${cfg.border} backdrop-blur-sm rounded-2xl p-5 hover:scale-[1.01] transition-all group`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                  {/* Icon */}
                  <div className={`size-14 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`size-7 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        {record.isChronic && (
                          <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                            Crónico
                          </span>
                        )}
                        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full ${scfg.bg}`}>
                          <StatusIcon className={`size-3 ${scfg.color}`} />
                          <span className={`text-[10px] font-bold uppercase ${scfg.color}`}>{scfg.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-foreground/40">
                        <Calendar className="size-3.5 text-cyan-500" />
                        <span>{record.date}</span>
                      </div>
                    </div>

                    <h3 className={`text-base font-black text-foreground group-hover:${cfg.color} transition-colors tracking-tight`}>
                      {record.title}
                    </h3>

                    {/* CIE-10 badge */}
                    {record.diagnosisCode && (
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs bg-foreground/10 px-2.5 py-1 rounded-lg">
                        <span className="font-black text-cyan-400">{record.diagnosisCode}</span>
                        {record.diagnosisDescription && (
                          <span className="text-foreground/60">{record.diagnosisDescription}</span>
                        )}
                      </div>
                    )}

                    {record.description && (
                      <p className="text-sm text-foreground/50 mt-2 leading-relaxed line-clamp-2">
                        {record.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-foreground/40">
                      {record.doctor && (
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5 text-cyan-500" />
                          <span>{record.doctor}{record.doctorSpecialty ? ` · ${record.doctorSpecialty}` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`size-5 text-foreground/20 group-hover:${cfg.color} transition-all shrink-0 self-center`} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Banner */}
      <div className="bg-gradient-electric rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Share2 className="size-8 text-white" />
            </div>
            <div className="text-white">
              <h3 className="text-xl font-black tracking-tight">¿Necesitas compartir tu historial?</h3>
              <p className="text-white/80 font-medium">Comparte de forma segura tus diagnósticos con médicos y especialistas.</p>
            </div>
          </div>
          <Link href="/permisos">
            <Button className="bg-white text-cyan-600 hover:scale-105 px-10 py-7 text-lg font-black rounded-2xl shadow-xl transition-all border-none">
              Gestionar Permisos
            </Button>
          </Link>
        </div>
      </div>

    </div>
  )
}