'use client'

import { useState, useEffect, useCallback } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Shield, FileText, Users, Key, Activity, Send, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { RequestAuthorizationModal } from '@/components/request-authorization-modal'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { sendNotification } from '@/lib/notifications'

interface Authorization {
  id: string
  patientId: string
  patient: string
  type: string
  status: string
  requestDate: string
  expiresIn: string
}

export default function DoctorAuthorizationsPage() {
  const { doctorId, doctorName } = useDoctorAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [authorizations, setAuthorizations] = useState<Authorization[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAuthorizations = useCallback(async () => {
    if (!doctorId) return
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
          profiles!patient_id (full_name)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped: Authorization[] = (data || []).map((p: any) => ({
        id: p.id,
        patientId: p.patient_id,
        patient: p.profiles?.full_name || 'Paciente Desconocido',
        type: 'Acceso Digital Seguro',
        status: p.status === 'pending' ? 'Pendiente' : p.status === 'active' ? 'Aprobado' : 'Rechazado',
        requestDate: new Date(p.created_at).toLocaleDateString(),
        expiresIn: p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Indefinido'
      }))

      setAuthorizations(mapped)
    } catch (err) {
      console.error('Error fetching authorizations:', err)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => {
    fetchAuthorizations()

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
  }, [fetchAuthorizations, doctorId])

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
      
      // Update local state to avoid waiting for real-time channel
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
        description: `Se ha enviado un recordatorio a ${auth.patient}.`
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

  const stats = [
    {
      icon: Users,
      label: 'Total Solicitudes',
      value: authorizations.length.toString(),
      description: 'Histórico completo',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      icon: CheckCircle,
      label: 'Aprobadas',
      value: authorizations.filter(a => a.status === 'Aprobado').length.toString(),
      description: 'Acceso activo',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    {
      icon: Clock,
      label: 'Pendientes',
      value: authorizations.filter(a => a.status === 'Pendiente').length.toString(),
      description: 'En espera',
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
    {
      icon: XCircle,
      label: 'Rechazadas',
      value: authorizations.filter(a => a.status === 'Rechazado').length.toString(),
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
              <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Autorizaciones Web3</h1>
              <p className="text-sm text-gris-grafito">
                Centro de solicitudes de acceso registradas en blockchain
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {stats.map((stat, idx) => (
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
                  Pide acceso a nuevos pacientes. Cada aprobación queda registrada en la blockchain para máxima transparencia.
                </p>
              </div>
            </div>
            <RequestAuthorizationModal onRequestSent={() => setRefreshTrigger(prev => prev + 1)} />
          </div>
        </div>

        {/* Authorizations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-azul-profundo">Solicitudes Recientes</h3>
            {loading && <div className="text-xs text-gris-grafito/60 animate-pulse">Actualizando lista...</div>}
          </div>

          {!loading && authorizations.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <Shield className="size-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-gris-grafito font-medium">No tienes solicitudes pendientes.</p>
            </div>
          ) : authorizations.map((auth, i) => (
            <Card key={i} className="card-premium hover:border-azul-electrico/30 transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-slate-100 p-3">
                      <FileText className="size-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-azul-profundo">{auth.patient}</h3>
                      <p className="text-sm text-gris-grafito mb-2">{auth.type}</p>
                      <div className="flex items-center gap-4 text-xs text-gris-grafito/80">
                        <span className="flex items-center gap-1"><Clock className="size-3" /> Solicitado: {auth.requestDate}</span>
                        <span className="flex items-center gap-1"><Activity className="size-3" /> Expira: {auth.expiresIn}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-3">
                    {auth.status === 'Pendiente' && (
                      <Badge className="bg-amber-100/50 text-amber-700 border-amber-200">
                        <Clock className="size-3 mr-1" /> {auth.status}
                      </Badge>
                    )}
                    {auth.status === 'Aprobado' && (
                      <Badge className="bg-emerald-100/50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="size-3 mr-1" /> {auth.status}
                      </Badge>
                    )}
                    {auth.status === 'Rechazado' && (
                      <Badge className="bg-red-100/50 text-red-700 border-red-200">
                        <XCircle className="size-3 mr-1" /> {auth.status}
                      </Badge>
                    )}

                    {auth.status === 'Pendiente' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs hover:bg-slate-100"
                          onClick={() => handleCancel(auth.id)}
                          disabled={actionLoading === auth.id || actionLoading === 'remind-' + auth.id}
                        >
                          {actionLoading === auth.id ? '...' : 'Cancelar'}
                        </Button>
                        <Button 
                          size="sm" 
                          className="btn-premium py-1 h-8 text-xs"
                          onClick={() => handleRemind(auth)}
                          disabled={actionLoading === auth.id || actionLoading === 'remind-' + auth.id}
                        >
                          {actionLoading === 'remind-' + auth.id ? '...' : 'Recordar'}
                        </Button>
                      </div>
                    )}
                    {auth.status === 'Aprobado' && (
                      <Button 
                        size="sm" 
                        className="btn-outline-premium py-1 h-8 text-xs"
                        onClick={() => router.push(`/doctor/patients/${auth.patientId}`)}
                      >
                        Ver Historial
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DoctorLayout>
  )
}
