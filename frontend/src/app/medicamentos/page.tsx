'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  Pill, 
  Search, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  CalendarDays,
  Loader2,
  Sparkles,
  Syringe,
  Droplets
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'

// Tipos de datos
interface Medication {
  id: string
  name: string
  genericName?: string
  brandName?: string
  form?: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string | null
  status: 'activo' | 'completado' | 'suspendido'
  diagnosisCode?: string
  diagnosisDesc?: string
  createdAt: string
  doctorId?: string
}

// Configuración de estados
const statusConfig = {
  activo: { 
    icon: CheckCircle2, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-400/10', 
    label: 'Activo',
    borderColor: 'border-emerald-400/30'
  },
  completado: { 
    icon: CheckCircle2, 
    color: 'text-white/40', 
    bg: 'bg-white/5', 
    label: 'Completado',
    borderColor: 'border-white/10'
  },
  suspendido: { 
    icon: XCircle, 
    color: 'text-rose-400', 
    bg: 'bg-rose-400/10', 
    label: 'Suspendido',
    borderColor: 'border-rose-400/30'
  }
}

// Pill icon by form
const formIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  'tableta': Pill,
  'cápsula': Pill,
  'capsula': Pill,
  'inyección': Syringe,
  'inyeccion': Syringe,
  'jarabe': Droplets,
  'crema': Droplets,
  'gotas': Droplets,
  'default': Pill,
}

const groupColors = [
  { border: 'border-t-cyan-500', badge: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border-cyan-500/20', text: 'text-cyan-500 dark:text-cyan-400' },
  { border: 'border-t-purple-500', badge: 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20', text: 'text-purple-500 dark:text-purple-400' },
  { border: 'border-t-amber-500', badge: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20', text: 'text-amber-500 dark:text-amber-400' },
  { border: 'border-t-pink-500', badge: 'bg-pink-500/10 text-pink-500 dark:text-pink-400 border-pink-500/20', text: 'text-pink-500 dark:text-pink-400' },
  { border: 'border-t-indigo-500', badge: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20', text: 'text-indigo-500 dark:text-indigo-400' },
  { border: 'border-t-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20', text: 'text-emerald-500 dark:text-emerald-400' }
]

function getGroupTheme(groupKey: string) {
  let hash = 0
  for (let i = 0; i < groupKey.length; i++) {
    hash = groupKey.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % groupColors.length
  return groupColors[index]
}

export default function MedicamentosPage() {
  const { walletAddress } = useWallet()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'activos' | 'historial'>('activos')
  const [aiDescriptions, setAiDescriptions] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({})

  // Cargar descripciones de IA guardadas
  useEffect(() => {
    const cached = localStorage.getItem('medication_ai_descriptions')
    if (cached) {
      try {
        setAiDescriptions(JSON.parse(cached))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Consultar la API para obtener la descripción con Gemini
  const getAiDescription = async (medName: string) => {
    if (aiDescriptions[medName]) return
    
    setLoadingAi(prev => ({ ...prev, [medName]: true }))
    try {
      const res = await fetch('/api/medication-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicationName: medName })
      })
      
      if (!res.ok) throw new Error()
      
      const data = await res.json()
      const desc = data.description
      
      const newDescs = { ...aiDescriptions, [medName]: desc }
      setAiDescriptions(newDescs)
      localStorage.setItem('medication_ai_descriptions', JSON.stringify(newDescs))
    } catch (err) {
      toast.error('No se pudo obtener la descripción de la IA')
    } finally {
      setLoadingAi(prev => ({ ...prev, [medName]: false }))
    }
  }

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
          const { data, error } = await supabase
            .from('medications')
            .select(`
              *,
              medicine_catalog (
                generic_name,
                brand_name,
                form,
                concentration
              ),
              diagnosis_catalog (
                code,
                description
              )
            `)
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false })

          if (error) console.error('Error medications:', error)

          const mapped: Medication[] = (data || []).map(m => {
            const med = m.medicine_catalog as any
            const diag = m.diagnosis_catalog as any
            return {
              id: m.id,
              name: med?.generic_name || m.name,
              genericName: med?.generic_name,
              brandName: med?.brand_name,
              form: med?.form?.toLowerCase(),
              dosage: m.dosage || med?.concentration || '',
              frequency: m.frequency || '',
              startDate: m.start_date
                ? new Date(m.start_date.replace(/-/g, '/')).toLocaleDateString('es-ES')
                : new Date(m.created_at).toLocaleDateString('es-ES'),
              endDate: m.end_date
                ? new Date(m.end_date.replace(/-/g, '/')).toLocaleDateString('es-ES')
                : null,
              status: m.status === 'active' ? 'activo'
                : m.status === 'suspended' ? 'suspendido'
                : 'completado',
              diagnosisCode: diag?.code,
              diagnosisDesc: diag?.description,
              createdAt: m.created_at,
              doctorId: m.doctor_id
            }
          })

          setMedications(mapped)
        }
      } catch (err) {
        console.error('Error fetching meds:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMeds()
  }, [walletAddress])

  // Helper para agrupar medicamentos por consulta/prescripción
  function groupMedications(meds: Medication[]) {
    const groups: Record<string, Medication[]> = {}
    
    meds.forEach(med => {
      // Agrupar por doctor_id, diagnosis_code y proximidad de tiempo (redondeado a 10s)
      const time = med.createdAt ? new Date(med.createdAt).getTime() : 0
      const roundedTime = Math.floor(time / 10000) * 10000
      const key = `${med.doctorId || 'unknown'}_${med.diagnosisCode || 'no-diag'}_${roundedTime}`
      
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(med)
    })
    
    return Object.values(groups)
  }

  // Filtrar medicamentos
  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesView = viewMode === 'activos'
      ? med.status === 'activo'
      : med.status !== 'activo'
    return matchesSearch && matchesView
  })

  // Calcular grupos de recetas para aplicar bordes superiores distintivos en tarjetas individuales
  const groupSizes: Record<string, number> = {}
  const medGroupKeys: Record<string, string> = {}

  filteredMedications.forEach(med => {
    const time = med.createdAt ? new Date(med.createdAt).getTime() : 0
    const roundedTime = Math.floor(time / 10000) * 10000
    const key = `${med.doctorId || 'unknown'}_${med.diagnosisCode || 'no-diag'}_${roundedTime}`
    medGroupKeys[med.id] = key
    groupSizes[key] = (groupSizes[key] || 0) + 1
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
              const FormIcon = formIcon[med.form ?? 'default'] ?? formIcon.default
              const isAiLoading = loadingAi[med.name]
              const aiDesc = aiDescriptions[med.name]

              const groupKey = medGroupKeys[med.id]
              const groupSize = groupSizes[groupKey] || 0
              const isGrouped = groupSize >= 2
              const theme = isGrouped ? getGroupTheme(groupKey) : null

              return (
                <div 
                  key={med.id} 
                  className={`bg-foreground/5 backdrop-blur-sm p-6 rounded-2xl border border-border hover:border-primary/30 transition-all group border-l-4 ${Status.borderColor} ${isGrouped ? `border-t-4 ${theme?.border}` : ''}`}
                >
                  {isGrouped && (
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20 text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${theme?.badge}`}>
                          Receta Conjunta ({groupSize} medicamentos)
                        </span>
                        {med.diagnosisCode && (
                          <span className="text-foreground/40 font-semibold">
                            Diagnóstico: <span className="text-cyan-500 font-bold">{med.diagnosisCode}</span>
                            {med.diagnosisDesc && <span className="text-foreground/55 font-semibold"> - {med.diagnosisDesc}</span>}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider">
                        Prescrito en conjunto
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="size-16 rounded-2xl bg-foreground/10 flex items-center justify-center shrink-0">
                      <FormIcon className="size-8 text-foreground/70" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black text-foreground group-hover:text-cyan-500 transition-colors tracking-tight uppercase">
                            {med.name}
                          </h3>
                          {med.brandName && med.brandName !== med.name && (
                            <p className="text-xs text-foreground/40 mt-0.5">Marca: <span className="font-bold text-foreground/60">{med.brandName}</span></p>
                          )}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {med.dosage && <span className="text-sm text-cyan-500 font-bold uppercase tracking-wider">{med.dosage}</span>}
                            {med.dosage && med.frequency && <span className="text-foreground/20">•</span>}
                            {med.frequency && <span className="text-sm text-foreground/60 font-medium">{med.frequency}</span>}
                            {med.form && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/50">{med.form}</span>}
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${Status.bg}`}>
                          <StatusIcon className={`size-4 ${Status.color}`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${Status.color}`}>{Status.label}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-foreground/70">
                        <div className="flex items-center gap-2 bg-foreground/[0.03] px-2.5 py-1 rounded-lg border border-border/40">
                          <Calendar className="size-3.5 text-cyan-500 shrink-0" />
                          <span>
                            <strong className="text-foreground/90 font-semibold">Inicio:</strong> {med.startDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-foreground/[0.03] px-2.5 py-1 rounded-lg border border-border/40">
                          <CalendarDays className="size-3.5 text-rose-400 shrink-0" />
                          <span>
                            <strong className="text-foreground/90 font-semibold">Fecha Límite:</strong>{' '}
                            {med.endDate || 'Indefinido'}
                          </span>
                        </div>
                      </div>

                      {/* AI Explanation Section */}
                      <div className="mt-4 pt-4 border-t border-border/20">
                        {!aiDesc ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => getAiDescription(med.name)}
                            disabled={isAiLoading}
                            className="h-8 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-widest text-[9px] cursor-pointer"
                          >
                            {isAiLoading ? (
                              <Loader2 className="size-3 mr-2 animate-spin text-cyan-500" />
                            ) : (
                              <Sparkles className="size-3 mr-2 text-cyan-500" />
                            )}
                            Explicación de IA
                          </Button>
                        ) : (
                          <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-foreground/80 animate-in fade-in slide-in-from-top-1">
                            <Sparkles className="size-4 text-cyan-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <p className="font-bold text-[9px] text-cyan-500 uppercase tracking-widest mb-0.5">Qué hace este medicamento:</p>
                              <p className="font-medium italic">"{aiDesc}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="size-6 text-foreground/20 group-hover:text-cyan-500 transition-all shrink-0 self-center" />
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