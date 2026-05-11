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

export default function DoctorAuthorizationsPage() {
  const { doctorId } = useDoctorAuth()
  const [authorizations, setAuthorizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  })

  const fetchAuthorizations = useCallback(async () => {
    if (!doctorId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // Consultamos los permisos de acceso para este doctor
      // Incluimos los datos del perfil del paciente mediante el join automático de Supabase
      const { data, error } = await supabase
        .from('access_permissions')
        .select(`
          *,
          patient:profiles!patient_id(full_name, wallet_address)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setAuthorizations(data)
        
        // Calcular estadísticas básicas
        const s = data.reduce((acc: any, curr: any) => {
          acc.total++
          if (curr.status === 'approved' || curr.status === 'Aprobado') acc.approved++
          else if (curr.status === 'pending' || curr.status === 'Pendiente') acc.pending++
          else if (curr.status === 'rejected' || curr.status === 'Rechazado') acc.rejected++
          return acc
        }, { total: 0, approved: 0, pending: 0, rejected: 0 })
        
        setStats(s)
      }
    } catch (err) {
      console.error('Error al cargar autorizaciones:', err)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => {
    fetchAuthorizations()
  }, [fetchAuthorizations])

  const authStats = [
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
      description: 'En espera de respuesta',
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
              <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Autorizaciones Web3</h1>
              <p className="text-sm text-gris-grafito">
                Centro de solicitudes de acceso registradas en la base de datos de salud
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {authStats.map((stat, idx) => (
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
                  Pide acceso a nuevos pacientes. Cada aprobación queda registrada de forma permanente para máxima transparencia.
                </p>
              </div>
            </div>
            <Button className="bg-white text-azul-electrico hover:bg-white/90 shadow-lg">
              <Send className="size-4 mr-2" />
              Nueva Solicitud
            </Button>
          </div>
        </div>

        {/* Authorizations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-azul-profundo">Solicitudes de Acceso</h3>
            <Button variant="ghost" size="sm" onClick={fetchAuthorizations} className="text-xs text-azul-electrico">
              {loading ? <Loader2 className="size-3 animate-spin mr-2" /> : <Activity className="size-3 mr-2" />}
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
                  Debes conectar tu cuenta de Google para gestionar tus autorizaciones de acceso Web3.
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
                  Aún no has solicitado acceso a ningún historial o no tienes permisos asignados.
                </p>
              </CardContent>
            </Card>
          ) : (
            authorizations.map((auth, i) => (
              <Card key={auth.id || i} className="card-premium hover:border-azul-electrico/30 transition-all group">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-slate-100 p-3 group-hover:bg-azul-hielo transition-colors">
                        <FileText className="size-5 text-slate-600 group-hover:text-azul-electrico" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-azul-profundo">{auth.patient?.full_name || 'Paciente Desconocido'}</h3>
                        <p className="text-xs font-mono text-gris-grafito/60 mb-2">{auth.patient?.wallet_address}</p>
                        <div className="flex items-center gap-4 text-xs text-gris-grafito/80">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> 
                            Solicitado: {auth.created_at ? format(new Date(auth.created_at), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                          </span>
                          {auth.expires_at && (
                            <span className="flex items-center gap-1">
                              <Activity className="size-3" /> 
                              Expira: {format(new Date(auth.expires_at), 'dd MMM yyyy', { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end gap-3">
                      {(auth.status?.toLowerCase() === 'pending' || auth.status === 'Pendiente') && (
                        <Badge className="bg-amber-100/50 text-amber-700 border-amber-200">
                          <Clock className="size-3 mr-1" /> Pendiente
                        </Badge>
                      )}
                      {(auth.status?.toLowerCase() === 'approved' || auth.status === 'Aprobado') && (
                        <Badge className="bg-emerald-100/50 text-emerald-700 border-emerald-200">
                          <CheckCircle className="size-3 mr-1" /> Aprobado
                        </Badge>
                      )}
                      {(auth.status?.toLowerCase() === 'rejected' || auth.status === 'Rechazado') && (
                        <Badge className="bg-red-100/50 text-red-700 border-red-200">
                          <XCircle className="size-3 mr-1" /> Rechazado
                        </Badge>
                      )}
                      
                      {(auth.status?.toLowerCase() === 'pending' || auth.status === 'Pendiente') && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs hover:bg-slate-100 border-slate-200">Cancelar</Button>
                          <Button size="sm" className="btn-premium py-1 h-8 text-xs">Recordar</Button>
                        </div>
                      )}
                      {(auth.status?.toLowerCase() === 'approved' || auth.status === 'Aprobado') && (
                        <Button size="sm" className="btn-outline-premium py-1 h-8 text-xs">Ver Historial</Button>
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
