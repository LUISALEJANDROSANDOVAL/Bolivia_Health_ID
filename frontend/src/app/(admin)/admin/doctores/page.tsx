'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { supabase } from '@/lib/supabase'
import { assignSpecialty, assignSchedule, removeSchedule } from '@/app/actions/admin'
import { toast } from 'sonner'
import { Stethoscope, CalendarClock, Clock, Trash2 } from 'lucide-react'

export default function DoctoresPage() {
  const [doctores, setDoctores] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [sucursales, setSucursales] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)

  // Form states
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('')
  const [scheduleData, setScheduleData] = useState({
    sucursal_id: '',
    day_of_week: '1',
    start_time: '08:00',
    end_time: '16:00',
    slot_duration_minutes: '30'
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    
    const [docsRes, specRes, sucRes, schedRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'medico'),
      supabase.from('specialties').select('*').order('name'),
      supabase.from('sucursales').select('*').order('name'),
      supabase.from('doctor_schedules').select('*, sucursales(name)')
    ])

    if (docsRes.data) setDoctores(docsRes.data)
    if (specRes.data) setSpecialties(specRes.data)
    if (sucRes.data) setSucursales(sucRes.data)
    if (schedRes.data) setSchedules(schedRes.data)

    setIsLoading(false)
  }

  // Assign Specialty
  async function handleAssignSpecialty(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDoctor || !selectedSpecialty) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No estás autenticado')

      await assignSpecialty(session.access_token, selectedDoctor.id, selectedSpecialty)
      toast.success('Especialidad asignada')
      setSpecialtyModalOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  // Assign Schedule
  async function handleAssignSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDoctor || !scheduleData.sucursal_id) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No estás autenticado')

      await assignSchedule(session.access_token, {
        doctor_id: selectedDoctor.id,
        sucursal_id: scheduleData.sucursal_id,
        day_of_week: parseInt(scheduleData.day_of_week),
        start_time: scheduleData.start_time,
        end_time: scheduleData.end_time,
        slot_duration_minutes: parseInt(scheduleData.slot_duration_minutes)
      })
      toast.success('Horario configurado')
      setScheduleModalOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  async function handleRemoveSchedule(scheduleId: string) {
    if (!confirm('¿Eliminar este horario?')) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No estás autenticado')
      
      await removeSchedule(session.access_token, scheduleId)
      toast.success('Horario eliminado')
      fetchData()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  function getDayName(day: number) {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    return days[day - 1] || 'Día'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personal Médico</h1>
        <p className="text-muted-foreground">Gestiona especialidades y horarios del equipo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">Cargando doctores...</p>
        ) : doctores.length === 0 ? (
          <p className="text-muted-foreground col-span-full">No hay doctores registrados con ese rol.</p>
        ) : (
          doctores.map(doctor => {
            const doctorSchedules = schedules.filter(s => s.doctor_id === doctor.id)

            return (
              <Card key={doctor.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{doctor.full_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    {doctor.specialty || 'Sin especialidad asignada'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  
                  {/* Schedules List */}
                  <div className="space-y-2 mt-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" /> Horarios Activos
                    </h4>
                    {doctorSchedules.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No tiene horarios asignados.</p>
                    ) : (
                      <ul className="space-y-2">
                        {doctorSchedules.map(s => (
                          <li key={s.id} className="text-xs flex items-center justify-between bg-muted/50 p-2 rounded-md">
                            <div>
                              <p className="font-medium">{s.sucursales?.name}</p>
                              <p className="text-muted-foreground">{getDayName(s.day_of_week)}: {s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveSchedule(s.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => {
                      setSelectedDoctor(doctor)
                      setSelectedSpecialty(doctor.specialty || '')
                      setSpecialtyModalOpen(true)
                    }}>
                      Especialidad
                    </Button>
                    <Button variant="default" size="sm" className="w-full" onClick={() => {
                      setSelectedDoctor(doctor)
                      setScheduleModalOpen(true)
                    }}>
                      <Clock className="h-4 w-4 mr-2" />
                      Horario
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* SPECIALTY MODAL */}
      <Dialog open={specialtyModalOpen} onOpenChange={setSpecialtyModalOpen}>
        <DialogContent>
          <form onSubmit={handleAssignSpecialty}>
            <DialogHeader>
              <DialogTitle>Asignar Especialidad</DialogTitle>
              <DialogDescription>
                Selecciona la especialidad para {selectedDoctor?.full_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Especialidad</Label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar especialidad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map(spec => (
                      <SelectItem key={spec.id} value={spec.name}>{spec.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SCHEDULE MODAL */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent>
          <form onSubmit={handleAssignSchedule}>
            <DialogHeader>
              <DialogTitle>Configurar Horario</DialogTitle>
              <DialogDescription>
                Asigna un día y ventana de atención para {selectedDoctor?.full_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Sucursal</Label>
                <Select value={scheduleData.sucursal_id} onValueChange={(v) => setScheduleData({...scheduleData, sucursal_id: v})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar clínica..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map(suc => (
                      <SelectItem key={suc.id} value={suc.id}>{suc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Día de la semana</Label>
                <Select value={scheduleData.day_of_week} onValueChange={(v) => setScheduleData({...scheduleData, day_of_week: v})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Día" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Lunes</SelectItem>
                    <SelectItem value="2">Martes</SelectItem>
                    <SelectItem value="3">Miércoles</SelectItem>
                    <SelectItem value="4">Jueves</SelectItem>
                    <SelectItem value="5">Viernes</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                    <SelectItem value="7">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Hora Inicio</Label>
                  <Input type="time" value={scheduleData.start_time} onChange={(e) => setScheduleData({...scheduleData, start_time: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label>Hora Fin</Label>
                  <Input type="time" value={scheduleData.end_time} onChange={(e) => setScheduleData({...scheduleData, end_time: e.target.value})} required />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Duración de Consulta (Minutos)</Label>
                <Input type="number" min="10" max="120" value={scheduleData.slot_duration_minutes} onChange={(e) => setScheduleData({...scheduleData, slot_duration_minutes: e.target.value})} required />
              </div>

            </div>
            <DialogFooter>
              <Button type="submit">Añadir Horario</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
