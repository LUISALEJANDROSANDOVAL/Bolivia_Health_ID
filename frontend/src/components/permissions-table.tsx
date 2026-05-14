'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock,
  ChevronRight,
  Eye,
  Lock,
  Stethoscope,
  BadgeCheck,
  User,
  GraduationCap
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'
import { useProfile } from '@/hooks/useProfile'
import { sendNotification } from '@/lib/notifications'

interface Permission {
  id: string
  doctorId: string
  hospitalName: string
  accessDate: string
  expirationDate: string
  status: 'active' | 'expired' | 'revoked'
  accessType: string
  description?: string
}

// Configuración de estados
const statusConfig = {
  active: { 
    icon: CheckCircle2, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-400/10', 
    label: 'Activo',
    borderColor: 'border-emerald-400/20',
    badgeBg: 'bg-emerald-400/10',
    badgeText: 'text-emerald-400'
  },
  expired: { 
    icon: AlertCircle, 
    color: 'text-rose-400', 
    bg: 'bg-rose-400/10', 
    label: 'Expirado',
    borderColor: 'border-rose-400/20',
    badgeBg: 'bg-rose-400/10',
    badgeText: 'text-rose-400'
  },
  revoked: { 
    icon: XCircle, 
    color: 'text-foreground/40', 
    bg: 'bg-foreground/5', 
    label: 'Revocado',
    borderColor: 'border-border',
    badgeBg: 'bg-foreground/5',
    badgeText: 'text-foreground/40'
  },
  pending: { 
    icon: Clock, 
    color: 'text-amber-400', 
    bg: 'bg-amber-400/10', 
    label: 'Pendiente',
    borderColor: 'border-amber-400/20',
    badgeBg: 'bg-amber-400/10',
    badgeText: 'text-amber-400'
  }
}

interface PermissionsTableProps {
  refreshTrigger?: number
}

export function PermissionsTable({ refreshTrigger }: PermissionsTableProps) {
  const { isDbConnected, walletAddress } = useWallet()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [viewDoctorOpen, setViewDoctorOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [doctorDetails, setDoctorDetails] = useState<any>(null)
  const [loadingDoctor, setLoadingDoctor] = useState(false)

  useEffect(() => {
    async function fetchPermissions() {
      if (!walletAddress) return
      setLoading(true)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()

        if (profile) {
          const { data } = await supabase
            .from('access_permissions')
            .select(`
              id,
              status,
              created_at,
              expires_at,
              doctor_id,
              profiles!doctor_id (full_name)
            `)
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false })
          
          const mapped: Permission[] = (data || []).map((p: any) => ({
            id: p.id,
            doctorId: p.doctor_id, // Keep doctor ID
            hospitalName: p.profiles?.full_name || 'Médico Autorizado',
            accessDate: new Date(p.created_at).toLocaleDateString(),
            expirationDate: p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'N/A',
            status: p.status as any,
            accessType: 'Acceso Universal',
            description: 'Acceso a historial, recetas y registros médicos'
          }))
          
          setPermissions(mapped)
        }
      } catch (err) {
        console.error('Error fetching permissions:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isDbConnected) {
      fetchPermissions()
    }
  }, [isDbConnected, walletAddress, refreshTrigger])

  const handleRevokeClick = (permission: Permission) => {
    setSelectedPermission(permission)
    setRevokeDialogOpen(true)
  }

  const handleViewDoctor = async (permission: Permission) => {
    setSelectedPermission(permission)
    setViewDoctorOpen(true)
    setLoadingDoctor(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', permission.doctorId)
        .single()
      
      if (!error) {
        setDoctorDetails(data)
      }
    } catch (err) {
      console.error('Error fetching doctor details:', err)
    } finally {
      setLoadingDoctor(false)
    }
  }

  const handleRevokeConfirm = async () => {
    if (selectedPermission) {
      try {
        const { error } = await supabase
          .from('access_permissions')
          .update({ status: 'revoked' })
          .eq('id', selectedPermission.id)

        if (!error) {
          setPermissions(prev => 
            prev.map(p => p.id === selectedPermission.id ? { ...p, status: 'revoked' } : p)
          )
        }
      } catch (err) {
        console.error('Error revoking permission:', err)
      }
    }
    setRevokeDialogOpen(false)
    setSelectedPermission(null)
  }

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('access_permissions')
        .update({ status: 'active' })
        .eq('id', id)
      if (!error) {
        setPermissions(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p))
        
        // Notificar al doctor (con try/catch para no bloquear)
        try {
          const perm = permissions.find(p => p.id === id)
          if (perm) {
            await sendNotification({
              recipientId: perm.doctorId,
              senderId: profile?.id,
              title: 'Solicitud Aprobada',
              message: `El paciente ${profile?.full_name || 'Anónimo'} ha aprobado su solicitud de acceso.`,
              type: 'approval',
              link: '/doctor/authorizations'
            })
          }
        } catch (notifyErr) {
          console.warn('No se pudo notificar al doctor:', notifyErr)
        }
      }
    } catch (err) {
      console.error('Error approving permission:', err)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('access_permissions')
        .update({ status: 'revoked' })
        .eq('id', id)
      if (!error) {
        setPermissions(prev => prev.map(p => p.id === id ? { ...p, status: 'revoked' } : p))
      }
    } catch (err) {
      console.error('Error rejecting permission:', err)
    }
  }

  const activeCount = permissions.filter((p) => p.status === 'active').length
  const expiredCount = permissions.filter((p) => p.status === 'expired').length

  return (
    <>
      <div className="space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
            <p className="text-2xl font-bold text-emerald-500">{loading ? '...' : activeCount}</p>
            <p className="text-xs text-emerald-500/60 flex items-center justify-center gap-1 font-bold uppercase tracking-widest">
              <CheckCircle2 className="size-3 text-emerald-500" />
              Accesos activos
            </p>
          </div>
          <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
            <p className="text-2xl font-bold text-rose-500">{loading ? '...' : expiredCount}</p>
            <p className="text-xs text-rose-500/60 flex items-center justify-center gap-1 font-bold uppercase tracking-widest">
              <Clock className="size-3 text-rose-500" />
              Permisos expirados
            </p>
          </div>
          <div className="bg-foreground/5 backdrop-blur-sm p-4 text-center rounded-2xl border border-border">
            <p className="text-2xl font-bold text-foreground">{loading ? '...' : permissions.length}</p>
            <p className="text-xs text-foreground/60 flex items-center justify-center gap-1">
              <Shield className="size-3 text-cyan-500" />
              Total gestionados
            </p>
          </div>
        </div>

        {/* Tabla de permisos */}
        <Card className="bg-foreground/5 border-border shadow-xl overflow-hidden backdrop-blur-md">
          <CardHeader className="border-b border-border bg-foreground/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-electric">
                  <Shield className="size-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Gestión de Accesos</CardTitle>
                  <CardDescription className="text-foreground/40">
                    Controla quién puede ver tus datos médicos en la red
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="hidden sm:flex border-emerald-400/30 text-emerald-400">
                {activeCount} activos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 text-center text-foreground/40 font-bold uppercase tracking-widest animate-pulse">Cargando permisos...</div>
              ) : permissions.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="size-20 rounded-2xl bg-foreground/5 border border-dashed border-border flex items-center justify-center mb-4 transition-all hover:scale-105 group">
                    <Shield className="size-10 text-foreground/10 group-hover:text-cyan-500/20 transition-all" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/40 animate-pulse">No hay permisos registrados.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-foreground/40">Institución / Médico</TableHead>
                      <TableHead className="hidden sm:table-cell text-foreground/40">Fecha</TableHead>
                      <TableHead className="text-foreground/40">Estado</TableHead>
                      <TableHead className="text-right text-foreground/40">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => {
                      const statusConf = statusConfig[permission.status] || statusConfig.revoked
                      const StatusIcon = statusConf.icon
                      
                      return (
                        <TableRow 
                          key={permission.id} 
                          className={`group hover:bg-foreground/5 transition-colors border-transparent border-l-4 ${statusConf.borderColor}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-xl bg-foreground/5">
                                <Building2 className="size-5 text-cyan-500" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{permission.hospitalName}</p>
                                <p className="text-xs text-foreground/40">{permission.accessType}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="text-sm text-foreground">{permission.accessDate}</div>
                            <div className="text-xs text-foreground/40">Exp: {permission.expirationDate}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConf.badgeBg} ${statusConf.badgeText} hover:${statusConf.badgeBg} border-0 px-2 py-1`}>
                              <StatusIcon className="mr-1 size-3" />
                              {statusConf.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {permission.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-emerald-500 text-white hover:bg-emerald-600 h-8 text-xs font-bold"
                                    onClick={() => handleApprove(permission.id)}
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-500 border-rose-500/30 hover:bg-rose-50 h-8 text-xs font-bold"
                                    onClick={() => handleReject(permission.id)}
                                  >
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                              {permission.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10"
                                  onClick={() => handleRevokeClick(permission)}
                                >
                                  <Lock className="size-4 mr-1" />
                                  Revocar
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-foreground/40 hover:text-foreground"
                                onClick={() => handleViewDoctor(permission)}
                              >
                                <Eye className="size-4" />
                              </Button>
                              <ChevronRight className="size-4 text-foreground/20 group-hover:text-cyan-500 transition-colors" />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmación */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent className="bg-background border-foreground/10 rounded-2xl text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar Acceso</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/60">
              ¿Estás seguro de que deseas revocar el acceso de{' '}
              <span className="font-semibold text-cyan-500">
                {selectedPermission?.hospitalName}
              </span>? 
              Ya no podrá ver tus datos médicos hasta que vuelvas a otorgar permiso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Revocar Acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Modal de Detalles del Médico */}
      <AlertDialog open={viewDoctorOpen} onOpenChange={setViewDoctorOpen}>
        <AlertDialogContent className="bg-background border-border max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="h-24 bg-gradient-electric w-full relative">
            <div className="absolute -bottom-10 left-6">
              <div className="size-20 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-xl">
                <Stethoscope className="size-10 text-cyan-500" />
              </div>
            </div>
          </div>
          
          <div className="p-6 pt-12 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  {loadingDoctor ? 'Cargando...' : doctorDetails?.full_name}
                </h2>
                <BadgeCheck className="size-5 text-cyan-500" />
              </div>
              <p className="text-sm text-cyan-500 font-bold uppercase tracking-widest mt-1">
                {doctorDetails?.specialty || 'Médico Especialista'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-foreground/5 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="size-3 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-foreground/40">Estado</span>
                </div>
                <p className="text-xs font-bold text-foreground">Verificado</p>
              </div>
              <div className="p-3 rounded-xl bg-foreground/5 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="size-3 text-cyan-500" />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-foreground/40">Matrícula</span>
                </div>
                <p className="text-xs font-bold text-foreground">{doctorDetails?.license_number || 'En trámite'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground/40">Enfoque y Especialidad</h4>
              <div className="p-4 rounded-xl bg-foreground/5 border border-border space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-4 text-cyan-500 mt-0.5" />
                  <p className="text-sm text-foreground/70 font-medium">
                    Especialista en {doctorDetails?.specialty || 'Atención Médica Integral'}.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-4 text-cyan-500 mt-0.5" />
                  <p className="text-sm text-foreground/70 font-medium">
                    Autorizado para gestión de registros médicos digitales.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-foreground text-background font-black rounded-xl h-12"
              onClick={() => setViewDoctorOpen(false)}
            >
              Cerrar Perfil
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}