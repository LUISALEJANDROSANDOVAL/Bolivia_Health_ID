'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
  Building, 
  Calendar, 
  Clock, 
  Search, 
  Loader2, 
  Users, 
  FileText,
  MapPin,
  Video,
  Stethoscope,
  XCircle,
  CalendarCheck,
  CalendarClock,
  X
} from 'lucide-react'

interface Appointment {
  id: string
  date: string
  time: string
  status: string
  type: 'presencial' | 'virtual'
  doctorName: string
  doctorId: string
  specialty: string
  patientName: string
  patientCi: string
  patientId: string
  reason: string
  sucursalId: string
  sucursalName: string
}

export default function AdminGlobalAgendaPage() {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [sucursales, setSucursales] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  
  // Filters
  const [filterDate, setFilterDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSucursal, setFilterSucursal] = useState<string>('all')
  const [filterDoctor, setFilterDoctor] = useState<string>('all')

  // Rescheduling states
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState<Appointment | null>(null)
  const [rescheduleForm, setRescheduleForm] = useState({
    id: '',
    doctor_id: '',
    sucursal_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  })
  const [rescheduleAvailability, setRescheduleAvailability] = useState<'available' | 'occupied' | 'outside_schedule' | 'no_schedule' | 'loading' | null>(null)

  const fetchFiltersData = useCallback(async () => {
    try {
      const [sucRes, docRes] = await Promise.all([
        supabase.from('sucursales').select('id, name').order('name'),
        supabase.from('profiles').select('id, full_name, specialty').eq('role', 'medico').order('full_name')
      ])

      if (sucRes.data) setSucursales(sucRes.data)
      if (docRes.data) setDoctors(docRes.data)
    } catch (err: any) {
      console.error('Error fetching filter data:', err)
    }
  }, [])

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const { data: apts, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          type,
          doctor_name,
          specialty,
          reason,
          patient_id,
          sucursal_id,
          doctor_id,
          sucursales (name),
          profiles!patient_id (full_name, cedula_identidad)
        `)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true })

      if (error) throw error

      if (apts) {
        const mapped: Appointment[] = apts.map((a: any) => ({
          id: a.id,
          date: a.appointment_date,
          time: a.appointment_time?.slice(0, 5) || '--:--',
          status: a.status,
          type: a.type || 'presencial',
          doctorName: a.doctor_name || 'Médico',
          doctorId: a.doctor_id || '',
          specialty: a.specialty || 'General',
          patientName: a.profiles?.full_name || 'Paciente',
          patientCi: a.profiles?.cedula_identidad || 'N/A',
          patientId: a.patient_id,
          reason: a.reason || 'Consulta',
          sucursalId: a.sucursal_id || '',
          sucursalName: a.sucursales?.name || 'Sede no asignada'
        }))
        setAppointments(mapped)
      }
    } catch (err: any) {
      console.error('Error fetching admin global agenda:', err)
      toast.error('Error al cargar la agenda global: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiltersData()
    fetchAppointments()
  }, [fetchFiltersData, fetchAppointments])

  useEffect(() => {
    let active = true

    async function checkRescheduleAvailability() {
      if (!rescheduleForm.id || !rescheduleForm.doctor_id || !rescheduleForm.appointment_date || !rescheduleForm.appointment_time || !rescheduleForm.sucursal_id) {
        setRescheduleAvailability(null)
        return
      }

      setRescheduleAvailability('loading')

      try {
        const { id, doctor_id, sucursal_id, appointment_date, appointment_time } = rescheduleForm

        // 1. Verificar conflictos (citas en la misma fecha y hora, excluyendo la cita actual)
        const { data: conflicts, error: conflictError } = await supabase
          .from('appointments')
          .select('id')
          .eq('doctor_id', doctor_id)
          .eq('appointment_date', appointment_date)
          .eq('appointment_time', appointment_time)
          .neq('id', id)
          .in('status', ['scheduled', 'confirmed', 'in_progress'])

        if (conflictError) throw conflictError

        if (active && conflicts && conflicts.length > 0) {
          setRescheduleAvailability('occupied')
          return
        }

        // 2. Verificar horarios configurados
        const dateObj = new Date(appointment_date + 'T12:00:00')
        const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay()

        // Primero consultamos si el doctor tiene CUALQUIER horario en esta sucursal
        const { data: allSchedules, error: allSchedError } = await supabase
          .from('doctor_schedules')
          .select('id')
          .eq('doctor_id', doctor_id)
          .eq('sucursal_id', sucursal_id)
          .eq('is_active', true)

        if (allSchedError) throw allSchedError

        if (!allSchedules || allSchedules.length === 0) {
          if (active) setRescheduleAvailability('no_schedule')
          return
        }

        // Si tiene horarios, buscamos si trabaja este día
        const { data: schedules, error: schedError } = await supabase
          .from('doctor_schedules')
          .select('start_time, end_time')
          .eq('doctor_id', doctor_id)
          .eq('sucursal_id', sucursal_id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true)

        if (schedError) throw schedError

        if (!schedules || schedules.length === 0) {
          if (active) setRescheduleAvailability('outside_schedule')
          return
        }

        // Comparar horas
        const selectedTime = appointment_time.length === 5 ? appointment_time + ':00' : appointment_time
        const isWithin = schedules.some(s => {
          const start = s.start_time
          const end = s.end_time
          return selectedTime >= start && selectedTime < end
        })

        if (active) {
          setRescheduleAvailability(isWithin ? 'available' : 'outside_schedule')
        }
      } catch (err) {
        console.error('Error checking reschedule availability:', err)
        if (active) setRescheduleAvailability(null)
      }
    }

    checkRescheduleAvailability()

    return () => {
      active = false
    }
  }, [rescheduleForm.id, rescheduleForm.doctor_id, rescheduleForm.sucursal_id, rescheduleForm.appointment_date, rescheduleForm.appointment_time])

  // Handle saving rescheduling in admin
  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rescheduleForm.id || !rescheduleForm.appointment_date || !rescheduleForm.appointment_time) {
      toast.error('Falta información requerida')
      return
    }

    setRescheduleLoading(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: rescheduleForm.appointment_date,
          appointment_time: rescheduleForm.appointment_time,
          reason: rescheduleForm.reason
        })
        .eq('id', rescheduleForm.id)

      if (error) throw error

      toast.success('Cita reprogramada correctamente')
      setIsRescheduleModalOpen(false)
      fetchAppointments()
    } catch (err: any) {
      toast.error('Error al reprogramar la cita: ' + err.message)
    } finally {
      setRescheduleLoading(false)
    }
  }

  // Handle cancellation in admin
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Cita cancelada con éxito')
      fetchAppointments()
    } catch (err: any) {
      toast.error('Error al cancelar la cita: ' + err.message)
    }
  }

  // Filtering logic
  const filteredAppointments = appointments.filter(apt => {
    const matchesDate = !filterDate || apt.date === filterDate
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
    const matchesSucursal = filterSucursal === 'all' || apt.sucursalId === filterSucursal
    const matchesDoctor = filterDoctor === 'all' || apt.doctorId === filterDoctor
    
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientCi.includes(searchTerm) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reason.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesDate && matchesStatus && matchesSucursal && matchesDoctor && matchesSearch
  })

  // Global Statistics
  const stats = {
    total: filteredAppointments.length,
    scheduled: filteredAppointments.filter(a => a.status === 'scheduled').length,
    confirmed: filteredAppointments.filter(a => a.status === 'confirmed').length,
    inProgress: filteredAppointments.filter(a => a.status === 'in_progress').length,
    completed: filteredAppointments.filter(a => a.status === 'completed').length,
    cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20">Programada</Badge>
      case 'confirmed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Confirmada</Badge>
      case 'in_progress':
        return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">En Turno</Badge>
      case 'completed':
        return <Badge className="bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">Atendida</Badge>
      case 'cancelled':
        return <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20">Cancelada</Badge>
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-6 md:p-8 border border-primary/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">Consola Central</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Agenda Global de Citas</h1>
          <p className="text-sm text-muted-foreground">Monitorea y supervisa todas las citas médicas agendadas en la red de clínicas.</p>
        </div>
        <Button 
          onClick={fetchAppointments}
          variant="outline"
          className="h-11 rounded-xl flex items-center gap-2 self-start md:self-auto shrink-0 shadow-sm font-bold"
        >
          Refrescar Agenda
        </Button>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <Card className="border-none bg-foreground/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Citas Filtradas</p>
            <h3 className="text-2xl font-black text-foreground mt-1.5">{stats.total}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-foreground/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Programadas</p>
            <h3 className="text-2xl font-black text-blue-500 mt-1.5">{stats.scheduled}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-foreground/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Confirmadas</p>
            <h3 className="text-2xl font-black text-emerald-500 mt-1.5">{stats.confirmed}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-foreground/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-bold text-amber-500 uppercase">En Turno</p>
            <h3 className="text-2xl font-black text-amber-500 mt-1.5">{stats.inProgress}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-foreground/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-bold text-cyan-500 uppercase">Atendidas</p>
            <h3 className="text-2xl font-black text-cyan-500 mt-1.5">{stats.completed}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-foreground/[0.02]">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-bold text-rose-500 uppercase">Canceladas</p>
            <h3 className="text-2xl font-black text-rose-500 mt-1.5">{stats.cancelled}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Main Agenda Card */}
      <Card className="border-none bg-foreground/[0.01] rounded-[2.5rem] p-4 md:p-6">
        <CardHeader className="px-2 pb-6">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Building className="size-5 text-primary" />
            Consola de Monitoreo
          </CardTitle>
          <CardDescription>Filtra y visualiza la agenda médica de toda la organización.</CardDescription>
        </CardHeader>
        <CardContent className="p-2 space-y-6">
          
          {/* Advanced Filtering controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Filter by Date */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">Fecha</span>
              <Input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-11 rounded-xl bg-foreground/[0.03] border-border/50 font-bold"
              />
            </div>

            {/* Filter by Sucursal */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">Sucursal / Clínica</span>
              <Select value={filterSucursal} onValueChange={setFilterSucursal}>
                <SelectTrigger className="h-11 rounded-xl bg-foreground/[0.03] border-border/50 font-bold text-sm w-full">
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="all" className="font-bold">Todas las sucursales</SelectItem>
                  {sucursales.map(s => (
                    <SelectItem key={s.id} value={s.id} className="font-bold">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Doctor */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">Especialista</span>
              <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                <SelectTrigger className="h-11 rounded-xl bg-foreground/[0.03] border-border/50 font-bold text-sm w-full">
                  <SelectValue placeholder="Todos los médicos" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="all" className="font-bold">Todos los médicos</SelectItem>
                  {doctors.map(d => (
                    <SelectItem key={d.id} value={d.id} className="font-bold">{d.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Status */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">Estado de Cita</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-11 rounded-xl bg-foreground/[0.03] border-border/50 font-bold text-sm w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="all" className="font-bold">Todos</SelectItem>
                  <SelectItem value="scheduled" className="font-bold">Pendientes</SelectItem>
                  <SelectItem value="confirmed" className="font-bold">Confirmadas</SelectItem>
                  <SelectItem value="in_progress" className="font-bold">En Turno</SelectItem>
                  <SelectItem value="completed" className="font-bold">Atendidas</SelectItem>
                  <SelectItem value="cancelled" className="font-bold">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">Búsqueda rápida</span>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Paciente, C.I., motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-foreground/[0.03] border-border/50 font-bold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Quick Clear Filter Button */}
          {(filterDate || searchTerm || filterStatus !== 'all' || filterSucursal !== 'all' || filterDoctor !== 'all') && (
            <div className="flex justify-end animate-slide-in">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setFilterDate('')
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterSucursal('all')
                  setFilterDoctor('all')
                }}
                className="text-xs text-rose-500 hover:bg-rose-500/10 font-bold"
              >
                <XCircle className="size-3.5 mr-1" />
                Limpiar Filtros
              </Button>
            </div>
          )}

          {/* Appointments Table / List */}
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-20 text-center space-y-2 border border-dashed border-border rounded-2xl">
              <Users className="size-10 text-muted-foreground mx-auto opacity-35" />
              <h3 className="text-md font-black text-foreground/60">No se encontraron citas</h3>
              <p className="text-xs text-muted-foreground">Prueba modificando los filtros o fechas para ampliar la búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/50 bg-background/50">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-foreground/[0.02]">
                    <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Fecha y Hora</th>
                    <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Clínica / Sede</th>
                    <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Paciente</th>
                    <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Especialista</th>
                    <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Tipo / Motivo</th>
                    <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Estado</th>
                    <th className="p-4 font-black text-xs text-right uppercase tracking-wider text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-border/40 hover:bg-foreground/[0.01] transition-colors">
                      <td className="p-4 font-bold">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Calendar className="size-3.5 text-primary" />
                          {apt.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 font-normal">
                          <Clock className="size-3.5" />
                          {apt.time}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-foreground flex items-center gap-1">
                          <Building className="size-3.5 text-primary shrink-0" />
                          {apt.sucursalName}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-foreground">{apt.patientName}</div>
                        <div className="text-[10px] text-muted-foreground">C.I: {apt.patientCi}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-foreground flex items-center gap-1">
                          <Stethoscope className="size-3.5 text-primary shrink-0" />
                          {apt.doctorName}
                        </div>
                        <div className="text-[10px] text-primary font-bold uppercase tracking-wider">{apt.specialty}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-xs font-semibold text-foreground/80">
                          {apt.type === 'presencial' ? <MapPin className="size-3.5 text-green-500" /> : <Video className="size-3.5 text-blue-500" />}
                          {apt.type === 'presencial' ? 'Presencial' : 'Virtual'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 max-w-[160px] truncate flex items-center gap-1" title={apt.reason}>
                          <FileText className="size-3 text-muted-foreground/60 shrink-0" />
                          {apt.reason}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(apt.status)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRescheduleApt(apt)
                                setRescheduleForm({
                                  id: apt.id,
                                  doctor_id: apt.doctorId,
                                  sucursal_id: apt.sucursalId,
                                  appointment_date: apt.date,
                                  appointment_time: apt.time,
                                  reason: apt.reason
                                })
                                setIsRescheduleModalOpen(true)
                              }}
                              className="h-8 border-primary/30 text-primary hover:bg-primary/10 rounded-lg font-bold text-xs"
                              title="Reprogramar Cita"
                            >
                              <CalendarClock className="size-3.5 mr-1" />
                              Reprogramar
                            </Button>
                          )}
                          {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelAppointment(apt.id)}
                              className="h-8 text-rose-500 hover:bg-rose-500/10 rounded-lg font-bold text-xs"
                              title="Cancelar Cita"
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Reprogramar Cita */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background/95 backdrop-blur-xl border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <CalendarClock className="size-6 text-primary" />
              Reprogramar Cita (Admin)
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Modifica la fecha, hora o el motivo de la cita para el paciente.
            </DialogDescription>
          </DialogHeader>

          {selectedRescheduleApt && (
            <div className="p-4 bg-foreground/[0.02] border border-border/50 rounded-2xl space-y-1 mb-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Cita Actual</p>
              <h4 className="text-md font-black text-foreground">{selectedRescheduleApt.patientName}</h4>
              <p className="text-xs text-muted-foreground flex flex-col gap-0.5">
                <span>CI: {selectedRescheduleApt.patientCi}</span>
                <span>Sucursal: {selectedRescheduleApt.sucursalName}</span>
                <span>Médico: {selectedRescheduleApt.doctorName}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleSaveReschedule} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Nueva Fecha</Label>
                <Input 
                  type="date"
                  value={rescheduleForm.appointment_date}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, appointment_date: e.target.value})}
                  required
                  className="h-12 rounded-xl bg-foreground/[0.03] border-border/50 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Nueva Hora</Label>
                <Input 
                  type="time"
                  value={rescheduleForm.appointment_time}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, appointment_time: e.target.value})}
                  required
                  className="h-12 rounded-xl bg-foreground/[0.03] border-border/50 font-bold"
                />
              </div>
            </div>

            {/* Disponibilidad del Médico en Reprogramación */}
            {rescheduleForm.doctor_id && rescheduleForm.appointment_date && rescheduleForm.appointment_time && (
              <div className="mt-1 animate-slide-in">
                {rescheduleAvailability === 'loading' && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border/30 rounded-xl text-xs text-muted-foreground font-bold">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    Verificando disponibilidad...
                  </div>
                )}
                {rescheduleAvailability === 'available' && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="flex size-2 rounded-full bg-emerald-500" />
                    Horario Disponible para Consulta
                  </div>
                )}
                {rescheduleAvailability === 'occupied' && (
                  <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-bold">
                    <span className="flex size-2 rounded-full bg-rose-500 animate-ping" />
                    Este horario ya está ocupado por otra cita activa.
                  </div>
                )}
                {rescheduleAvailability === 'outside_schedule' && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 font-bold">
                    <span className="flex size-2 rounded-full bg-amber-500" />
                    Fuera de horario de atención configurado para el doctor.
                  </div>
                )}
                {rescheduleAvailability === 'no_schedule' && (
                  <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-600 dark:text-blue-400 font-bold">
                    <span className="flex size-2 rounded-full bg-blue-500" />
                    El médico no tiene horarios configurados en esta clínica. Se permite agendar.
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold">Motivo / Notas</Label>
              <Input 
                placeholder="Motivo del cambio de día o consulta..."
                value={rescheduleForm.reason}
                onChange={(e) => setRescheduleForm({...rescheduleForm, reason: e.target.value})}
                className="h-12 rounded-xl bg-foreground/[0.03] border-border/50 font-bold text-sm"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="h-12 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={rescheduleLoading || rescheduleAvailability === 'occupied'}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10"
              >
                {rescheduleLoading && <Loader2 className="size-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
