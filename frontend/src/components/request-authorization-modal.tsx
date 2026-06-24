'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  User, 
  Shield, 
  Send, 
  X,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  Building2
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { useToast } from '@/hooks/use-toast'
import { sendNotification } from '@/lib/notifications'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from '@/components/ui/skeleton'

interface Patient {
  id: string
  full_name: string
  cedula_identidad: string
  wallet_address: string
}

interface RequestAuthorizationModalProps {
  onRequestSent?: () => void
}

export function RequestAuthorizationModal({ onRequestSent }: RequestAuthorizationModalProps) {
  const { doctorId, doctorName, doctorSpecialty } = useDoctorAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patientFound, setPatientFound] = useState<Patient | null>(null)
  const [searchCI, setSearchCI] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const isGeneralDoctor = !!doctorSpecialty?.toLowerCase().includes('general')

  // Opciones de tipo de solicitud
  const [requestType, setRequestType] = useState<'individual' | 'specialty'>('individual')

  const [sucursales, setSucursales] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [selectedSucursal, setSelectedSucursal] = useState<string>('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('')
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Resetear estados al abrir/cerrar
  useEffect(() => {
    if (!open) {
      setSearchCI('')
      setPatientFound(null)
      setHasSearched(false)
      setRequestType('individual')
    }
  }, [open])

  // Cargar sucursales y especialidades de la BD
  useEffect(() => {
    async function loadOptions() {
      if (!open) return
      setLoadingOptions(true)
      try {
        const { data: listSucursales } = await supabase.from('sucursales').select('id, name')
        const { data: listSpecialties } = await supabase.from('specialties').select('id, name')
        
        if (listSucursales) {
          setSucursales(listSucursales)
          if (listSucursales.length > 0) setSelectedSucursal(listSucursales[0].id)
        }
        if (listSpecialties) {
          setSpecialties(listSpecialties)
          if (listSpecialties.length > 0) setSelectedSpecialty(listSpecialties[0].name)
        }
      } catch (err) {
        console.error('Error cargando sucursales/especialidades:', err)
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOptions()
  }, [open])

  async function handleSearch() {
    if (!searchCI.trim()) return
    
    setLoading(true)
    setHasSearched(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cedula_identidad, wallet_address')
        .eq('role', 'paciente')
        .eq('cedula_identidad', searchCI.trim())
        .single()
      
      if (error) {
        setPatientFound(null)
      } else {
        setPatientFound(data)
      }
    } catch (err) {
      console.error('Error buscando paciente:', err)
      setPatientFound(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestAccess(patient: Patient) {
    if (!doctorId) {
        toast({
            title: 'Error',
            description: 'No se pudo identificar tu perfil médico.',
            variant: 'destructive'
        })
        return
    }
    
    setIsSending(true)
    try {
      if (requestType === 'individual') {
        // 1. Verificar si ya existe solicitud directa activa o pendiente
        const { data: existing } = await supabase
          .from('access_permissions')
          .select('id, status')
          .eq('patient_id', patient.id)
          .eq('doctor_id', doctorId)
          .or('status.eq.pending,status.eq.active')
          .single()

        if (existing) {
          toast({
            title: 'Solicitud ya existe',
            description: `Ya tienes una solicitud ${existing.status === 'active' ? 'activa' : 'pendiente'} con este paciente.`,
            variant: 'destructive'
          })
          setIsSending(false)
          return
        }

        // 2. Insertar solicitud de acceso individual
        const { error: requestError } = await supabase
          .from('access_permissions')
          .insert([{
            patient_id: patient.id,
            doctor_id: doctorId,
            status: 'pending',
            requested_by: doctorId
          }])
        
        if (requestError) {
          console.error('Error insertando permiso:', requestError)
          throw requestError
        }

        // Notificar al paciente
        try {
          await sendNotification({
            recipientId: patient.id,
            senderId: doctorId,
            title: 'Nueva solicitud de acceso',
            message: `El Dr. ${doctorName} desea acceder a su historial médico de forma individual.`,
            type: 'request',
            link: '/permisos'
          })
        } catch (notifyErr) {
          console.warn('No se pudo notificar al paciente, permiso guardado:', notifyErr)
        }
      } else {
        // Solicitud por especialidad
        if (!selectedSpecialty || !selectedSucursal) {
          throw new Error('Por favor selecciona una especialidad y sucursal válidas.')
        }

        // 1. Verificar si ya existe solicitud de especialidad activa o pendiente
        const { data: existing } = await supabase
          .from('access_permissions')
          .select('id, status')
          .eq('patient_id', patient.id)
          .is('doctor_id', null)
          .eq('specialty', selectedSpecialty)
          .eq('sucursal_id', selectedSucursal)
          .or('status.eq.pending,status.eq.active')
          .single()

        if (existing) {
          toast({
            title: 'Solicitud ya existe',
            description: `Ya existe una solicitud ${existing.status === 'active' ? 'activa' : 'pendiente'} para la especialidad de ${selectedSpecialty} en esta sucursal.`,
            variant: 'destructive'
          })
          setIsSending(false)
          return
        }

        // 2. Insertar solicitud de acceso por especialidad
        const { error: requestError } = await supabase
          .from('access_permissions')
          .insert([{
            patient_id: patient.id,
            doctor_id: null,
            specialty: selectedSpecialty,
            sucursal_id: selectedSucursal,
            status: 'pending',
            requested_by: doctorId
          }])
        
        if (requestError) {
          console.error('Error insertando permiso por especialidad:', requestError)
          throw requestError
        }

        // Notificar al paciente
        try {
          const branchName = sucursales.find(s => s.id === selectedSucursal)?.name || 'nuestra sede'
          await sendNotification({
            recipientId: patient.id,
            senderId: doctorId,
            title: 'Solicitud de Acceso por Especialidad',
            message: `El Dr. ${doctorName} solicita acceso para todos los médicos de la especialidad ${selectedSpecialty} en ${branchName}.`,
            type: 'request',
            link: '/permisos'
          })
        } catch (notifyErr) {
          console.warn('No se pudo notificar al paciente, permiso guardado:', notifyErr)
        }
      }

      toast({
        title: 'Solicitud enviada',
        description: `Se ha enviado la solicitud de acceso a ${patient.full_name} correctamente.`
      })

      setOpen(false)
      if (onRequestSent) onRequestSent()
    } catch (err: any) {
      console.error('Error al enviar solicitud:', err)
      toast({
        title: 'Error',
        description: err.message || 'No se pudo enviar la solicitud.',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-azul-electrico hover:bg-white/90 shadow-lg font-bold">
          <Send className="size-4 mr-2" />
          Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-border max-w-lg rounded-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 bg-foreground/5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-electric">
              <Shield className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground">Solicitar Autorización</DialogTitle>
              <DialogDescription className="text-foreground/50">
                Busca un paciente por su CI y configura el tipo de acceso clínico
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-foreground/40 ml-1">
              Carnet de Identidad del Paciente
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
                <Input 
                  placeholder="Ej: 8765432 SC" 
                  className="pl-10 bg-foreground/5 border-border h-12 rounded-xl font-bold"
                  value={searchCI}
                  onChange={(e) => setSearchCI(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading || !searchCI.trim()}
                className="h-12 px-6 bg-azul-electrico hover:bg-azul-electrico/90 text-white font-black rounded-xl transition-all"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : 'Buscar'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="min-h-[140px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-foreground/[0.02] p-4">
              <RefreshCw className="size-8 text-azul-electrico animate-spin mx-auto mb-2" />
              <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">Buscando paciente...</p>
            </div>
          ) : patientFound ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              {/* Información del Paciente */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-foreground/[0.02] border border-border">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-azul-profundo shadow-md">
                    <User className="size-6 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-foreground text-md leading-tight">{patientFound.full_name}</p>
                    <p className="text-xs text-azul-electrico font-bold tracking-wider mt-1">
                      CI: {patientFound.cedula_identidad}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-500 font-bold uppercase text-[9px] tracking-widest">
                  Encontrado
                </Badge>
              </div>

              {/* Selector de Tipo de Acceso (Solo visible para médicos generales) */}
              {isGeneralDoctor && (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-foreground/40 ml-1">
                    Tipo de Autorización Requerida
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-foreground/5 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRequestType('individual')}
                      className={`py-2 px-3 text-xs font-black rounded-lg transition-all ${
                        requestType === 'individual'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-foreground/40 hover:text-foreground/75'
                      }`}
                    >
                      Acceso Individual (Tú)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestType('specialty')}
                      className={`py-2 px-3 text-xs font-black rounded-lg transition-all ${
                        requestType === 'specialty'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-foreground/40 hover:text-foreground/75'
                      }`}
                    >
                      Por Especialidad (Sede)
                    </button>
                  </div>
                </div>
              )}

              {/* Formularios Adicionales si es por Especialidad */}
              {requestType === 'specialty' && (
                <div className="space-y-4 p-4 rounded-2xl bg-foreground/[0.01] border border-border animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">
                        Especialidad
                      </label>
                      {loadingOptions ? (
                        <Skeleton className="h-10 w-full rounded-lg" />
                      ) : (
                        <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                          <SelectTrigger className="h-10 bg-foreground/5 border-border rounded-lg text-xs font-bold">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border">
                            {specialties.map(sp => (
                              <SelectItem key={sp.id} value={sp.name} className="text-xs font-bold">
                                {sp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">
                        Sucursal / Sede
                      </label>
                      {loadingOptions ? (
                        <Skeleton className="h-10 w-full rounded-lg" />
                      ) : (
                        <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
                          <SelectTrigger className="h-10 bg-foreground/5 border-border rounded-lg text-xs font-bold">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border">
                            {sucursales.map(su => (
                              <SelectItem key={su.id} value={su.id} className="text-xs font-bold">
                                {su.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <p className="text-[9px] text-foreground/40 leading-relaxed font-medium">
                    * El paciente autorizará el acceso a todos los profesionales vinculados a esta especialidad en la sede seleccionada.
                  </p>
                </div>
              )}

              {/* Botón de Envío */}
              <Button 
                onClick={() => handleRequestAccess(patientFound)}
                disabled={isSending || (requestType === 'specialty' && (specialties.length === 0 || sucursales.length === 0))}
                className="w-full h-12 bg-azul-electrico text-white hover:scale-[1.01] rounded-xl font-black transition-all flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            </div>
          ) : hasSearched ? (
            <div className="min-h-[140px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-foreground/[0.02] p-4 text-center animate-in fade-in slide-in-from-top-2">
              <X className="size-8 text-rose-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-black text-rose-500/60 tracking-tight">Paciente no encontrado</p>
              <p className="text-[10px] text-foreground/40 font-medium">Verifica el número de carnet e intenta de nuevo</p>
            </div>
          ) : (
            <div className="min-h-[140px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-foreground/[0.02] p-4 text-center opacity-30">
              <Search className="size-10 mx-auto mb-2" />
              <p className="text-xs font-black tracking-widest uppercase">Ingresa el CI del paciente para comenzar</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-foreground/5 border-t border-border text-center">
          <p className="text-[9px] text-foreground/45 font-semibold">
            * El paciente recibirá una notificación y deberá aprobar la solicitud para que puedas acceder a su historial.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
