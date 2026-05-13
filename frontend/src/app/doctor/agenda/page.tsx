'use client'

import { useState, useEffect, useCallback } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ChevronRight, 
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
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { NewAppointmentModal } from '@/components/new-appointment-modal'

interface Appointment {
  id: string
  time: string
  endTime: string
  patientName: string
  type: string
  status: string
  priority: string
  location: string
  notes?: string
}

export default function DoctorAgendaPage() {
  const { doctorId } = useDoctorAuth()
  const [currentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    patients: 0,
    completed: 0,
    upcoming: 0
  })

  const fetchAgenda = useCallback(async () => {
    if (!doctorId) return
    setLoading(true)
    try {
      // Formatear fecha para la consulta (YYYY-MM-DD)
      const dateStr = format(currentDate, 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          end_time,
          location,
          status,
          priority,
          reason,
          notes,
          profiles!patient_id (full_name)
        `)
        .eq('doctor_id', doctorId)
        .eq('appointment_date', dateStr)
        .order('appointment_time', { ascending: true })

      if (error) throw error

      if (data) {
        const mapped: Appointment[] = data.map((apt: any) => ({
          id: apt.id,
          time: apt.appointment_time?.slice(0, 5) || '--:--',
          endTime: apt.end_time?.slice(0, 5) || '--:--',
          patientName: apt.profiles?.full_name || 'Paciente Desconocido',
          type: apt.reason || 'Consulta General',
          status: apt.status === 'scheduled' ? 'Confirmada' : 
                  apt.status === 'completed' ? 'Completada' : 
                  apt.status === 'confirmed' ? 'Confirmada' : 
                  apt.status === 'cancelled' ? 'Cancelada' : 'Pendiente',
          priority: apt.priority === 'high' ? 'Alta' : 'Normal',
          location: apt.location || 'Consultorio A-102',
          notes: apt.notes
        }))

        setAppointments(mapped)

        // Calcular estadísticas
        const total = mapped.length
        const uniquePatients = new Set(mapped.map(a => a.patientName)).size
        const completed = mapped.filter(a => a.status === 'Completada').length
        const upcoming = mapped.filter(a => a.status === 'Confirmada' || a.status === 'Pendiente').length

        setStats({
          total,
          patients: uniquePatients,
          completed,
          upcoming
        })
      }
    } catch (err) {
      console.error('Error fetching agenda:', err)
    } finally {
      setLoading(false)
    }
  }, [doctorId, currentDate])

  useEffect(() => {
    fetchAgenda()

    if (!doctorId) return

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('agenda-changes')
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

  const formatDateLabel = (date: Date) => {
    return new Intl.DateTimeFormat('es-BO', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date)
  }

  return (
    <DoctorLayout>
      <div className="animate-slide-in space-y-8 p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground capitalize">
                {currentDate.toLocaleDateString('es-BO', { weekday: 'long' })}, {currentDate.getDate()}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {formatDateLabel(currentDate)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl border-2" onClick={fetchAgenda}>
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <NewAppointmentModal onAppointmentCreated={fetchAgenda} />
          </div>
        </div>

        {/* Day Overview Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Citas', value: stats.total.toString(), icon: CalendarIcon, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Pacientes', value: stats.patients.toString(), icon: Users, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Completadas', value: stats.completed.toString(), icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Próximas', value: stats.upcoming.toString(), icon: Clock, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10' },
          ].map((stat, i) => (
            <Card key={i} className="card-premium border-none shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    <p className={`mt-1 text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Timeline Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Línea de Tiempo
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Buscar en agenda..." 
                  className="pl-9 pr-4 py-2 bg-muted/50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64 outline-none transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-bold">Cargando tu agenda...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted/50">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-bold italic">No tienes citas programadas para hoy.</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-[47px] before:top-0 before:bottom-0 before:w-0.5 before:bg-muted/60">
                {appointments.map((apt) => (
                  <div key={apt.id} className="relative flex gap-6 group">
                    {/* Time indicator */}
                    <div className="flex flex-col items-center pt-2 min-w-[95px]">
                      <span className="text-sm font-black text-foreground">{apt.time}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">{apt.endTime}</span>
                      <div className={`absolute left-[41px] top-4 h-3.5 w-3.5 rounded-full border-4 border-background z-10 ${
                        apt.status === 'Completada' ? 'bg-emerald-500' : 
                        apt.status === 'Pendiente' ? 'bg-orange-400' : 'bg-primary'
                      }`} />
                    </div>

                    {/* Appointment Card */}
                    <Card className={`flex-1 card-premium border-none shadow-sm transition-all hover:shadow-md group-hover:translate-x-1 ${
                      apt.status === 'Completada' ? 'opacity-70 grayscale-[0.3]' : ''
                    }`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black ${
                              apt.patientName.charCodeAt(0) % 2 === 0 ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400' : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'
                            }`}>
                              {apt.patientName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-foreground">{apt.patientName}</h4>
                                {apt.priority === 'Alta' && (
                                  <Badge className="bg-red-500/10 text-red-600 border-none text-[10px] h-5 font-bold">ALTA PRIORIDAD</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                {apt.type}
                              </p>
                              <div className="mt-3 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  {apt.location === 'Telemedicina' ? <Video className="h-3 w-3 text-primary" /> : <MapPin className="h-3 w-3" />}
                                  {apt.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {apt.notes || 'Sin notas'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <Badge className={`rounded-lg px-3 py-1 font-bold text-[11px] ${
                              apt.status === 'Completada' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/20' : 
                              apt.status === 'Confirmada' ? 'bg-primary/10 text-primary border-primary/20' : 
                              'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200/20'
                            }`}>
                              {apt.status.toUpperCase()}
                            </Badge>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                              <Button size="sm" className="h-8 rounded-lg font-bold px-3 text-xs bg-primary hover:bg-primary/90">
                                Atender
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Section */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-lg overflow-hidden bg-azul-profundo text-white">
              <div className="bg-gradient-premium p-6 pb-4">
                <CardTitle className="text-xl font-black">Mi Calendario</CardTitle>
                <CardDescription className="text-white/60 text-xs mt-1">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </CardDescription>
              </div>
              <CardContent className="p-6 bg-white/10 backdrop-blur-sm">
                {/* Simplified Calendar View */}
                <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase text-white/40 mb-4">
                  <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span><span>Do</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }).map((_, i) => (
                    <button 
                      key={i} 
                      className={`h-8 w-full rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        i + 1 === currentDate.getDate() 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button className="w-full mt-6 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md font-bold h-11 rounded-xl">
                  Ver Calendario Completo
                </Button>
              </CardContent>
            </Card>

            <Card className="card-premium border-none shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-sm font-bold">Recordatorios</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {stats.total > 0 && stats.completed < stats.total && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-orange-600 dark:text-orange-400">Atención Pendiente</p>
                      <p className="text-[10px] text-orange-600/80 dark:text-orange-400/60">Tienes {stats.upcoming} citas por atender hoy.</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Pacientes del Día</p>
                    <p className="text-[10px] text-blue-600/80 dark:text-blue-400/60">{stats.patients} pacientes registrados.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DoctorLayout>
  )
}
