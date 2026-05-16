'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  MoreVertical,
  CalendarCheck,
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
  Stethoscope
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'
import { useProfile } from '@/hooks/useProfile'
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { StatCard } from '@/components/ui/stat-card'
import { PatientAppointmentCard } from '@/components/patient-appointment-card'

interface Appointment {
  id: string
  time: string
  endTime: string
  doctorName: string
  specialty: string
  reason: string
  type: 'presencial' | 'virtual'
  status: string
  priority: string
  location: string
  notes?: string
  date: string
}

export default function PatientAgendaPage() {
  const { walletAddress } = useWallet()
  const { profile } = useProfile(walletAddress)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    doctors: 0,
    completed: 0,
    upcoming: 0
  })

  const fetchAgenda = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          end_time,
          location,
          status,
          priority,
          reason,
          notes,
          type,
          doctor_name,
          specialty
        `)
        .eq('patient_id', profile.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (error) throw error

      if (data) {
        const mapped: Appointment[] = data.map((apt: any) => ({
          id: apt.id,
          date: apt.appointment_date,
          time: apt.appointment_time?.slice(0, 5) || '--:--',
          endTime: apt.end_time?.slice(0, 5) || '--:--',
          doctorName: apt.doctor_name || 'Médico',
          specialty: apt.specialty || 'Especialista',
          reason: apt.reason || 'Consulta General',
          type: apt.type || 'presencial',
          status: apt.status === 'scheduled' ? 'Programada' : 
                  apt.status === 'confirmed' ? 'Confirmada' : 
                  apt.status === 'completed' ? 'Completada' : 
                  apt.status === 'cancelled' ? 'Cancelada' : 
                  apt.status === 'in_progress' ? 'En Curso' : 'Pendiente',
          priority: apt.priority === 'high' ? 'Alta' : 'Normal',
          location: apt.location || 'Consultorio',
          notes: apt.notes
        }))

        setAppointments(mapped)

        // Calcular estadísticas
        const total = mapped.length
        const uniqueDoctors = new Set(mapped.map(a => a.doctorName)).size
        const completed = mapped.filter(a => a.status === 'Completada').length
        const upcoming = mapped.filter(a => a.status === 'Confirmada' || a.status === 'Programada').length

        setStats({
          total,
          doctors: uniqueDoctors,
          completed,
          upcoming
        })
      }
    } catch (err) {
      console.error('Error fetching agenda:', err)
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchAgenda()
  }, [fetchAgenda])

  const filteredAppointments = appointments.filter(apt => 
    apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Generar días para el selector de calendario pequeño
  const weekStart = startOfWeek(currentDate, { locale: es })
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  })

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-in">
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Mis Citas</span>
              </div>
              <div className="size-1.5 rounded-full bg-foreground/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight capitalize">
              Agenda de <span className="text-cyan-500">Salud</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="bg-foreground/5 rounded-2xl font-bold h-12 px-6 hover:bg-foreground/10" onClick={fetchAgenda}>
              <Filter className="size-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Citas" 
            value={stats.total.toString()} 
            icon={CalendarIcon} 
            color="text-cyan-500" 
          />
          <StatCard 
            title="Médicos" 
            value={stats.doctors.toString()} 
            icon={Stethoscope} 
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
          {/* Main Content Column */}
          <div className="lg:col-span-9 space-y-8">
            {/* Integrated Appointment Card */}
            <PatientAppointmentCard onAppointmentCreated={fetchAgenda} />

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
              <Input
                placeholder="Buscar por médico o motivo de consulta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 rounded-3xl bg-foreground/[0.03] backdrop-blur-xl border-border/50 focus:border-cyan-500/50 text-base"
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="size-12 text-cyan-500 animate-spin mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-foreground/40">Cargando tus citas...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-foreground/[0.03] backdrop-blur-xl p-20 rounded-[3rem] border border-border/50 text-center">
                 <div className="flex justify-center mb-4">
                    <div className="size-16 rounded-full bg-foreground/5 flex items-center justify-center">
                       <CalendarIcon className="size-8 text-foreground/20" />
                    </div>
                 </div>
                 <h3 className="text-xl font-black text-foreground">No tienes citas agendadas</h3>
                 <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest mt-2">Usa el formulario superior para agendar una</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-[1.85rem] before:top-4 before:bottom-4 before:w-px before:bg-foreground/5">
                {filteredAppointments.map((apt) => (
                  <div key={apt.id} className="relative flex gap-6 group pl-12">
                    {/* Time dot indicator */}
                    <div className={`absolute left-6 top-1/2 -translate-y-1/2 size-3 rounded-full border-[3px] border-background z-10 transition-all ${
                      apt.status === 'Completada' ? 'bg-green-500' : 
                      apt.status === 'Confirmada' ? 'bg-cyan-500' : 'bg-orange-500'
                    } group-hover:scale-125`} />

                    {/* Appointment Card */}
                    <div className={`flex-1 bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-[2rem] border border-border group hover:border-cyan-500/20 transition-all shadow-lg shadow-black/5 ${
                      apt.status === 'Completada' ? 'opacity-60' : ''
                    }`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`size-14 rounded-2xl flex items-center justify-center border border-border/50 transition-colors ${
                             apt.doctorName.charCodeAt(0) % 2 === 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            <span className="text-xl font-black">{apt.doctorName.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-black text-foreground group-hover:text-cyan-400 transition-colors">{apt.doctorName}</h4>
                              <div className="px-2 py-0.5 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                                 <span className="text-[8px] font-black text-cyan-500 uppercase tracking-tighter">{apt.specialty}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">{apt.reason}</p>
                              <div className="flex items-center gap-1 text-[10px] font-black text-foreground/60">
                                <CalendarIcon className="size-3" />
                                {format(new Date(apt.date), 'dd/MM/yyyy')}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-black text-foreground/60">
                                <Clock className="size-3" />
                                {apt.time}
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
                           <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-foreground/10">
                              <MoreVertical className="size-4" />
                           </Button>
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

          {/* Sidebar Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Calendar Widget */}
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
                      onClick={() => setCurrentDate(addDays(currentDate, -1))}
                    >
                      <ChevronLeft className="size-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-7 rounded-full hover:bg-white/10 text-white"
                      onClick={() => setCurrentDate(addDays(currentDate, 1))}
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
                          onClick={() => setCurrentDate(day)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                            isSelected 
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
                  <Button className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white border-none h-10 rounded-xl font-black uppercase tracking-widest text-[8px]">
                    Ver Mes Completo
                  </Button>
                </div>
              </div>
            </div>

            {/* Daily Reminders */}
            <div className="bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-[2.5rem] border border-border shadow-lg shadow-black/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-4">Avisos</h3>
              <div className="space-y-3">
                {stats.upcoming > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-500/5 border border-orange-500/10 group">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                      <AlertCircle className="size-3.5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground/80 leading-tight">Cita Próxima</p>
                      <p className="text-[9px] font-bold text-foreground/40 mt-0.5">Tienes una consulta programada.</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 group">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                    <Stethoscope className="size-3.5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-foreground/80 leading-tight">Chequeo Preventivo</p>
                    <p className="text-[9px] font-bold text-foreground/40 mt-0.5">Recuerda tus controles anuales.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
