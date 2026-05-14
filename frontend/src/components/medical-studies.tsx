'use client'

import { useState, useEffect } from 'react'
import {
  FlaskConical,
  Search,
  Download,
  Eye,
  Calendar,
  File,
  Image,
  FileSpreadsheet,
  Upload,
  ChevronRight,
  ScanLine,
  Microscope,
  Dna,
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

interface StudyItem {
  id: string
  title: string
  date: string
  type: 'laboratorio' | 'imagen' | 'radiologia' | 'genetico' | 'otro'
  description: string
  fileSize: string
  fileUrl: string
}

const studyTypeConfig = {
  laboratorio: {
    icon: FlaskConical,
    bg: 'bg-blue-500/15',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Laboratorio',
  },
  imagen: {
    icon: Image,
    bg: 'bg-violet-500/15',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
    label: 'Imágenes',
  },
  radiologia: {
    icon: ScanLine,
    bg: 'bg-cyan-500/15',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    label: 'Radiología',
  },
  genetico: {
    icon: Dna,
    bg: 'bg-rose-500/15',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    label: 'Genético',
  },
  otro: {
    icon: FileSpreadsheet,
    bg: 'bg-amber-500/15',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'Otro',
  },
}

export function MedicalStudies() {
  const { walletAddress } = useWallet()
  const [studies, setStudies] = useState<StudyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('todos')

  useEffect(() => {
    async function fetchStudies() {
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
            .in('category', ['Laboratorio', 'Imágenes', 'Radiología', 'Genético'])
            .order('created_at', { ascending: false })

          const mapped: StudyItem[] = (data || []).map(r => {
            let mappedType: StudyItem['type'] = 'otro'
            if (r.category === 'Laboratorio') mappedType = 'laboratorio'
            else if (r.category === 'Imágenes') mappedType = 'imagen'
            else if (r.category === 'Radiología') mappedType = 'radiologia'
            else if (r.category === 'Genético') mappedType = 'genetico'

            return {
              id: r.id,
              title: r.title,
              date: new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
              type: mappedType,
              description: r.description || `${r.category} · ${r.file_size}`,
              fileSize: r.file_size,
              fileUrl: r.file_url ? `https://gateway.pinata.cloud/ipfs/${r.file_url}` : '#',
            }
          })

          setStudies(mapped)
        }
      } catch (err) {
        console.error('Error fetching studies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudies()
  }, [walletAddress])

  const filteredStudies = studies.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'todos' || s.type === selectedType
    return matchesSearch && matchesType
  })

  const stats = {
    total:        studies.length,
    laboratorio:  studies.filter(s => s.type === 'laboratorio').length,
    imagen:       studies.filter(s => s.type === 'imagen').length,
    radiologia:   studies.filter(s => s.type === 'radiologia').length,
    genetico:     studies.filter(s => s.type === 'genetico').length,
  }

  return (
    <div className="space-y-8 animate-slide-in">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
            <Microscope className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">Mis Estudios</h1>
            <p className="text-sm text-foreground/60 font-medium">
              Laboratorios, imágenes, radiologías y estudios genéticos
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
            <p className="text-2xl font-black text-foreground">{loading ? '…' : stats.total}</p>
            <p className="text-xs font-bold uppercase tracking-widest mt-1 text-foreground/50">Total</p>
          </div>
          <div className="bg-blue-500/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-blue-500/20">
            <p className="text-2xl font-black text-blue-400">{loading ? '…' : stats.laboratorio}</p>
            <p className="text-xs font-bold uppercase tracking-widest mt-1 text-blue-400/50">Laboratorio</p>
          </div>
          <div className="bg-violet-500/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-violet-500/20">
            <p className="text-2xl font-black text-violet-400">{loading ? '…' : stats.imagen}</p>
            <p className="text-xs font-bold uppercase tracking-widest mt-1 text-violet-400/50">Imágenes</p>
          </div>
          <div className="bg-cyan-500/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-cyan-500/20">
            <p className="text-2xl font-black text-cyan-400">{loading ? '…' : stats.radiologia}</p>
            <p className="text-xs font-bold uppercase tracking-widest mt-1 text-cyan-400/50">Radiología</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <Input
            placeholder="Buscar estudio médico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-foreground/5 border-border text-foreground placeholder:text-foreground/30"
          />
        </div>
        <div className="flex gap-3">
          <div className="w-[180px] shrink-0">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-10 bg-foreground/5 border-border text-foreground hover:border-cyan-500/50 transition-colors">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="laboratorio">Laboratorio</SelectItem>
                <SelectItem value="imagen">Imágenes</SelectItem>
                <SelectItem value="radiologia">Radiología</SelectItem>
                <SelectItem value="genetico">Genético</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link href="/subir">
            <Button className="bg-gradient-electric text-white font-black rounded-xl px-5 py-2 shadow-lg hover:scale-105 transition-all border-none h-10">
              <Upload className="size-4 mr-2" />
              Subir estudio
            </Button>
          </Link>
        </div>
      </div>

      {/* Studies list */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-foreground/40 font-bold uppercase tracking-widest animate-pulse">
            Cargando estudios…
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="bg-foreground/5 border border-dashed border-border rounded-2xl p-16 flex flex-col items-center justify-center group hover:scale-[1.01] transition-all">
            <div className="size-20 rounded-2xl bg-foreground/5 border border-dashed border-border flex items-center justify-center mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-electric opacity-0 group-hover:opacity-10 transition-opacity" />
              <FlaskConical className="size-10 text-foreground/20 group-hover:text-cyan-500 transition-all group-hover:scale-110" />
            </div>
            <h3 className="text-lg font-black text-foreground tracking-tight uppercase">Sin estudios registrados</h3>
            <p className="text-sm text-foreground/40 mt-1 font-medium text-center max-w-xs">
              Sube tus resultados de laboratorio, radiografías o imágenes médicas.
            </p>
            <Link href="/subir" className="mt-6">
              <Button className="bg-foreground text-background font-black rounded-xl px-10 py-3 shadow-xl hover:scale-105 transition-all">
                Subir mi primer estudio
              </Button>
            </Link>
          </div>
        ) : (
          filteredStudies.map((study) => {
            const cfg = studyTypeConfig[study.type] || studyTypeConfig.otro
            const TypeIcon = cfg.icon

            return (
              <div
                key={study.id}
                className={`${cfg.bg} border ${cfg.border} backdrop-blur-sm rounded-2xl p-5 hover:scale-[1.01] transition-all group cursor-pointer`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  {/* Icon */}
                  <div className={`size-14 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`size-7 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-lg font-black text-foreground group-hover:${cfg.color} transition-colors tracking-tight`}>
                            {study.title}
                          </h3>
                          <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/50 mt-1">{study.description}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-foreground/40 hover:text-cyan-500 hover:bg-foreground/5 text-xs font-black uppercase tracking-widest"
                          onClick={() => window.open(study.fileUrl, '_blank')}
                        >
                          <Eye className="size-4 mr-1.5" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-foreground/40 hover:text-emerald-400 hover:bg-foreground/5"
                          onClick={() => window.open(study.fileUrl, '_blank')}
                        >
                          <Download className="size-4" />
                        </Button>
                        <ChevronRight className={`size-5 text-foreground/20 group-hover:${cfg.color} transition-all translate-x-0 group-hover:translate-x-1`} />
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-3 flex flex-wrap gap-5 text-xs text-foreground/40">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-cyan-500" />
                        <span>{study.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <File className="size-3.5 text-amber-400" />
                        <span>{study.fileSize}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
