'use client'

import { useState, useEffect } from 'react'
// Dialog imports from card deleted as they are unused and imported from dialog instead
// Nota: Veo que en otros archivos usas '@/components/ui/dialog', lo usaré por consistencia.
import { Dialog as ShadcnDialog, DialogContent as ShadcnContent, DialogHeader as ShadcnHeader, DialogTitle as ShadcnTitle, DialogFooter as ShadcnFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, User, Clock, Calendar as CalendarIcon, MapPin, FileText, Loader2, Check, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Patient {
  id: string
  full_name: string
  cedula_identidad: string
}

export function NewAppointmentModal({ onAppointmentCreated }: { onAppointmentCreated?: () => void }) {
  const { doctorId, doctorName, doctorSpecialty } = useDoctorAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchingPatients, setSearchingPatients] = useState(false)
  
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_time: '09:00',
    end_time: '09:30',
    location: 'Consultorio A-102',
    priority: 'normal',
    type: 'presencial',
    reason: 'Consulta General',
    notes: ''
  })

  useEffect(() => {
    if (open) {
      fetchPatients()
    }
  }, [open])

  const fetchPatients = async () => {
    setSearchingPatients(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cedula_identidad')
        .eq('role', 'paciente')
        .order('full_name')
      
      if (error) throw error
      setPatients(data || [])
    } catch (err) {
      console.error('Error fetching patients:', err)
    } finally {
      setSearchingPatients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting appointment form...', { doctorId, formData })

    if (!doctorId) {
      toast.error('Error: No se detectó la sesión del doctor. Por favor, reintenta el login.')
      return
    }

    if (!formData.patient_id) {
      toast.error('Por favor seleccione un paciente')
      return
    }

    setLoading(true)
    try {
      const appointmentData = {
        patient_id: formData.patient_id,
        doctor_id: doctorId,
        doctor_name: doctorName || 'Doctor',
        specialty: doctorSpecialty || 'General',
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        end_time: formData.end_time,
        location: formData.location,
        type: formData.type,
        priority: formData.priority,
        reason: formData.reason,
        notes: formData.notes,
        status: 'scheduled'
      }

      console.log('Inserting into Supabase:', appointmentData)

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()

      if (error) {
        console.error('Supabase Insert Error:', error)
        throw error
      }

      console.log('Insert successful:', data)
      toast.success('Cita programada con éxito')
      setOpen(false)
      if (onAppointmentCreated) onAppointmentCreated()
      
      // Reset form
      setFormData({
        patient_id: '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        appointment_time: '09:00',
        end_time: '09:30',
        location: 'Consultorio A-102',
        priority: 'normal',
        reason: 'Consulta General',
        notes: ''
      })
    } catch (err: any) {
      console.error('Error creating appointment:', err)
      toast.error(`Error al crear la cita: ${err.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ShadcnDialog open={open} onOpenChange={setOpen}>
      <Button 
        onClick={() => setOpen(true)}
        className="btn-premium shadow-lg"
      >
        <Plus className="mr-2 h-5 w-5" />
        Nueva Cita
      </Button>
      
      <ShadcnContent className="sm:max-w-[500px] rounded-[2rem] border-none bg-background/95 backdrop-blur-xl shadow-2xl">
        <ShadcnHeader>
          <ShadcnTitle className="text-2xl font-black flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Programar Nueva Cita
          </ShadcnTitle>
        </ShadcnHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            {/* Paciente */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Paciente</Label>
              <Select 
                value={formData.patient_id} 
                onValueChange={(val) => setFormData({...formData, patient_id: val})}
              >
                <SelectTrigger className="h-12 rounded-2xl bg-foreground/5 border-none">
                  <SelectValue placeholder={searchingPatients ? "Cargando pacientes..." : "Seleccionar paciente"} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-xl">
                      {p.full_name} ({p.cedula_identidad || 'Sin CI'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Fecha */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha</Label>
                <Input 
                  type="date" 
                  className="h-12 rounded-2xl bg-foreground/5 border-none"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                  required
                />
              </div>
              {/* Prioridad */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Prioridad</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(val) => setFormData({...formData, priority: val})}
                >
                  <SelectTrigger className="h-12 rounded-2xl bg-foreground/5 border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    <SelectItem value="normal" className="rounded-xl">Normal</SelectItem>
                    <SelectItem value="high" className="rounded-xl">Alta Prioridad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Hora Inicio */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Inicio</Label>
                <Input 
                  type="time" 
                  className="h-12 rounded-2xl bg-foreground/5 border-none"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                  required
                />
              </div>
              {/* Hora Fin */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Fin</Label>
                <Input 
                  type="time" 
                  className="h-12 rounded-2xl bg-foreground/5 border-none"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Motivo / Tipo</Label>
              <Input 
                placeholder="Ej: Consulta General, Seguimiento..."
                className="h-12 rounded-2xl bg-foreground/5 border-none"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                required
              />
            </div>

            {/* Tipo de Cita */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Cita</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val: 'presencial' | 'virtual') => setFormData({...formData, type: val})}
              >
                <SelectTrigger className="h-12 rounded-2xl bg-foreground/5 border-none">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  <SelectItem value="presencial" className="rounded-xl">Presencial</SelectItem>
                  <SelectItem value="virtual" className="rounded-xl">Virtual (Telemedicina)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ubicación o Link */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                {formData.type === 'virtual' ? 'Link de la Reunión' : 'Ubicación'}
              </Label>
              <div className="relative">
                {formData.type === 'virtual' ? (
                  <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                ) : (
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                )}
                <Input 
                  placeholder={formData.type === 'virtual' ? "Zoom, Meet, WhatsApp link..." : "Ej: Consultorio A-102"}
                  className="h-12 rounded-2xl bg-foreground/5 border-none pl-11"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <ShadcnFooter className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-gradient-electric text-azul-profundo font-black text-lg hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Programando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Confirmar Cita
                </>
              )}
            </Button>
          </ShadcnFooter>
        </form>
      </ShadcnContent>
    </ShadcnDialog>
  )
}
