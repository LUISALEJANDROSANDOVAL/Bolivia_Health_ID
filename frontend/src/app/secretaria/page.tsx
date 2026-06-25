'use client'

import { useState, useEffect, useCallback } from 'react'
import { SecretariaLayout } from '@/components/secretaria-layout'
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
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
  Building, 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  Plus, 
  Check, 
  X, 
  Loader2, 
  UserPlus,
  Stethoscope,
  Video,
  MapPin,
  ClipboardCheck
} from 'lucide-react'

interface Appointment {
  id: string
  date: string
  time: string
  status: string
  type: 'presencial' | 'virtual'
  doctorName: string
  specialty: string
  patientName: string
  patientCi: string
  patientId: string
  reason: string
}

export default function SecretariaDashboard() {
  const { walletAddress } = useWallet()
  const [loading, setLoading] = useState(true)
  const [sucursal, setSucursal] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  
  // Filters
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  
  // Patient search state
  const [patientSearchCi, setPatientSearchCi] = useState('')
  const [foundPatient, setFoundPatient] = useState<any>(null)
  const [searchingPatient, setSearchingPatient] = useState(false)
  const [showCreatePatientForm, setShowCreatePatientForm] = useState(false)
  
  // New patient form
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    ci: '',
    email: '',
    phone: ''
  })

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    doctor_id: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_time: '09:00',
    reason: 'Consulta General'
  })

  // Load sucursal, doctors, and appointments
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // 1. Obtener la sucursal asignada a esta secretaria
      const { data: secSucs, error: secError } = await supabase
        .from('secretaria_sucursal')
        .select(`
          sucursal_id, 
          sucursales (
            id, 
            name, 
            address, 
            hospitals (name, logo_url)
          )
        `)
        .eq('secretaria_id', session.user.id)
        .maybeSingle()

      if (secError) throw secError
      if (!secSucs) {
        toast.error('No tienes una sucursal asignada. Contacta al administrador.')
        setLoading(false)
        return
      }

      const activeSucursal = Array.isArray(secSucs.sucursales)
        ? secSucs.sucursales[0]
        : (secSucs.sucursales as any)
      setSucursal(activeSucursal)

      // 2. Obtener médicos de esta sucursal
      const { data: sucsDocs } = await supabase
        .from('doctor_sucursal')
        .select('doctor_id, profiles(id, full_name, specialty)')
        .eq('sucursal_id', activeSucursal.id)

      const activeDoctors = sucsDocs?.map((d: any) => d.profiles).filter(Boolean) || []
      setDoctors(activeDoctors)

      // 3. Obtener citas de esta sucursal
      const { data: apts, error: aptsError } = await supabase
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
          profiles!patient_id (full_name, cedula_identidad)
        `)
        .eq('sucursal_id', activeSucursal.id)
        .order('appointment_time', { ascending: true })

      if (aptsError) throw aptsError

      if (apts) {
        const mapped: Appointment[] = apts.map((a: any) => ({
          id: a.id,
          date: a.appointment_date,
          time: a.appointment_time?.slice(0, 5) || '--:--',
          status: a.status,
          type: a.type || 'presencial',
          doctorName: a.doctor_name || 'Médico',
          specialty: a.specialty || 'General',
          patientName: a.profiles?.full_name || 'Paciente',
          patientCi: a.profiles?.cedula_identidad || 'N/A',
          patientId: a.patient_id,
          reason: a.reason || 'Consulta'
        }))
        setAppointments(mapped)
      }
    } catch (err: any) {
      console.error('Error cargando datos de secretaría:', err)
      toast.error('Error al cargar la información: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Status Change handlers
  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) throw error
      
      toast.success(`Cita actualizada a: ${newStatus === 'in_progress' ? 'En Curso' : newStatus === 'confirmed' ? 'Confirmada' : newStatus}`)
      fetchData()
    } catch (err: any) {
      toast.error('Error al actualizar el estado: ' + err.message)
    }
  }

  // Patient CI lookup
  const handleLookupPatient = async () => {
    if (!patientSearchCi) return
    setSearchingPatient(true)
    setFoundPatient(null)
    setShowCreatePatientForm(false)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, cedula_identidad')
        .eq('cedula_identidad', patientSearchCi)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setFoundPatient(data)
        toast.success('Paciente encontrado: ' + data.full_name)
      } else {
        toast.info('Paciente no registrado. Puedes crearlo abajo.')
        setNewPatientData({
          name: '',
          ci: patientSearchCi,
          email: '',
          phone: ''
        })
        setShowCreatePatientForm(true)
      }
    } catch (err: any) {
      toast.error('Error al buscar paciente: ' + err.message)
    } finally {
      setSearchingPatient(false)
    }
  }

  // Create Patient Profile
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPatientData.name || !newPatientData.ci) return
    setBookingLoading(true)

    try {
      const walletPlaceholder = `placeholder_${newPatientData.ci.toLowerCase()}_${Date.now()}`
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          wallet_address: walletPlaceholder,
          full_name: newPatientData.name,
          cedula_identidad: newPatientData.ci,
          email: newPatientData.email || null,
          phone: newPatientData.phone || null,
          role: 'paciente'
        })
        .select()
        .single()

      if (error) throw error

      setFoundPatient(data)
      setShowCreatePatientForm(false)
      toast.success('Perfil de Paciente creado con éxito')
    } catch (err: any) {
      toast.error('Error al crear perfil: ' + err.message)
    } finally {
      setBookingLoading(false)
    }
  }

  // Handle Book appointment submission
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foundPatient || !bookingForm.doctor_id || !sucursal) {
      toast.error('Falta seleccionar médico o paciente')
      return
    }

    setBookingLoading(true)
    try {
      const selectedDocObj = doctors.find(d => d.id === bookingForm.doctor_id)
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: foundPatient.id,
          doctor_id: bookingForm.doctor_id,
          doctor_name: selectedDocObj?.full_name || 'Médico',
          specialty: selectedDocObj?.specialty || 'General',
          appointment_date: bookingForm.appointment_date,
          appointment_time: bookingForm.appointment_time,
          sucursal_id: sucursal.id,
          location: `${sucursal.hospitals?.name || 'Hospital'} - ${sucursal.name}`,
          type: 'presencial',
          status: 'confirmed' // Secretarias agendan directamente como confirmadas
        })

      if (error) throw error

      toast.success('Cita agendada correctamente')
      setIsBookModalOpen(false)
      // Reset search/booking fields
      setPatientSearchCi('')
      setFoundPatient(null)
      setBookingForm({
        doctor_id: '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        appointment_time: '09:00',
        reason: 'Consulta General'
      })
      fetchData()
    } catch (err: any) {
      toast.error('Error al programar la cita: ' + err.message)
    } finally {
      setBookingLoading(false)
    }
  }

  // Filtering appointments list
  const filteredAppointments = appointments.filter(apt => {
    const matchesDate = apt.date === filterDate
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientCi.includes(searchTerm) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesDate && matchesStatus && matchesSearch
  })

  // Count stats
  const stats = {
    total: filteredAppointments.length,
    pending: filteredAppointments.filter(a => a.status === 'scheduled').length,
    confirmed: filteredAppointments.filter(a => a.status === 'confirmed').length,
    inProgress: filteredAppointments.filter(a => a.status === 'in_progress').length,
    completed: filteredAppointments.filter(a => a.status === 'completed').length,
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
    <SecretariaLayout>
      <div className="space-y-6">
        
        {/* Header de Sede */}
        {sucursal && (
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-amber-500/20 to-orange-500/10 p-6 md:p-8 border border-amber-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="size-5 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest text-amber-500">{sucursal.hospitals?.name || 'Hospital'}</span>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">{sucursal.name}</h1>
              <p className="text-sm text-muted-foreground">{sucursal.address}</p>
            </div>
            <Button 
              onClick={() => setIsBookModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 rounded-xl flex items-center gap-2 self-start md:self-auto shrink-0 shadow-lg shadow-amber-500/10"
            >
              <Plus className="size-5" />
              Agendar Cita en Recepción
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-none bg-foreground/[0.02]">
            <CardContent className="p-5 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">Citas Hoy</p>
              <h3 className="text-3xl font-black text-foreground mt-2">{stats.total}</h3>
            </CardContent>
          </Card>
          <Card className="border-none bg-foreground/[0.02]">
            <CardContent className="p-5 text-center">
              <p className="text-xs font-bold text-blue-500/80 uppercase">Pendientes</p>
              <h3 className="text-3xl font-black text-blue-500 mt-2">{stats.pending}</h3>
            </CardContent>
          </Card>
          <Card className="border-none bg-foreground/[0.02]">
            <CardContent className="p-5 text-center">
              <p className="text-xs font-bold text-emerald-500/80 uppercase">Confirmadas</p>
              <h3 className="text-3xl font-black text-emerald-500 mt-2">{stats.confirmed}</h3>
            </CardContent>
          </Card>
          <Card className="border-none bg-foreground/[0.02]">
            <CardContent className="p-5 text-center">
              <p className="text-xs font-bold text-amber-500/80 uppercase">En Turno</p>
              <h3 className="text-3xl font-black text-amber-500 mt-2">{stats.inProgress}</h3>
            </CardContent>
          </Card>
          <Card className="border-none bg-foreground/[0.02]">
            <CardContent className="p-5 text-center col-span-2 md:col-span-1">
              <p className="text-xs font-bold text-cyan-500/80 uppercase">Completadas</p>
              <h3 className="text-3xl font-black text-cyan-500 mt-2">{stats.completed}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Agenda y Filtros */}
        <Card className="border-none bg-foreground/[0.01] rounded-[2.5rem] p-4 md:p-6">
          <CardHeader className="px-2 pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Calendar className="size-5 text-amber-500" />
              Agenda del Día
            </CardTitle>
            <CardDescription>Visualiza y gestiona las citas de hoy de forma ágil.</CardDescription>
          </CardHeader>
          <CardContent className="p-2 space-y-6">
            
            {/* Controles de Filtro */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-[200px]">
                <Input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="h-11 rounded-xl bg-foreground/[0.03] border-border/50 font-bold"
                />
              </div>

              <div className="w-full md:w-[150px]">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-11 rounded-xl bg-foreground/[0.03] border-border/50 font-bold">
                    <SelectValue placeholder="Estado" />
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

              <div className="w-full relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por paciente, CI o médico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-foreground/[0.03] border-border/50 font-bold text-sm"
                />
              </div>
            </div>

            {/* Listado de Citas */}
            {loading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader2 className="size-8 animate-spin text-amber-500" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="py-20 text-center space-y-2 border border-dashed border-border rounded-2xl">
                <Users className="size-10 text-muted-foreground mx-auto opacity-35" />
                <h3 className="text-md font-black text-foreground/60">No hay citas programadas</h3>
                <p className="text-xs text-muted-foreground">No se encontraron registros para la fecha o filtros seleccionados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border/50 bg-background/50">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-foreground/[0.02]">
                      <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Hora</th>
                      <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Paciente</th>
                      <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Médico</th>
                      <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Tipo</th>
                      <th className="p-4 font-black text-xs uppercase tracking-wider text-muted-foreground">Estado</th>
                      <th className="p-4 font-black text-xs text-right uppercase tracking-wider text-muted-foreground">Acciones en Recepción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="border-b border-border/40 hover:bg-foreground/[0.01] transition-colors">
                        <td className="p-4 font-bold flex items-center gap-2">
                          <Clock className="size-3.5 text-amber-500" />
                          {apt.time}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-foreground">{apt.patientName}</div>
                          <div className="text-[10px] text-muted-foreground">C.I: {apt.patientCi}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-foreground">{apt.doctorName}</div>
                          <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{apt.specialty}</div>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                            {apt.type === 'presencial' ? <MapPin className="size-3.5 text-green-500" /> : <Video className="size-3.5 text-blue-500" />}
                            {apt.type === 'presencial' ? 'Presencial' : 'Virtual'}
                          </span>
                        </td>
                        <td className="p-4">{getStatusBadge(apt.status)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            
                            {/* Acción: Confirmar */}
                            {apt.status === 'scheduled' && (
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                                className="h-8 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-lg font-bold text-xs"
                                title="Confirmar Cita"
                              >
                                <Check className="size-3.5 mr-1" />
                                Confirmar
                              </Button>
                            )}

                            {/* Acción: Check-in (Entrar a Consulta) */}
                            {(apt.status === 'confirmed' || apt.status === 'scheduled') && (
                              <Button 
                                size="sm"
                                onClick={() => handleUpdateStatus(apt.id, 'in_progress')}
                                className="h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-md shadow-amber-500/10"
                                title="Paciente llegó a la clínica (Check-in)"
                              >
                                <ClipboardCheck className="size-3.5 mr-1" />
                                Check-in
                              </Button>
                            )}

                            {/* Acción: Cancelar */}
                            {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                              <Button 
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
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
      </div>

      {/* Modal: Agendar Nueva Cita */}
      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background/95 backdrop-blur-xl border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Plus className="size-6 text-amber-500" />
              Nueva Cita
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Busca el paciente por Cédula de Identidad y selecciona al profesional médico.
            </DialogDescription>
          </DialogHeader>

          {/* Buscador de Paciente */}
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Cédula de Identidad del Paciente</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ej. 1234567 LP"
                  value={patientSearchCi}
                  onChange={(e) => setPatientSearchCi(e.target.value)}
                  className="h-12 rounded-xl bg-foreground/[0.03] border-border/50 font-bold"
                />
                <Button 
                  onClick={handleLookupPatient}
                  disabled={searchingPatient}
                  className="bg-foreground text-background h-12 px-4 rounded-xl font-bold flex items-center gap-1.5 shrink-0"
                >
                  {searchingPatient ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  Buscar
                </Button>
              </div>
            </div>

            {/* Ficha de Paciente Encontrado */}
            {foundPatient && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1 animate-slide-in">
                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Paciente Seleccionado</p>
                <h4 className="text-md font-black text-foreground">{foundPatient.full_name}</h4>
                <p className="text-xs text-muted-foreground">CI: {foundPatient.cedula_identidad} | Correo: {foundPatient.email || 'N/A'}</p>
              </div>
            )}

            {/* Formulario de creación de Paciente si no existe */}
            {showCreatePatientForm && (
              <form onSubmit={handleCreatePatient} className="p-4 bg-amber-500/[0.03] border border-amber-500/20 rounded-2xl space-y-4 animate-slide-in">
                <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                  <UserPlus className="size-3.5" />
                  Registrar Paciente Nuevo
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-[10px] font-bold uppercase text-foreground/50">Nombre Completo</Label>
                    <Input 
                      required
                      placeholder="Ej. Carlos Mendoza"
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
                      className="h-10 rounded-xl bg-background border-border/50 mt-1 font-bold text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] font-bold uppercase text-foreground/50">Cédula de Identidad</Label>
                      <Input 
                        disabled
                        required
                        value={newPatientData.ci}
                        className="h-10 rounded-xl bg-background border-border/50 mt-1 font-bold text-sm opacity-70"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold uppercase text-foreground/50">Teléfono</Label>
                      <Input 
                        placeholder="Ej. 70000000"
                        value={newPatientData.phone}
                        onChange={(e) => setNewPatientData({...newPatientData, phone: e.target.value})}
                        className="h-10 rounded-xl bg-background border-border/50 mt-1 font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold uppercase text-foreground/50">Correo Electrónico</Label>
                    <Input 
                      type="email"
                      placeholder="carlos@email.com"
                      value={newPatientData.email}
                      onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})}
                      className="h-10 rounded-xl bg-background border-border/50 mt-1 font-bold text-sm"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={bookingLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-10 rounded-xl text-xs flex items-center justify-center gap-1.5">
                  {bookingLoading && <Loader2 className="size-3.5 animate-spin" />}
                  Crear Ficha y Seleccionar
                </Button>
              </form>
            )}

            <Separator className="bg-border/50 my-2" />

            {/* Formulario de Cita */}
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Médico Especialista Habilitado</Label>
                <Select 
                  value={bookingForm.doctor_id} 
                  onValueChange={(val) => setBookingForm({...bookingForm, doctor_id: val})}
                  required
                >
                  <SelectTrigger className="h-12 rounded-xl bg-foreground/[0.03] border-border/50 font-bold text-sm">
                    <SelectValue placeholder="Seleccionar médico" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    {doctors.map(d => (
                      <SelectItem key={d.id} value={d.id} className="font-bold">
                        {d.full_name} ({d.specialty || 'General'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Fecha de Cita</Label>
                  <Input 
                    type="date"
                    value={bookingForm.appointment_date}
                    onChange={(e) => setBookingForm({...bookingForm, appointment_date: e.target.value})}
                    required
                    className="h-12 rounded-xl bg-foreground/[0.03] border-border/50 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Hora</Label>
                  <Input 
                    type="time"
                    value={bookingForm.appointment_time}
                    onChange={(e) => setBookingForm({...bookingForm, appointment_time: e.target.value})}
                    required
                    className="h-12 rounded-xl bg-foreground/[0.03] border-border/50 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Motivo de Consulta</Label>
                <Input 
                  placeholder="Ej. Chequeo médico general, dolor de cabeza..."
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({...bookingForm, reason: e.target.value})}
                  className="h-12 rounded-xl bg-foreground/[0.03] border-border/50 font-bold text-sm"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsBookModalOpen(false)}
                  className="h-12 rounded-xl font-bold"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={bookingLoading || !foundPatient || !bookingForm.doctor_id}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
                >
                  {bookingLoading && <Loader2 className="size-4 animate-spin" />}
                  Confirmar y Agendar Cita
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

    </SecretariaLayout>
  )
}
