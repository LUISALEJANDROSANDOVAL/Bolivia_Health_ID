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
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useReadContract } from 'wagmi'
import { MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI } from '@/lib/contracts'
import { useMemo } from 'react'
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react'
import { getAddress } from 'viem'

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
  fileUrl?: string
  ipfsHash?: string | null
  txHash?: string | null
  verificationStatus: 'verified' | 'unverified' | 'tampered'
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
  const { walletAddress, isDbConnected } = useWallet()
  const [records, setRecords] = useState<DiagnosisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('todos')

  // 1. Fetch blockchain records — usar checksum EIP-55 para que viem acepte la dirección
  const checksumWallet = walletAddress ? (() => { try { return getAddress(walletAddress) } catch { return null } })() : null

  const { data: blockchainRecords } = useReadContract({
    address: MEDICAL_RECORDS_ADDRESS,
    abi: MEDICAL_RECORDS_ABI,
    functionName: 'getRecords',
    args: checksumWallet ? [checksumWallet as `0x${string}`] : undefined,
    query: { enabled: !!checksumWallet }
  })

  // 2. Cross-reference records with blockchain
  const verifiedRecords = useMemo(() => {
    const onChainHashes = blockchainRecords ? (blockchainRecords as any[]).map(r => r.ipfsHash) : []
    return records.map(record => {
      const desc = record.description || ''
      const ipfsMatch = desc.match(/IPFS:\s*([a-zA-Z0-9]+)/)
      const txMatch = desc.match(/Tx:\s*(0x[a-fA-F0-9]+)/)
      const ipfs = ipfsMatch ? ipfsMatch[1] : null
      const tx = txMatch ? txMatch[1] : null

      let verificationStatus: 'verified' | 'unverified' | 'tampered' = 'unverified'
      if (ipfs) {
        const existsOnChain = onChainHashes.includes(ipfs)
        verificationStatus = existsOnChain ? 'verified' : 'tampered'
      }

      return {
        ...record,
        ipfsHash: ipfs,
        txHash: tx,
        verificationStatus
      }
    })
  }, [records, blockchainRecords])

  useEffect(() => {
    async function fetchDiagnoses() {
      if (!walletAddress || !isDbConnected) return
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
            fileUrl: r.file_url ? (r.file_url.startsWith('http') ? r.file_url : `https://gateway.pinata.cloud/ipfs/${r.file_url}`) : undefined,
            verificationStatus: 'unverified',
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
  }, [walletAddress, isDbConnected])

  const filteredRecords = verifiedRecords.filter(record => {
    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.diagnosisCode?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesType = selectedType === 'todos' || record.category === selectedType
    return matchesSearch && matchesType
  })

  const stats = {
    total:     verifiedRecords.length,
    consultas: verifiedRecords.filter(r => r.category === 'consulta').length,
    recetas:   verifiedRecords.filter(r => r.category === 'chronic').length,
    certs:     verifiedRecords.filter(r => r.category === 'vaccine' || r.category === 'surgery').length,
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
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-foreground/5 border border-border/30 backdrop-blur-sm rounded-2xl p-5 flex gap-5">
                <Skeleton className="size-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-4 pt-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
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

            const parts = (record.description || '')
              .split(' | ')
              .filter((p: string) =>
                !p.startsWith('IPFS:') &&
                !p.startsWith('Tx:') &&
                !p.match(/^0x[a-fA-F0-9]{40,}/)
              )

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
                        {/* Blockchain Verification Badge */}
                        {record.verificationStatus === 'verified' && (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="size-3 text-emerald-400" />
                            <span className="text-[10px] font-black uppercase text-[9px]">Verificado Blockchain</span>
                          </div>
                        )}
                        {record.verificationStatus === 'tampered' && (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
                            <ShieldAlert className="size-3 text-red-400" />
                            <span className="text-[10px] font-black uppercase text-[9px]">Datos Alterados</span>
                          </div>
                        )}
                        {record.verificationStatus === 'unverified' && record.ipfsHash && (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Shield className="size-3 text-amber-400" />
                            <span className="text-[10px] font-black uppercase text-[9px]">Falta Firma On-Chain</span>
                          </div>
                        )}
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
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-foreground/40">
                      {record.doctor && (
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5 text-cyan-500" />
                          <span>{record.doctor}{record.doctorSpecialty ? ` · ${record.doctorSpecialty}` : ''}</span>
                        </div>
                      )}
                      {record.fileUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 gap-1.5 ml-auto"
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const res = await fetch(record.fileUrl!)
                              const blob = await res.blob()
                              const contentType = res.headers.get('content-type')
                              let extension = '.pdf'
                              if (contentType?.includes('image/png')) extension = '.png'
                              else if (contentType?.includes('image/jpeg')) extension = '.jpg'
                              else if (contentType?.includes('image/webp')) extension = '.webp'

                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${record.title.replace(/\s+/g, '_')}${extension}`
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                              document.body.removeChild(a)
                            } catch (err) {
                              window.open(record.fileUrl, '_blank')
                            }
                          }}
                        >
                          <Download className="size-3" />
                          Descargar
                        </Button>
                      )}
                      {/* IPFS & Tx Links */}
                      {record.ipfsHash && (
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${record.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-cyan-500 hover:underline hover:text-cyan-400"
                        >
                          <FileText className="size-3.5" />
                          <span>IPFS</span>
                        </a>
                      )}
                      {record.txHash && (
                        <a
                          href={`https://testnet.snowtrace.io/tx/${record.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-purple-500 hover:underline hover:text-purple-400"
                        >
                          <Share2 className="size-3.5" />
                          <span>Transacción</span>
                        </a>
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