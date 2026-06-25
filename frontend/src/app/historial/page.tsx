'use client'

import { useState, useEffect, useMemo } from 'react'
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
  XCircle,
  Filter,
  Lock,
  User,
  Hospital,
  CheckCircle2,
  Eye,
  Link2,
  X,
  Loader2,
  Download,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { generateSingleDiagnosisPDF } from '@/lib/pdf-helper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'
import { useReadContract } from 'wagmi'
import { MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI } from '@/lib/contracts'
import { getAddress } from 'viem'

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
  fileUrl?: string
  source: 'blockchain' | 'supabase'
  raw?: any
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
  const [supabaseRecords, setSupabaseRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('todos')
  const [fileViewerUrl, setFileViewerUrl] = useState<string | null>(null)

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [detailMeds, setDetailMeds] = useState<any[]>([])
  const [loadingMedsForDetail, setLoadingMedsForDetail] = useState(false)
  const [patientProfile, setPatientProfile] = useState<any>(null)

  const parseDescription = (descStr: string) => {
    if (!descStr) return {}
    const parts = descStr.split(' | ')
    const result: {
      reason?: string
      anamnesis?: string
      physicalExam?: string
      observations?: string
      ipfs?: string
      tx?: string
    } = {}

    parts.forEach(part => {
      if (part.startsWith('Motivo: ')) result.reason = part.replace('Motivo: ', '')
      else if (part.startsWith('Anamnesis: ')) result.anamnesis = part.replace('Anamnesis: ', '')
      else if (part.startsWith('Examen físico: ')) result.physicalExam = part.replace('Examen físico: ', '')
      else if (part.startsWith('Observaciones: ')) result.observations = part.replace('Observaciones: ', '')
      else if (part.startsWith('IPFS: ')) result.ipfs = part.replace('IPFS: ', '')
      else if (part.startsWith('Tx: ')) result.tx = part.replace('Tx: ', '')
    })
    return result
  }

  const fetchDetailMeds = async (patientId: string, diagId: string | null, dateRecorded: string) => {
    setLoadingMedsForDetail(true)
    try {
      let query = supabase
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)

      if (diagId) {
        query = query.eq('diagnosis_id', diagId)
      } else if (dateRecorded) {
        query = query.eq('start_date', dateRecorded)
      }

      const { data, error } = await query
      if (error) throw error
      setDetailMeds(data || [])
    } catch (err) {
      console.error('Error fetching detail meds:', err)
      setDetailMeds([])
    } finally {
      setLoadingMedsForDetail(false)
    }
  }

  const handleViewDetail = (item: any) => {
    setSelectedRecord(item)
    if (item.patient_id) {
      const dateStr = item.date_recorded || (item.created_at ? item.created_at.split('T')[0] : '')
      fetchDetailMeds(item.patient_id, item.diagnosis_id ?? null, dateStr)
    }
  }

  // 1. Leer registros directo de la blockchain (fuente primaria)
  // getAddress() convierte a checksum EIP-55 que viem requiere para address types
  const checksumWallet = walletAddress ? (() => { try { return getAddress(walletAddress) } catch { return null } })() : null

  const { data: blockchainData, isLoading: blockchainLoading, error: blockchainError } = useReadContract({
    address: MEDICAL_RECORDS_ADDRESS,
    abi: MEDICAL_RECORDS_ABI,
    functionName: 'getRecords',
    args: checksumWallet ? [checksumWallet as `0x${string}`] : undefined,
    query: { enabled: !!checksumWallet }
  })

  // 2. Convertir registros de blockchain en HistoryRecord (fuente de verdad)
  const blockchainRecords = useMemo<HistoryRecord[]>(() => {
    if (!blockchainData) return []
    return (blockchainData as any[]).map((r, idx) => {
      const ipfsHash = r.ipfsHash as string
      const timestamp = Number(r.timestamp) * 1000 // unix -> ms
      const date = new Date(timestamp)
      return {
        id: `chain-${idx}-${ipfsHash.slice(0, 8)}`,
        title: `Documento Médico #${idx + 1}`,
        description: `Archivo registrado en Bolivia Health Network`,
        date: date.toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        rawDate: date,
        type: 'examen' as const,
        status: 'completado' as const,
        attachments: 1,
        fileUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        source: 'blockchain' as const,
      }
    })
  }, [blockchainData])

  // 3. Fetch Supabase (fuente secundaria con metadatos)
  useEffect(() => {
    async function fetchHistory() {
      if (!walletAddress) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()

        if (profile) {
          setPatientProfile(profile)
          const { data: background } = await supabase
            .from('medical_background')
            .select(`
              *,
              diagnosis_catalog (
                code,
                description,
                is_chronic
              )
            `)
            .eq('patient_id', profile.id)
            .not('doctor_id', 'is', null)
            .order('created_at', { ascending: false })

          // Enriquecer con nombres de médicos desde profiles_public
          const bgDoctorIds = [...new Set((background || []).map((r: any) => r.doctor_id).filter(Boolean))] as string[]
          let doctorMap: Record<string, any> = {}
          if (bgDoctorIds.length > 0) {
            const { data: doctors } = await supabase
              .from('profiles_public')
              .select('id, full_name, specialty')
              .in('id', bgDoctorIds)
            doctorMap = Object.fromEntries((doctors || []).map(d => [d.id, d]))
          }

          const { data: healthDocs } = await supabase
            .from('health_records')
            .select('*')
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false })
          // Filtrar health_records con file_url mock
          const realHealthDocs = (healthDocs || []).filter(h => !h.file_url?.startsWith('mock_'))

          const combined: HistoryRecord[] = [
            ...(background || []).map(b => {
              const ipfsMatch = (b.description || '').match(/IPFS:\s*([a-zA-Z0-9]+)/)
              const ipfs = ipfsMatch ? ipfsMatch[1] : null
              const doctorInfo = b.doctor_id ? doctorMap[b.doctor_id] : null
              return {
                id: b.id,
                title: b.title,
                description: b.description,
                rawDate: new Date(b.created_at),
                date: new Date(b.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                type: (b.category === 'surgery' ? 'cirugia' : b.category === 'vaccine' ? 'vacuna' : 'consulta') as any,
                status: (b.status_detail === 'Completa' ? 'completado' : 'pendiente') as any,
                institution: b.institution,
                doctor: doctorInfo?.full_name || undefined,
                attachments: ipfs ? 1 : 0,
                fileUrl: ipfs ? `https://gateway.pinata.cloud/ipfs/${ipfs}` : undefined,
                source: 'supabase' as const,
                raw: { ...b, doctor: doctorInfo }
              }
            }),
            ...(realHealthDocs || []).map(h => ({
              id: h.id,
              title: h.title,
              description: `${h.category === 'Laboratorio' || h.category === 'Imágenes' ? 'Estudios' : h.category === 'Recetas' ? 'Medicamentos' : h.category === 'Otros' ? 'Diagnósticos' : h.category} · ${h.file_size}`,
              rawDate: new Date(h.created_at),
              date: new Date(h.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              type: (h.category === 'Recetas' ? 'receta' : 'examen') as any,
              status: 'completado' as any,
              attachments: 1,
              fileUrl: h.file_url ? (h.file_url.startsWith('http') ? h.file_url : `https://gateway.pinata.cloud/ipfs/${h.file_url}`) : undefined,
              source: 'supabase' as const,
              raw: h
            }))
          ]

          setSupabaseRecords(combined)
        }
      } catch (err) {
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [walletAddress])

  // 4. Fusionar: Combinar Supabase (metadatos ricos) + blockchain (registros on-chain)
  //    Deduplicar por IPFS hash: si Supabase ya tiene el hash, no agregar el de blockchain.
  const records = useMemo<HistoryRecord[]>(() => {
    // Recopilar todos los hashes IPFS que ya tiene Supabase
    const supabaseIpfsHashes = new Set(
      supabaseRecords
        .map(r => {
          const match = (r.description || '').match(/IPFS:\s*([a-zA-Z0-9]+)/)
          return match ? match[1] : null
        })
        .filter(Boolean)
    )

    // Registros de blockchain que NO están ya en Supabase
    const onlyOnChain = blockchainRecords.filter(r => {
      const hash = r.fileUrl ? r.fileUrl.split('/ipfs/')[1] : null
      return !hash || !supabaseIpfsHashes.has(hash)
    })

    // Combinar: Supabase primero (más completo), luego los exclusivos de blockchain
    return [...supabaseRecords, ...onlyOnChain].sort(
      (a, b) => b.rawDate.getTime() - a.rawDate.getTime()
    )
  }, [supabaseRecords, blockchainRecords])

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
        </div>

        {/* Timeline */}
        {(loading || blockchainLoading) ? (
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

                      const parts = (record.description || '')
                        .split(' | ')
                        .filter((p: string) =>
                          !p.startsWith('IPFS:') &&
                          !p.startsWith('Tx:') &&
                          !p.match(/^0x[a-fA-F0-9]{40,}/)
                        )

                      return (
                        <div key={record.id} className="relative flex gap-5 pb-4">
                          {/* Timeline dot */}
                          <div className="relative z-10 flex flex-col items-center shrink-0">
                            <div className={`size-9 rounded-full ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center shadow-lg`}>
                              <TypeIcon className={`size-4 ${cfg.color}`} />
                            </div>
                          </div>

                          {/* Card */}
                          <div 
                            className={`flex-1 ${cfg.bg} border ${cfg.border} rounded-2xl p-5 hover:scale-[1.01] transition-all group cursor-pointer`}
                            onClick={() => {
                              const cat = (record.raw?.category || '').toLowerCase()
                              if (cat === 'laboratorio' || cat === 'imágenes' || cat === 'imagen' || cat === 'radiología' || cat === 'radiologia' || cat === 'genético' || cat === 'genetico' || cat === 'estudios') {
                                if (record.fileUrl) {
                                  setFileViewerUrl(record.fileUrl)
                                } else if (record.raw) {
                                  handleViewDetail(record.raw)
                                }
                              } else {
                                // Diagnósticos, Consultas, Recetas, etc.
                                if (record.raw) {
                                  handleViewDetail(record.raw)
                                } else if (record.fileUrl) {
                                  setFileViewerUrl(record.fileUrl)
                                }
                              }
                            }}
                          >
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
                                {record.source === 'blockchain' && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                                    <Link2 className="size-2.5 text-cyan-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Blockchain</span>
                                  </div>
                                )}
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
                            
                            {/* Description fields as chips */}
                            {parts.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {parts.map((part: string, i: number) => {
                                  const [label, ...rest] = part.split(': ')
                                  const val = rest.join(': ')
                                  if (!val) return (
                                    <span key={i} className="text-sm text-foreground/70">{label}</span>
                                  )
                                  return (
                                    <div key={i} className="flex items-baseline gap-1 bg-foreground/5 border border-border/30 rounded-lg px-2.5 py-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">{label}:</span>
                                      <span className="text-xs text-foreground font-semibold">{val}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* Meta */}
                            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex flex-wrap gap-4 text-xs text-foreground/40">
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

                              {record.fileUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-foreground/40 hover:text-cyan-500 hover:bg-cyan-500/5 text-[10px] font-black uppercase tracking-widest h-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const cat = (record.raw?.category || '').toLowerCase()
                                    if (cat === 'laboratorio' || cat === 'imágenes' || cat === 'imagen' || cat === 'radiología' || cat === 'radiologia' || cat === 'genético' || cat === 'genetico' || cat === 'estudios') {
                                      if (record.fileUrl) setFileViewerUrl(record.fileUrl)
                                      else if (record.raw) handleViewDetail(record.raw)
                                    } else {
                                      if (record.raw) handleViewDetail(record.raw)
                                      else if (record.fileUrl) setFileViewerUrl(record.fileUrl)
                                    }
                                  }}
                                >
                                  <Eye className="size-4 mr-1.5 text-cyan-500 group-hover:text-cyan-400 transition-colors" />
                                  Ver Documento Completo
                                </Button>
                              )}
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

      {/* File Viewer Dialog */}
      <Dialog open={fileViewerUrl !== null} onOpenChange={(open) => { if (!open) setFileViewerUrl(null) }}>
        <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] rounded-2xl bg-black/95 backdrop-blur-xl border-border/50 shadow-2xl p-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <h3 className="text-white font-bold text-sm tracking-widest uppercase">Visor de Archivos</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFileViewerUrl(null)}
              className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 w-full h-full p-0 overflow-hidden relative bg-black/50 flex items-center justify-center">
            {fileViewerUrl && (
              <iframe
                src={fileViewerUrl}
                className="w-full h-full border-0 rounded-b-2xl bg-white"
                title="Visor de Documento"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Selected Record Dialog */}
      <Dialog open={selectedRecord !== null} onOpenChange={(open) => { if (!open) setSelectedRecord(null) }}>
        <DialogContent 
          showCloseButton={false}
          className="w-full sm:max-w-3xl max-h-[85vh] rounded-2xl border-border bg-card shadow-2xl p-0 overflow-hidden flex flex-col"
        >
          {selectedRecord && (() => {
            const item = selectedRecord
            const parsed = parseDescription(item.description)
            
            return (
              <div className="flex flex-col max-h-[85vh] overflow-hidden flex-1">
                {/* Header con gradiente premium */}
                <div className="bg-gradient-premium p-6 text-white shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                        Diagnóstico Registrado
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const parsed = parseDescription(item.description)
                          const blob = await generateSingleDiagnosisPDF({
                            title: item.title,
                            date: new Date(item.created_at || item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
                            patientName: patientProfile?.full_name || 'Paciente del Sistema',
                            patientCi: patientProfile?.cedula_identidad || 'N/A',
                            doctorName: item.doctor?.full_name || item.doctor || '',
                            doctorLicense: '', 
                            doctorSpecialty: item.doctor?.specialty || '',
                            soap: {
                              reason: parsed.reason,
                              anamnesis: parsed.anamnesis,
                              physicalExam: parsed.physicalExam,
                              observations: parsed.observations
                            },
                            medications: detailMeds.map(m => ({
                              name: m.name,
                              dosage: m.dosage,
                              frequency: m.frequency,
                              duration: m.end_date ? `Hasta: ${m.end_date}` : 'N/A'
                            })),
                            ipfsHash: item.ipfsHash || item.ipfs,
                            txHash: item.txHash || item.tx
                          })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `diagnostico_${item.title.replace(/\s+/g, '_')}.pdf`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md gap-1.5 h-8 px-3 font-bold rounded-lg"
                      >
                        <Download className="size-3.5" />
                        <span>PDF</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedRecord(null)}
                        className="h-8 w-8 rounded-full text-white hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogTitle className="text-2xl font-black text-white">{item.title}</DialogTitle>
                  <DialogDescription className="sr-only">
                    Detalles del diagnóstico, caso clínico SOAP y medicamentos prescritos.
                  </DialogDescription>
                  <p className="text-white/60 text-xs mt-1 uppercase tracking-widest font-bold">
                    ID Registro: {String(item.id).slice(0, 8)}...
                  </p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* Datos del Diagnóstico */}
                  <div className="rounded-xl bg-muted/20 p-4 border border-muted/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Información del Registro</h4>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Paciente</p>
                        <p className="text-sm font-bold text-foreground">
                          {patientProfile?.full_name || 'Paciente del Sistema'}
                        </p>
                        {patientProfile?.cedula_identidad && (
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            CI: {patientProfile.cedula_identidad}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Médico Tratante</p>
                        <p className="text-sm font-bold text-foreground">
                          {item.doctor?.full_name ? `Dr(a). ${item.doctor.full_name}` : item.doctor ? `Dr(a). ${item.doctor}` : 'Médico del Sistema'}
                        </p>
                        {item.doctor?.specialty && (
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            {item.doctor.specialty}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Fecha de Registro</p>
                        <p className="text-sm font-bold text-foreground">
                          {new Date(item.created_at || item.date || item.rawDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SOAP / Caso Clínico */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Evaluación Clínica (SOAP)</h4>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {parsed.reason && (
                        <div className="bg-muted/10 p-3 rounded-lg border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">1. Motivo de Consulta</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{parsed.reason}</p>
                        </div>
                      )}
                      {parsed.anamnesis && (
                        <div className="bg-muted/10 p-3 rounded-lg border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">2. Anamnesis y Antecedentes</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{parsed.anamnesis}</p>
                        </div>
                      )}
                      {parsed.physicalExam && (
                        <div className="bg-muted/10 p-3 rounded-lg border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">3. Examen Físico</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{parsed.physicalExam}</p>
                        </div>
                      )}
                      {parsed.observations && (
                        <div className="bg-muted/10 p-3 rounded-lg border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Observaciones / Recomendaciones</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{parsed.observations}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medicamentos Prescritos */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Tratamiento Farmacológico</h4>
                    
                    {loadingMedsForDetail ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      </div>
                    ) : detailMeds.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No hay medicamentos registrados en este diagnóstico.</p>
                    ) : (
                      <div className="divide-y rounded-xl border overflow-hidden">
                        {detailMeds.map((med, index) => (
                          <div key={med.id} className="p-3 bg-card hover:bg-muted/20 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-black text-xs">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-black text-foreground">
                                  {med.name} <span className="text-primary font-bold text-xs ml-1">{med.dosage}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Frecuencia: {med.frequency} {med.start_date && `• Desde: ${new Date(med.start_date.replace(/-/g, '/')).toLocaleDateString('es-ES')}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Verificación Blockchain */}
                  <div className="bg-azul-profundo/95 text-white p-4 rounded-xl shadow-xl border border-white/10">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Integridad Digital Blockchain</h4>
                        <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                          {parsed.tx || item.txHash || item.tx
                            ? 'Este registro se encuentra firmado digitalmente e integrado de forma segura en la blockchain de Avalanche.' 
                            : 'Este diagnóstico fue registrado localmente sin firma criptográfica.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}