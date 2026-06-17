'use client'

import { useState, useEffect, useCallback } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Shield, FileText, Users, Key, Activity, Send, Loader2 } from 'lucide-react'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { RequestAuthorizationModal } from '@/components/request-authorization-modal'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { sendNotification } from '@/lib/notifications'

interface Authorization {
  id: string
  patientId: string
  patient: {
    full_name: string
    wallet_address: string
  }
  type: string
  status: string
  created_at: string
  expires_at: string | null
}

export default function DoctorAuthorizationsPage() {
  const { doctorId, doctorName } = useDoctorAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [authorizations, setAuthorizations] = useState<Authorization[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAuthorizations = useCallback(async () => {
    if (!doctorId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('access_permissions')
        .select(`
          id,
          status,
          created_at,
          expires_at,
          patient_id,
          patient:profiles!patient_id (full_name, wallet_address)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          patientId: p.patient_id,
          patient: p.patient,
          type: 'Acceso Digital Seguro',
          status: p.status,
          created_at: p.created_at,
          expires_at: p.expires_at
        })) as Authorization[]
        setAuthorizations(mapped)
        
        // Calcular estadísticas
        const s = mapped.reduce((acc: any, curr: any) => {
          acc.total++
          const status = curr.status?.toLowerCase()
          if (status === 'active' || status === 'approved' || status === 'aprobado') acc.approved++
          else if (status === 'pending' || status === 'pendiente') acc.pending++
          else if (status === 'rejected' || status === 'rechazado') acc.rejected++
          return acc
        }, { total: 0, approved: 0, pending: 0, rejected: 0 })
        
        setStats(s)
      }
    } catch (err) {
      console.error('Error fetching authorizations:', err)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => {
    fetchAuthorizations()

    if (!doctorId) return

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_permissions',
          filter: `doctor_id=eq.${doctorId}`
        },
        () => {
          fetchAuthorizations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAuthorizations, doctorId, refreshTrigger])

  const handleCancel = async (authId: string) => {
    setActionLoading(authId)
    try {
      const { error } = await supabase
        .from('access_permissions')
        .delete()
        .eq('id', authId)
      
      if (error) throw error

      toast({
        title: 'Solicitud cancelada',
        description: 'La solicitud pendiente ha sido eliminada.'
      })
      
      setAuthorizations(prev => prev.filter(a => a.id !== authId))
    } catch (err) {
      console.error('Error cancelling auth:', err)
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la solicitud.',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemind = async (auth: Authorization) => {
    if (!doctorId) return
    setActionLoading('remind-' + auth.id)
    try {
      await sendNotification({
        recipientId: auth.patientId,
        senderId: doctorId,
        title: 'Recordatorio de solicitud',
        message: `El Dr. ${doctorName || 'su médico'} le recuerda que tiene una solicitud de acceso pendiente.`,
        type: 'request',
        link: '/permisos'
      })
      toast({
        title: 'Recordatorio enviado',
        description: `Se ha enviado un recordatorio a ${auth.patient?.full_name || 'Paciente'}.`
      })
    } catch (err) {
      console.error('Error sending reminder:', err)
      toast({
        title: 'Error',
        description: 'Hubo un problema al enviar el recordatorio.',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const statsDisplay = [
    {
      icon: Users,
      label: 'Total Solicitudes',
      value: stats.total.toString(),
      description: 'Histórico completo',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      icon: CheckCircle,
      label: 'Aprobadas',
      value: stats.approved.toString(),
      description: 'Acceso activo',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    {
      icon: Clock,
      label: 'Pendientes',
      value: stats.pending.toString(),
      description: 'En espera',
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
    {
      icon: XCircle,
      label: 'Rechazadas',
      value: stats.rejected.toString(),
      description: 'Acceso denegado',
      color: 'text-red-500',
      bg: 'bg-red-50'
    }
  ]

  return (
    <DoctorLayout>
      <div className="space-y-8 animate-slide-in p-6">
        
        {/* Header con icono y gradiente */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Autorizaciones</h1>
              <p className="text-sm text-gris-grafito">
                Centro de solicitudes de acceso registradas en la base de datos de salud
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {statsDisplay.map((stat, idx) => (
              <Card key={idx} className="card-premium p-4 hover:border-azul-electrico/30 transition-all">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl p-2 ${stat.bg}`}>
                      <stat.icon className={`size-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-azul-profundo">{stat.value}</p>
                    <p className="text-xs text-gris-grafito mt-0.5">{stat.label}</p>
                    <p className="text-xs text-gris-grafito/60 mt-0.5">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Banner principal */}
        <div className="bg-gradient-electric rounded-2xl p-5 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10">
            <div className="text-9xl">🔐</div>
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg" />
                <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white/20 to-white/10">
                  <Key className="size-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Acceso Seguro a Historiales</h3>
                <p className="text-sm text-white/80 mt-1">
                  Pide acceso a nuevos pacientes. Cada aprobación queda registrada de forma transparente.
                </p>
              </div>
            </div>
            <RequestAuthorizationModal onRequestSent={() => setRefreshTrigger(prev => prev + 1)} />
          </div>
        </div>

        {/* Authorizations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-azul-profundo">Solicitudes de Acceso</h3>
            <Button 
              onClick={fetchAuthorizations} 
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold h-10 px-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 border-none shrink-0"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4 animate-pulse" />}
              Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="size-10 text-azul-electrico animate-spin" />
              <p className="text-sm text-gris-grafito">Cargando autorizaciones...</p>
            </div>
          ) : !doctorId ? (
            <Card className="card-premium border-dashed bg-azul-hielo/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-azul-electrico/10 p-4 mb-4">
                  <Key className="size-8 text-azul-electrico" />
                </div>
                <h3 className="text-lg font-medium text-azul-profundo">Conexión Requerida</h3>
                <p className="text-sm text-gris-grafito max-w-xs mt-2 mb-6">
                  Debes conectar tu cuenta de Google para gestionar tus autorizaciones.
                </p>
                <Button className="btn-premium" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Ir a Conectar
                </Button>
              </CardContent>
            </Card>
          ) : authorizations.length === 0 ? (
            <Card className="card-premium border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-100 p-4 mb-4">
                  <Shield className="size-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-azul-profundo">No hay solicitudes</h3>
                <p className="text-sm text-gris-grafito max-w-xs mt-2">
                  Aún no has solicitado acceso a ningún historial.
                </p>
              </CardContent>
            </Card>
          ) : (
            authorizations.map((auth, i) => (
              <Card key={auth.id || i} className="bg-foreground/[0.03] backdrop-blur-xl border border-border/50 shadow-md shadow-black/5 hover:border-cyan-500/20 rounded-[2rem] transition-all duration-300 group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-foreground group-hover:text-cyan-400 transition-colors">{auth.patient?.full_name || 'Paciente Desconocido'}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1.5 bg-foreground/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                            <Clock className="size-3.5 text-cyan-500" /> 
                            Solicitado: {auth.created_at ? format(new Date(auth.created_at), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                          </span>
                          {auth.expires_at && (
                            <span className="flex items-center gap-1.5 bg-foreground/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                              <Activity className="size-3.5 text-orange-500" /> 
                              Expira: {format(new Date(auth.expires_at), 'dd MMM yyyy', { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end gap-3">
                      {(auth.status?.toLowerCase() === 'pending' || auth.status === 'Pendiente') && (
                        <Badge className="bg-amber-100/50 text-amber-700 border-amber-200 font-bold rounded-lg px-2.5 py-1">
                          <Clock className="size-3 mr-1" /> Pendiente
                        </Badge>
                      )}
                      {(auth.status?.toLowerCase() === 'active' || auth.status?.toLowerCase() === 'approved' || auth.status === 'Aprobado') && (
                        <Badge className="bg-emerald-100/50 text-emerald-700 border-emerald-200 font-bold rounded-lg px-2.5 py-1">
                          <CheckCircle className="size-3 mr-1" /> Aprobado
                        </Badge>
                      )}
                      {(auth.status?.toLowerCase() === 'rejected' || auth.status === 'Rechazado') && (
                        <Badge className="bg-red-100/50 text-red-700 border-red-200 font-bold rounded-lg px-2.5 py-1">
                          <XCircle className="size-3 mr-1" /> Rechazado
                        </Badge>
                      )}
                      
                      {(auth.status?.toLowerCase() === 'pending' || auth.status === 'Pendiente') && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-9 px-4 rounded-xl border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 font-bold transition-all"
                            onClick={() => handleCancel(auth.id)}
                            disabled={actionLoading === auth.id || actionLoading === 'remind-' + auth.id}
                          >
                            {actionLoading === auth.id ? 'Cancelando...' : 'Cancelar'}
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold h-9 px-4 rounded-xl shadow-md transition-all text-xs border-none"
                            onClick={() => handleRemind(auth)}
                            disabled={actionLoading === auth.id || actionLoading === 'remind-' + auth.id}
                          >
                            {actionLoading === 'remind-' + auth.id ? 'Enviando...' : 'Recordar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DoctorLayout>
  )
}
