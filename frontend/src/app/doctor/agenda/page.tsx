'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Plus, 
  Search, 
  MoreVertical,
  CalendarCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Video,
  MapPin,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  TrendingUp,
  Share2,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { StatCard } from '@/components/ui/stat-card'
import { QuickAppointmentCard } from '@/components/quick-appointment-card'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Appointment {
  id: string
  time: string
  endTime: string
  patientName: string
  patientId: string
  reason: string
  type: 'presencial' | 'virtual'
  status: string
  priority: string
  location: string
  notes?: string
  date: string
}

export default function DoctorAgendaPage() {
  const { doctorId, doctorName } = useDoctorAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'day'>('all')
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const fetchAgenda = useCallback(async () => {
    if (!doctorId) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Fetch appointments for this doctor
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient_profile:profiles!patient_id (full_name)
        `)
        .or(`doctor_id.eq.${doctorId}${doctorName ? `,doctor_name.ilike.%${doctorName}%` : ''}`)
        .order('appointment_time', { ascending: true })

      if (error) {
        console.error('Error fetching appointments:', error)
        throw error
      }

      if (data) {
        const mapped: Appointment[] = data.map((apt: any) => ({
          id: apt.id,
          time: apt.appointment_time?.slice(0, 5) || '--:--',
          endTime: apt.end_time?.slice(0, 5) || '--:--',
          patientName: Array.isArray(apt.patient_profile) 
            ? (apt.patient_profile[0]?.full_name || 'Paciente Desconocido')
            : (apt.patient_profile?.full_name || 'Paciente Desconocido'),
          patientId: apt.patient_id,
          reason: apt.reason || 'Consulta General',
          type: apt.type || 'presencial',
          status: apt.status === 'scheduled' ? 'Programada' : 
                  apt.status === 'confirmed' ? 'Confirmada' : 
                  apt.status === 'completed' ? 'Completada' : 
                  apt.status === 'cancelled' ? 'Cancelada' : 
                  apt.status === 'in_progress' ? 'En Curso' : 'Pendiente',
          priority: apt.priority === 'high' ? 'Alta' : 'Normal',
          location: apt.location || 'Consultorio A-102',
          notes: apt.notes,
          date: apt.appointment_date
        }))

        setAppointments(mapped)
      }
    } catch (err) {
      console.error('Error in fetchAgenda:', err)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  const stats = useMemo(() => {
    const list = filterMode === 'day' 
      ? appointments.filter(a => a.date === format(currentDate, 'yyyy-MM-dd'))
      : appointments

    const total = list.length
    const uniquePatients = new Set(list.map(a => a.patientName)).size
    const completed = list.filter(a => a.status === 'Completada').length
    const upcoming = list.filter(a => 
      a.status === 'Confirmada' || 
      a.status === 'Pendiente' || 
      a.status === 'Programada' ||
      a.status === 'En Curso'
    ).length

    return {
      total,
      patients: uniquePatients,
      completed,
      upcoming
    }
  }, [appointments, currentDate, filterMode])

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    setUpdatingStatusId(id)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      const statusLabel = 
        newStatus === 'completed' ? 'Completada' :
        newStatus === 'confirmed' ? 'Confirmada' :
        newStatus === 'cancelled' ? 'Cancelada' : 'Programada'

      toast.success(`Cita actualizada a ${statusLabel}`)
      
      if (selectedApt && selectedApt.id === id) {
        setSelectedApt(prev => prev ? { ...prev, status: statusLabel } : null)
      }

      fetchAgenda()
    } catch (err: any) {
      console.error('Error updating appointment status:', err)
      toast.error('Error al actualizar la cita: ' + err.message)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  useEffect(() => {
    fetchAgenda()

    if (!doctorId) return

    const channel = supabase
      .channel(`agenda-changes-${doctorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`
        },
        () => {
          fetchAgenda()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAgenda, doctorId])

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      (apt.patientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (apt.reason?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    if (filterMode === 'day') {
      const selectedDateStr = format(currentDate, 'yyyy-MM-dd')
      return matchesSearch && apt.date === selectedDateStr
    }
    return matchesSearch
  })

  // Calendar days generation
  const weekStart = startOfWeek(currentDate, { locale: es })
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  })

  return (
    <DoctorLayout>
      <div className="space-y-8 animate-slide-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Mi Agenda</span>
              </div>
              <div className="size-1.5 rounded-full bg-foreground/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight capitalize">
              {filterMode === 'day' ? format(currentDate, 'eeee, d', { locale: es }) : 'Todas las Citas'}
            </h1>
          </div>

        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title={filterMode === 'day' ? "Citas Hoy" : "Total Citas"} 
            value={stats.total.toString()} 
            icon={CalendarIcon} 
            color="text-cyan-500" 
          />
          <StatCard 
            title="Pacientes" 
            value={stats.patients.toString()} 
            icon={Users} 
            color="text-blue-500" 
          />
          <StatCard 
            title="Completadas" 
            value={stats.completed.toString()} 
            icon={CheckCircle2} 
            color="text-green-500" 
          />
          <StatCard 
            title="Pendientes" 
            value={stats.upcoming.toString()} 
            icon={Clock} 
            color="text-orange-500" 
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Column */}
          <div className="lg:col-span-9 space-y-8">
            <QuickAppointmentCard onAppointmentCreated={fetchAgenda} />

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
              <Input
                placeholder="Buscar en la agenda por paciente o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 rounded-3xl bg-foreground/[0.03] backdrop-blur-xl border-border/50 focus:border-cyan-500/50 text-base"
              />
            </div>

            {/* Date Filtering Alert Banner */}
            {filterMode === 'day' && (
              <div className="flex items-center justify-between p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="size-4" />
                  <span className="text-sm font-black uppercase tracking-tight">
                    Filtrado por fecha: <span className="text-foreground dark:text-white capitalize">{format(currentDate, "eeee, d 'de' MMMM", { locale: es })}</span>
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilterMode('all')}
                  className="h-8 px-4 rounded-xl hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-widest text-[9px] cursor-pointer"
                >
                  Ver todas las citas
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="size-12 text-cyan-500 animate-spin mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-foreground/40">Cargando agenda...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-foreground/[0.03] backdrop-blur-xl p-20 rounded-[3rem] border border-border/50 text-center">
                 <div className="flex justify-center mb-4">
                    <div className="size-16 rounded-full bg-foreground/5 flex items-center justify-center">
                       <CalendarIcon className="size-8 text-foreground/20" />
                    </div>
                 </div>
                 <h3 className="text-xl font-black text-foreground">No hay citas</h3>
                 <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest mt-2">
                   {filterMode === 'day' ? 'Agenda despejada para este día' : 'No tienes citas agendadas'}
                 </p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-[1.85rem] before:top-4 before:bottom-4 before:w-px before:bg-foreground/5">
                {filteredAppointments.map((apt) => (
                  <div key={apt.id} className="relative flex gap-6 group pl-12">
                    <div className={`absolute left-6 top-1/2 -translate-y-1/2 size-3 rounded-full border-[3px] border-background z-10 transition-all ${
                      apt.status === 'Completada' ? 'bg-green-500' : 
                      apt.status === 'Confirmada' ? 'bg-cyan-500' : 
                      apt.status === 'Cancelada' ? 'bg-rose-500' : 'bg-orange-500'
                    } group-hover:scale-125`} />

                    <div 
                      onClick={() => setSelectedApt(apt)}
                      className={`flex-1 bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-[2rem] border border-border group hover:border-cyan-500/20 transition-all shadow-lg shadow-black/5 cursor-pointer hover:scale-[1.01] ${
                        apt.status === 'Completada' || apt.status === 'Cancelada' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`size-14 rounded-2xl flex items-center justify-center border border-border/50 transition-colors ${
                             apt.patientName.charCodeAt(0) % 2 === 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            <span className="text-xl font-black">{apt.patientName.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-lg font-black text-foreground group-hover:text-cyan-400 transition-colors">{apt.patientName}</h4>
                              <Badge className={`text-[8px] font-black uppercase tracking-wider ${
                                apt.status === 'Completada' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                apt.status === 'Confirmada' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                                apt.status === 'Cancelada' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                'bg-orange-500/10 text-orange-500 border-orange-500/20'
                              }`}>
                                {apt.status}
                              </Badge>
                              {apt.priority === 'Alta' && (
                                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[8px] font-black uppercase">
                                  Urgente
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">{apt.reason}</p>
                              <div className="flex items-center gap-1 text-[10px] font-black text-foreground/60">
                                <Clock className="size-3 text-cyan-500" />
                                <span>{apt.time} - {apt.endTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <div className="hidden md:block text-right mr-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Ubicación</p>
                              <p className="text-xs font-bold text-foreground/70 flex items-center justify-end gap-1">
                                {apt.type === 'virtual' ? <Video className="size-3 text-cyan-500" /> : <MapPin className="size-3" />}
                                {apt.location}
                              </p>
                           </div>
                           {apt.status === 'Completada' ? (
                             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 font-black text-xs select-none">
                               <CheckCircle2 className="size-4" />
                               ATENDIDO
                             </div>
                           ) : apt.status === 'Cancelada' ? (
                             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 font-black text-xs select-none">
                               <AlertCircle className="size-4" />
                               CANCELADO
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               {(apt.status === 'Programada' || apt.status === 'Confirmada') && (
                                 <Button 
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     updateAppointmentStatus(apt.id, 'completed')
                                   }}
                                   className="bg-green-500 hover:bg-green-600 text-white font-black rounded-xl h-10 px-4 border-none transition-all cursor-pointer"
                                 >
                                   Completar
                                 </Button>
                                )}
                               <Link href={`/doctor/patients/${apt.patientId}`} onClick={(e) => e.stopPropagation()}>
                                 <Button className="bg-foreground/5 hover:bg-cyan-500 text-foreground hover:text-azul-profundo font-black rounded-xl h-10 px-4 border-none transition-all cursor-pointer">
                                    Atender
                                 </Button>
                               </Link>
                             </div>
                           )}
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                               <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-foreground/10 cursor-pointer">
                                  <MoreVertical className="size-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="rounded-2xl border-border/50 bg-background/95 backdrop-blur-md shadow-2xl p-1.5">
                               {apt.status !== 'Confirmada' && apt.status !== 'Completada' && apt.status !== 'Cancelada' && (
                                 <DropdownMenuItem 
                                   onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                                   className="rounded-xl font-bold hover:bg-cyan-500/10 hover:text-cyan-500 cursor-pointer"
                                 >
                                   <CheckCircle2 className="size-4 mr-2 text-cyan-500" />
                                   Confirmar Cita
                                 </DropdownMenuItem>
                               )}
                               {apt.status !== 'Completada' && apt.status !== 'Cancelada' && (
                                 <DropdownMenuItem 
                                   onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                                   className="rounded-xl font-bold hover:bg-green-500/10 hover:text-green-500 cursor-pointer"
                                 >
                                   <CheckCircle2 className="size-4 mr-2 text-green-500" />
                                   Marcar como Completada
                                 </DropdownMenuItem>
                               )}
                               {apt.status !== 'Cancelada' && apt.status !== 'Completada' && (
                                 <DropdownMenuItem 
                                   onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                                   className="rounded-xl font-bold text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer"
                                 >
                                   <AlertCircle className="size-4 mr-2 text-rose-500" />
                                   Cancelar Cita
                                 </DropdownMenuItem>
                               )}
                               <DropdownMenuItem asChild>
                                 <Link href={`/doctor/patients/${apt.patientId}`} className="rounded-xl font-bold hover:bg-foreground/10 cursor-pointer flex items-center p-2">
                                   <User className="size-4 mr-2" />
                                   Ver Historial Clínico
                                 </Link>
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </div>
                      
                      {apt.notes && (
                        <div className="mt-4 p-3 bg-foreground/5 rounded-2xl border border-border/50">
                           <p className="text-xs font-bold text-foreground/60 flex items-center gap-2">
                              <FileText className="size-3 text-foreground/30" />
                              {apt.notes}
                           </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-azul-profundo/95 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Shield className="size-24 text-cyan-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white tracking-tight">Calendario</h3>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-7 rounded-full hover:bg-white/10 text-white"
                      onClick={() => {
                        setCurrentDate(addDays(currentDate, -1))
                        setFilterMode('day')
                      }}
                    >
                      <ChevronLeft className="size-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-7 rounded-full hover:bg-white/10 text-white"
                      onClick={() => {
                        setCurrentDate(addDays(currentDate, 1))
                        setFilterMode('day')
                      }}
                    >
                      <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day, i) => {
                      const isSelected = isSameDay(day, currentDate)
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setCurrentDate(day)
                            setFilterMode('day')
                          }}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                            isSelected && filterMode === 'day'
                              ? 'bg-gradient-electric text-azul-profundo scale-105 shadow-lg shadow-cyan-500/20' 
                              : 'hover:bg-white/5 text-white/40 hover:text-white'
                          }`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-tighter">
                            {format(day, 'eee', { locale: es })}
                          </span>
                          <span className="text-xs font-black">
                            {format(day, 'd')}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <Button 
                    onClick={() => {
                      setCurrentDate(new Date())
                      setFilterMode('all')
                    }}
                    className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white border-none h-10 rounded-xl font-black uppercase tracking-widest text-[8px]"
                  >
                    Mostrar todas las citas
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-[2.5rem] border border-border shadow-lg shadow-black/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-4">Recordatorios</h3>
              <div className="space-y-3">
                {stats.upcoming > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-500/5 border border-orange-500/10 group">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                      <AlertCircle className="size-3.5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground/80 leading-tight">Atención Pendiente</p>
                      <p className="text-[9px] font-bold text-foreground/40 mt-0.5">Tienes {stats.upcoming} citas hoy.</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 group">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                    <Users className="size-3.5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-foreground/80 leading-tight">Pacientes del Día</p>
                    <p className="text-[9px] font-bold text-foreground/40 mt-0.5">{stats.patients} registrados.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Detalle de Cita (Rol Médico) */}
        <Dialog open={selectedApt !== null} onOpenChange={(open) => !open && setSelectedApt(null)}>
          <DialogContent className="w-full sm:max-w-xl max-h-[85vh] rounded-[2.5rem] border-none bg-background/95 backdrop-blur-3xl shadow-2xl overflow-hidden p-0 flex flex-col">
            {selectedApt && (() => {
              const apt = selectedApt
              const isVirtual = apt.type === 'virtual'
              const isLink = isVirtual && apt.location && (apt.location.startsWith('http') || apt.location.startsWith('www'))
              
              return (
                <div className="flex flex-col max-h-[85vh] overflow-hidden flex-1 animate-in fade-in zoom-in-95 duration-300">
                  {/* Header con gradiente premium */}
                  <div className="bg-gradient-premium p-8 text-white relative shrink-0">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <CalendarIcon className="size-24 text-white" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="bg-white/10 border-white/20 text-white font-black uppercase tracking-[0.2em] text-[8px]">
                          Consulta Agendada
                        </Badge>
                        <Badge className={`text-[8px] font-black uppercase tracking-wider ${
                          apt.status === 'Completada' ? 'bg-green-500 text-white' :
                          apt.status === 'Confirmada' ? 'bg-cyan-500 text-azul-profundo' :
                          apt.status === 'Cancelada' ? 'bg-rose-500 text-white' :
                          'bg-orange-500 text-white'
                        }`}>
                          {apt.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-black border border-white/10 shadow-lg">
                          {apt.patientName.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black tracking-tight">{apt.patientName}</h2>
                          <p className="text-white/60 font-bold uppercase tracking-widest text-[9px] mt-0.5">Rol: Paciente</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo Scrollable */}
                  <div className="p-8 space-y-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Fecha</p>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <CalendarIcon className="size-4 text-cyan-500" />
                          <span className="capitalize">{format(currentDate, "eeee d 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Horario</p>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <Clock className="size-4 text-cyan-500" />
                          <span>{apt.time} - {apt.endTime}</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-foreground/5" />

                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Modalidad e Ubicación</p>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-xl flex items-center justify-center ${isVirtual ? 'bg-purple-500/10 text-purple-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                            {isVirtual ? <Video className="size-5" /> : <MapPin className="size-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground uppercase tracking-tight">
                              {isVirtual ? 'Consulta Virtual' : 'Consulta Presencial'}
                            </p>
                            <p className="text-[11px] font-bold text-foreground/50 truncate max-w-[250px]">
                              {apt.location}
                            </p>
                          </div>
                        </div>
                        {isLink && (
                          <a 
                            href={apt.location.startsWith('http') ? apt.location : `https://${apt.location}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-cyan-500 hover:bg-cyan-400 text-azul-profundo font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all text-center shrink-0 cursor-pointer shadow-lg"
                          >
                            Unirse
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Motivo de la Cita</p>
                      <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border/50 flex gap-3">
                        <AlertCircle className="size-4 text-cyan-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-foreground/80 leading-relaxed">{apt.reason}</p>
                      </div>
                    </div>

                    {apt.notes && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Notas / Recomendaciones Clínicas</p>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                          <FileText className="size-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold text-amber-700/80 leading-relaxed italic">"{apt.notes}"</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer con Acciones */}
                  <DialogFooter className="p-6 bg-foreground/[0.01] border-t border-border/30 flex flex-wrap gap-2 justify-end shrink-0">
                    {/* Botones de acción dinámicos */}
                    {apt.status !== 'Confirmada' && apt.status !== 'Completada' && apt.status !== 'Cancelada' && (
                      <Button
                        disabled={updatingStatusId !== null}
                        onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                        className="bg-cyan-500 hover:bg-cyan-600 text-azul-profundo font-bold rounded-xl h-11 px-4 text-[10px] uppercase tracking-widest cursor-pointer transition-all border-none"
                      >
                        Confirmar
                      </Button>
                    )}
                    {apt.status !== 'Completada' && apt.status !== 'Cancelada' && (
                      <Button
                        disabled={updatingStatusId !== null}
                        onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl h-11 px-4 text-[10px] uppercase tracking-widest cursor-pointer transition-all border-none"
                      >
                        Completar
                      </Button>
                    )}
                    {apt.status !== 'Cancelada' && apt.status !== 'Completada' && (
                      <Button
                        variant="ghost"
                        disabled={updatingStatusId !== null}
                        onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                        className="hover:bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-xl h-11 px-4 text-[10px] uppercase tracking-widest cursor-pointer transition-all"
                      >
                        Cancelar
                      </Button>
                    )}
                    
                    <Link href={`/doctor/patients/${apt.patientId}`} onClick={() => setSelectedApt(null)}>
                      <Button className="bg-foreground/5 hover:bg-cyan-500 text-foreground hover:text-azul-profundo font-bold rounded-xl h-11 px-4 text-[10px] uppercase tracking-widest cursor-pointer transition-all border-none">
                        Atender Paciente
                      </Button>
                    </Link>

                    <Button 
                      variant="ghost" 
                      className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-foreground/5 cursor-pointer"
                      onClick={() => setSelectedApt(null)}
                    >
                      Cerrar
                    </Button>
                  </DialogFooter>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DoctorLayout>
  )
}
