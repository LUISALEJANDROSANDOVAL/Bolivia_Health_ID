'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, User, Clock, Calendar as CalendarIcon, Loader2, Check, Sparkles, Search, ChevronRight, X, MapPin, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface Patient {
  id: string
  name: string
  ci: string
  gender?: string
}

export function QuickAppointmentCard({ onAppointmentCreated }: { onAppointmentCreated?: () => void }) {
  const { doctorId, doctorName, doctorSpecialty } = useDoctorAuth()
  const [loading, setLoading] = useState(false)
  
  // Patient Search State (Replicating Prescriptions logic)
  const [searchPatient, setSearchPatient] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  const [formData, setFormData] = useState({
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_time: '09:00',
    end_time: '09:30',
    reason: 'Consulta General',
    priority: 'normal',
    type: 'presencial',
    location: 'Consultorio A-102',
    notes: ''
  })

  // Effect for patient search (identical to prescriptions/page.tsx)
  useEffect(() => {
    const fetchPatients = async () => {
      if (!searchPatient || searchPatient.length < 2 || !doctorId) {
        setPatients([])
        return
      }

      setIsSearching(true)
      try {
        // 1. Primero obtener IDs de pacientes autorizados
        const { data: authData } = await supabase
          .from('access_permissions')
          .select('patient_id')
          .eq('doctor_id', doctorId)
          .eq('status', 'active')

        const authorizedIds = authData?.map(a => a.patient_id) || []

        if (authorizedIds.length === 0) {
          setPatients([])
          setIsSearching(false)
          return
        }

        // 2. Buscar entre esos pacientes autorizados
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, cedula_identidad')
          .in('id', authorizedIds)
          .or(`full_name.ilike.%${searchPatient}%,cedula_identidad.ilike.%${searchPatient}%`)
          .limit(5)

        if (error) throw error

        if (data) {
          const mapped: Patient[] = data.map(p => ({
            id: p.id,
            name: p.full_name || 'Sin nombre',
            ci: p.cedula_identidad || 'Sin CI',
            gender: 'M' // Default
          }))
          setPatients(mapped)
        }
      } catch (err) {
        console.error('Error buscando pacientes:', err)
      } finally {
        setIsSearching(false)
      }
    }

    const timer = setTimeout(() => {
      fetchPatients()
    }, 400)

    return () => clearTimeout(timer)
  }, [searchPatient, doctorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !doctorId) {
      toast.error('Por favor seleccione un paciente')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          doctor_id: doctorId,
          patient_id: selectedPatient.id,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          end_time: formData.end_time,
          reason: formData.reason,
          priority: formData.priority,
          location: formData.location,
          type: formData.type,
          doctor_name: doctorName || 'Médico',
          specialty: doctorSpecialty || 'Especialista',
          status: 'scheduled'
        })

      if (error) throw error

      toast.success('Cita programada correctamente')
      
      // Reset form
      setSelectedPatient(null)
      setSearchPatient('')
      setFormData({
        ...formData,
        reason: 'Consulta General',
        priority: 'normal'
      })
      
      if (onAppointmentCreated) onAppointmentCreated()
    } catch (err: any) {
      toast.error('Error al programar la cita: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden border-none bg-background/40 backdrop-blur-3xl shadow-2xl rounded-[3rem] animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col lg:flex-row">
        {/* Lado Izquierdo: Acción Rápida */}
        <div className="lg:w-1/3 bg-azul-profundo p-10 flex flex-col justify-between relative overflow-hidden group">
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <CalendarIcon className="size-40 text-cyan-500" />
          </div>
          <div className="absolute -bottom-10 -left-10 size-40 bg-cyan-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/30 mb-6">
               <Sparkles className="size-3 text-cyan-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Acción Rápida</span>
            </div>
            <h2 className="text-3xl font-black text-white leading-tight mb-2">Programar<br />Nueva Cita</h2>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Gestión Médica ID</p>
          </div>
          
          <div className="relative z-10 pt-10">
            <div className="flex items-center gap-4 text-white/60">
               <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Plus className="size-5" />
               </div>
               <p className="text-[11px] font-bold leading-relaxed">Asigna pacientes a tu agenda de forma instantánea y segura.</p>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario Estilo Prescriptions */}
        <CardContent className="p-8 lg:w-2/3">
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Encabezado Estilo Prescriptions */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-500">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-foreground">Información del Paciente</h3>
              </div>

              {/* Patient Selection Logic (Identical to prescriptions) */}
              {!selectedPatient ? (
                <div className="space-y-4">
                  <div className="relative group/search">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/search:text-cyan-500" />
                    <Input
                      placeholder="Buscar paciente por nombre o documento de identidad..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className="pl-12 h-14 text-base rounded-2xl bg-foreground/[0.03] border-border/50 transition-all focus:ring-4 focus:ring-cyan-500/10"
                    />
                  </div>
                  
                  {(searchPatient || isSearching) && (
                    <div className="divide-y divide-border/50 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 overflow-hidden relative z-50">
                      {isSearching ? (
                        <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
                          <span className="text-xs font-bold uppercase tracking-widest">Buscando en la base de datos...</span>
                        </div>
                      ) : patients.length > 0 ? patients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatient(patient)
                            setSearchPatient('')
                          }}
                          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-cyan-500/5 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 font-black">
                              {patient.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-foreground group-hover:text-cyan-400 transition-colors">{patient.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CI: {patient.ci}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-cyan-500 transition-all" />
                        </button>
                      )) : searchPatient.length >= 2 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-xs font-bold uppercase tracking-widest">No se encontraron pacientes autorizados.</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[2rem] bg-cyan-500/5 p-6 border border-cyan-500/10 animate-in zoom-in-95 duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-5">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 text-2xl font-black">
                        {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-foreground">{selectedPatient.name}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-background/50 border-cyan-500/20 text-cyan-600 font-bold">CI: {selectedPatient.ci}</Badge>
                          <Badge variant="outline" className="bg-background/50 border-cyan-500/20 text-cyan-600 font-bold uppercase tracking-widest text-[9px]">Autorizado</Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-red-500/10 hover:text-red-500 transition-all"
                      onClick={() => setSelectedPatient(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Otros campos del formulario */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Fecha</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-foreground/20" />
                    <Input 
                      type="date" 
                      className="h-12 rounded-2xl bg-foreground/[0.03] border-border/50 font-bold text-sm pl-11"
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Prioridad</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(val) => setFormData({...formData, priority: val})}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-foreground/[0.03] border-border/50 text-sm font-bold">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50">
                      <SelectItem value="normal" className="rounded-xl font-bold">Normal</SelectItem>
                      <SelectItem value="high" className="rounded-xl font-bold text-red-500">Alta / Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Tipo de Cita</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val: 'presencial' | 'virtual') => setFormData({...formData, type: val})}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-foreground/[0.03] border-border/50 text-sm font-bold">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50">
                      <SelectItem value="presencial" className="rounded-xl font-bold">Presencial</SelectItem>
                      <SelectItem value="virtual" className="rounded-xl font-bold">Virtual / Telemedicina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">
                    {formData.type === 'virtual' ? 'Link de la Reunión' : 'Ubicación / Consultorio'}
                  </Label>
                  <div className="relative">
                    {formData.type === 'virtual' ? (
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-foreground/20" />
                    ) : (
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-foreground/20" />
                    )}
                    <Input 
                      placeholder={formData.type === 'virtual' ? "Pegue el link aquí (Zoom, Meet...)" : "Ej. Consultorio A-102"}
                      className="h-12 rounded-2xl bg-foreground/[0.03] border-border/50 font-bold text-sm pl-11"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Inicio</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-foreground/20" />
                    <Input 
                      type="time" 
                      className="h-12 rounded-2xl bg-foreground/[0.03] border-border/50 font-bold text-sm pl-11"
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Fin</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-foreground/20" />
                    <Input 
                      type="time" 
                      className="h-12 rounded-2xl bg-foreground/[0.03] border-border/50 font-bold text-sm pl-11"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Motivo / Tipo</Label>
                  <Input 
                    placeholder="Ej. Control Post-operatorio"
                    className="h-12 rounded-2xl bg-foreground/[0.03] border-border/50 font-bold text-sm"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={loading || !selectedPatient}
                  className="bg-cyan-500 hover:bg-cyan-400 text-azul-profundo font-black px-10 h-14 rounded-2xl border-none transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-5 w-5" />
                  )}
                  CONFIRMAR CITA
                </Button>
              </div>
          </form>
        </CardContent>
      </div>
    </Card>
  )
}
