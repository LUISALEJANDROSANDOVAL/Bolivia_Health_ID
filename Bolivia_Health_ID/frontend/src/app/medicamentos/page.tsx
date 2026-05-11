'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  Pill, 
  Search, 
  Filter, 
  Calendar, 
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  BellOff,
  Trash2,
  Edit,
  CalendarDays,
  Timer,
  Shield,
  Sparkles,
  Package,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'

// Tipos de datos
interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string | null
  status: 'activo' | 'completado' | 'suspendido'
  reminders: boolean
  form?: 'tableta' | 'capsula' | 'inyeccion' | 'jarabe' | 'crema'
}

// Imágenes de medicamentos
const medicationImages: Record<string, { icon: string, color: string, bgGradient: string }> = {
  'Metformina': { icon: '💊', color: 'text-emerald-400', bgGradient: 'bg-emerald-400/10' },
  'Losartán': { icon: '❤️', color: 'text-rose-400', bgGradient: 'bg-rose-400/10' },
  'Amoxicilina': { icon: '🦠', color: 'text-blue-400', bgGradient: 'bg-blue-400/10' },
  'Atorvastatina': { icon: '⭐', color: 'text-purple-400', bgGradient: 'bg-purple-400/10' },
  'Paracetamol': { icon: '💊', color: 'text-amber-400', bgGradient: 'bg-amber-400/10' },
  'default': { icon: '💊', color: 'text-white', bgGradient: 'bg-white/10' }
}

// Configuración de estados
const statusConfig = {
  activo: { 
    icon: CheckCircle2, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-400/10', 
    label: 'Activo',
    borderColor: 'border-emerald-400/20'
  },
  completado: { 
    icon: CheckCircle2, 
    color: 'text-white/40', 
    bg: 'bg-white/5', 
    label: 'Completado',
    borderColor: 'border-white/5'
  },
  suspendido: { 
    icon: XCircle, 
    color: 'text-rose-400', 
    bg: 'bg-rose-400/10', 
    label: 'Suspendido',
    borderColor: 'border-rose-400/20'
  }
}

export default function MedicamentosPage() {
  const { isDbConnected, walletAddress } = useWallet()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('todos')
  const [viewMode, setViewMode] = useState<'activos' | 'historial'>('activos')

  useEffect(() => {
    async function fetchMeds() {
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
            .from('medications')
            .select('*')
            .eq('patient_id', profile.id)
          
          const mapped: Medication[] = (data || []).map(m => ({
            id: m.id,
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            startDate: m.start_date || new Date(m.created_at).toLocaleDateString(),
            endDate: m.end_date,
            status: m.status === 'active' ? 'activo' : 'completado' as any,
            reminders: true,
            form: 'tableta'
          }))
          
          setMedications(mapped)
        }
      } catch (err) {
        console.error('Error fetching meds:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isDbConnected) {
      fetchMeds()
    }
  }, [isDbConnected, walletAddress])

  // Filtrar medicamentos
  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'todos' || med.status === selectedStatus
    const matchesView = viewMode === 'activos' 
      ? med.status === 'activo' 
      : med.status !== 'activo'
    return matchesSearch && matchesStatus && matchesView
  })

  // Estadísticas
  const stats = {
    total: medications.length,
    activos: medications.filter(m => m.status === 'activo').length,
    completados: medications.filter(m => m.status === 'completado').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-in">
        
        {/* Header con estadísticas */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
              <Pill className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">Medicamentos</h1>
              <p className="text-sm text-foreground/60 font-medium">
                Gestiona tu tratamiento médico desde la base de datos
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
              <p className="text-2xl font-black text-foreground">{loading ? '...' : stats.activos}</p>
              <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest">Activos</p>
            </div>
            <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
              <p className="text-2xl font-black text-emerald-500">{loading ? '...' : stats.completados}</p>
              <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest">Completados</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setViewMode('activos')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              viewMode === 'activos' ? 'text-cyan-500' : 'text-foreground/40 hover:text-foreground'
            }`}
          >
            Tratamientos Activos
            {viewMode === 'activos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />}
          </button>
          <button
            onClick={() => setViewMode('historial')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              viewMode === 'historial' ? 'text-cyan-500' : 'text-foreground/40 hover:text-foreground'
            }`}
          >
            Historial
            {viewMode === 'historial' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <Input
              placeholder="Buscar medicamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-foreground/5 border-border text-foreground placeholder:text-foreground/30"
            />
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
             <div className="py-20 text-center text-white/40 animate-pulse">Cargando medicamentos...</div>
          ) : filteredMedications.length === 0 ? (
            <div className="bg-foreground/5 border border-dashed border-border rounded-2xl p-12 text-center">
              <div className="flex justify-center mb-4">
                <Pill className="size-16 text-foreground/10" />
              </div>
              <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">No hay medicamentos para mostrar.</p>
            </div>
          ) : (
            filteredMedications.map((med) => {
              const Status = statusConfig[med.status]
              const StatusIcon = Status.icon
              const medImage = medicationImages[med.name] || medicationImages.default
              
              return (
                <div key={med.id} className={`bg-foreground/5 backdrop-blur-sm p-6 rounded-2xl border border-border hover:border-primary/30 transition-all group border-l-4 ${Status.borderColor}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className={`size-16 rounded-2xl ${medImage.bgGradient} flex items-center justify-center shrink-0`}>
                      <span className="text-3xl">{medImage.icon}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black text-foreground group-hover:text-cyan-500 transition-colors tracking-tight uppercase">
                            {med.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-cyan-500 font-bold uppercase tracking-wider">{med.dosage}</span>
                            <span className="text-foreground/20">•</span>
                            <span className="text-sm text-foreground/60 font-medium">{med.frequency}</span>
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${Status.bg}`}>
                          <StatusIcon className={`size-4 ${Status.color}`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${Status.color}`}>{Status.label}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-6 text-xs text-white/40">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-3.5 text-cyan-500" />
                          <span>Inicio: {med.startDate}</span>
                        </div>
                        {med.endDate && (
                          <div className="flex items-center gap-2">
                            <CalendarDays className="size-3.5 text-rose-400" />
                            <span>Fin: {med.endDate}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Shield className="size-3.5 text-blue-400" />
                          <span>Bolivia Health Network</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-foreground/40 hover:text-cyan-500 hover:bg-foreground/5">
                        <Edit className="size-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white/40 hover:text-rose-400 hover:bg-white/5">
                        <Trash2 className="size-5" />
                      </Button>
                      <ChevronRight className="size-6 text-foreground/20 group-hover:text-cyan-500 transition-all" />
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