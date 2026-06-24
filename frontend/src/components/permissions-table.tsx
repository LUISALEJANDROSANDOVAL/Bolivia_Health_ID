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
import { Skeleton } from '@/components/ui/skeleton'

import { useToast } from '@/hooks/use-toast'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'
import { useProfile } from '@/hooks/useProfile'
import { sendNotification } from '@/lib/notifications'

interface Permission {
  id: string
  doctorId: string | null
  requestedBy: string | null
  hospitalName: string
  accessDate: string
  expirationDate: string
  status: 'active' | 'expired' | 'revoked' | 'pending'
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
  const { isDbConnected, walletAddress, signMessage } = useWallet()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [viewDoctorOpen, setViewDoctorOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [doctorDetails, setDoctorDetails] = useState<any>(null)
  const [loadingDoctor, setLoadingDoctor] = useState(false)

  // Approve dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [permissionToApprove, setPermissionToApprove] = useState<Permission | null>(null)
  const [approvalDuration, setApprovalDuration] = useState<'1h' | '24h' | 'permanent'>('permanent')
  const [isApproving, setIsApproving] = useState(false)

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
              specialty,
              sucursal_id,
              requested_by,
              profiles!doctor_id (full_name),
              sucursales (name)
            `)
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false })
          
          const mapped: Permission[] = (data || []).map((p: any) => {
            const isSpecialty = !p.doctor_id && p.specialty
            return {
              id: p.id,
              doctorId: p.doctor_id,
              requestedBy: p.requested_by,
              hospitalName: isSpecialty
                ? `Especialidad: ${p.specialty}`
                : (p.profiles?.full_name || 'Médico Autorizado'),
              accessDate: new Date(p.created_at).toLocaleDateString(),
              expirationDate: p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Permanente',
              status: p.status as any,
              accessType: isSpecialty
                ? `Acceso Departamental (${p.sucursales?.name || 'Sede'})`
                : 'Acceso Personal',
              description: isSpecialty
                ? `Acceso concedido a todos los médicos de la especialidad ${p.specialty} en la sede ${p.sucursales?.name || ''}`
                : 'Acceso a historial, recetas y registros médicos por un médico específico'
            }
          })
          
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
    const targetId = permission.doctorId || permission.requestedBy
    if (!targetId) return

    setSelectedPermission(permission)
    setViewDoctorOpen(true)
    setLoadingDoctor(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single()
      
      if (!error) {
        setDoctorDetails(data)
      }
    } catch (err) {
      console.error('Error fetching doctor details:', err)
    } finally {
      setViewDoctorOpen(true)
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
          toast({ title: 'Acceso Revocado', description: `Se ha revocado el acceso para ${selectedPermission.hospitalName}.` })
        }
      } catch (err: any) {
        console.error('Error revoking permission:', err)
        toast({ title: 'Error', description: err.message || 'No se pudo revocar el acceso.', variant: 'destructive' })
      }
    }
    setRevokeDialogOpen(false)
    setSelectedPermission(null)
  }

  const handleApproveConfirm = async () => {
    if (!permissionToApprove) return
    setIsApproving(true)
    try {
      if (!walletAddress) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      let expiresAt: string | null = null
      const now = new Date()
      if (approvalDuration === '1h') {
        now.setHours(now.getHours() + 1)
        expiresAt = now.toISOString()
      } else if (approvalDuration === '24h') {
        now.setHours(now.getHours() + 24)
        expiresAt = now.toISOString()
      }

      const { error } = await supabase
        .from('access_permissions')
        .update({ 
          status: 'active',
          expires_at: expiresAt
        })
        .eq('id', permissionToApprove.id)

      if (!error) {
        setPermissions(prev => prev.map(p => p.id === permissionToApprove.id ? { 
          ...p, 
          status: 'active',
          expirationDate: expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Permanente'
        } : p))

        toast({ 
          title: 'Acceso Autorizado', 
          description: `Se ha aprobado el acceso para ${permissionToApprove.hospitalName}.` 
        })
        
        // Notificar al médico que originó la solicitud
        const recipientId = permissionToApprove.doctorId || permissionToApprove.requestedBy
        if (recipientId) {
          try {
            await sendNotification({
              recipientId,
              senderId: profile?.id,
              title: 'Solicitud Aprobada',
              message: `El paciente ${profile?.full_name || 'Anónimo'} ha aprobado la solicitud de acceso para ${permissionToApprove.hospitalName}.`,
              type: 'approval',
              link: '/doctor/authorizations'
            })
          } catch (notifyErr) {
            console.warn('No se pudo notificar al doctor:', notifyErr)
          }
        }
      }
    } catch (err: any) {
      console.error('Error approving permission:', err)
      toast({ title: 'Error', description: err.message || 'No se pudo aprobar el acceso o firma cancelada.', variant: 'destructive' })
    } finally {
      setIsApproving(false)
      setApproveDialogOpen(false)
      setPermissionToApprove(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const perm = permissions.find(p => p.id === id)
      if (!perm) return

      const { error } = await supabase
        .from('access_permissions')
        .update({ status: 'revoked' })
        .eq('id', id)
      if (!error) {
        setPermissions(prev => prev.map(p => p.id === id ? { ...p, status: 'revoked' } : p))
        toast({ title: 'Solicitud Rechazada', description: `Se ha rechazado la solicitud de ${perm.hospitalName}.` })
      }
    } catch (err: any) {
      console.error('Error rejecting permission:', err)
      toast({ title: 'Error', description: err.message || 'No se pudo rechazar la solicitud o firma cancelada.', variant: 'destructive' })
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
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="hidden sm:block space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
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
                            {permission.status !== 'pending' && (
                              <div className="flex items-center gap-1 text-[10px] text-cyan-500 font-black uppercase mt-1">
                                <Lock className="size-3 text-cyan-500" />
                                <span>Firmado Cripto</span>
                              </div>
                            )}
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
                                    onClick={() => {
                                      setPermissionToApprove(permission)
                                      setApprovalDuration('permanent')
                                      setApproveDialogOpen(true)
                                    }}
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

      {/* Dialog de Aprobación de Acceso con Opciones de Tiempo */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="bg-background border-border max-w-md rounded-2xl p-0 overflow-hidden text-foreground">
          <div className="p-6 space-y-6">
            <div>
              <DialogHeader>
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-3">
                  <Shield className="size-6 text-emerald-500" />
                </div>
                <DialogTitle className="text-xl font-black text-foreground">Aprobar Acceso Médico</DialogTitle>
                <DialogDescription className="text-foreground/50 mt-1">
                  Estás a punto de autorizar al médico <span className="font-semibold text-cyan-500">{permissionToApprove?.hospitalName}</span> para acceder a tu historial clínico.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40 block">
                Duración del Acceso
              </label>
              
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setApprovalDuration('1h')}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    approvalDuration === '1h'
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-border bg-foreground/5 hover:bg-foreground/10'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm text-foreground">Acceso Temporal (1 Hora)</p>
                    <p className="text-xs text-foreground/50 mt-0.5">Ideal para una consulta médica inmediata.</p>
                  </div>
                  <div className={`size-4 rounded-full border flex items-center justify-center ${
                    approvalDuration === '1h' ? 'border-emerald-500' : 'border-muted-foreground'
                  }`}>
                    {approvalDuration === '1h' && <div className="size-2 rounded-full bg-emerald-500" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalDuration('24h')}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    approvalDuration === '24h'
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-border bg-foreground/5 hover:bg-foreground/10'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm text-foreground">Acceso Diario (24 Horas)</p>
                    <p className="text-xs text-foreground/50 mt-0.5">Válido por el día de hoy para revisiones continuas.</p>
                  </div>
                  <div className={`size-4 rounded-full border flex items-center justify-center ${
                    approvalDuration === '24h' ? 'border-emerald-500' : 'border-muted-foreground'
                  }`}>
                    {approvalDuration === '24h' && <div className="size-2 rounded-full bg-emerald-500" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setApprovalDuration('permanent')}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    approvalDuration === 'permanent'
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-border bg-foreground/5 hover:bg-foreground/10'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm text-foreground">Acceso Permanente</p>
                    <p className="text-xs text-foreground/50 mt-0.5">El acceso estará activo hasta que decidas revocarlo manualmente.</p>
                  </div>
                  <div className={`size-4 rounded-full border flex items-center justify-center ${
                    approvalDuration === 'permanent' ? 'border-emerald-500' : 'border-muted-foreground'
                  }`}>
                    {approvalDuration === 'permanent' && <div className="size-2 rounded-full bg-emerald-500" />}
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setApproveDialogOpen(false)}
                disabled={isApproving}
                className="flex-1 bg-transparent border-border text-foreground hover:bg-foreground/5 font-black rounded-xl h-12"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApproveConfirm}
                disabled={isApproving}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl h-12"
              >
                {isApproving ? 'Aprobando...' : 'Confirmar Acceso'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                <AlertDialogTitle className="text-2xl font-black text-foreground tracking-tight">
                  {loadingDoctor ? 'Cargando...' : doctorDetails?.full_name}
                </AlertDialogTitle>
                <BadgeCheck className="size-5 text-cyan-500" />
              </div>
              <AlertDialogDescription className="text-sm text-cyan-500 font-bold uppercase tracking-widest mt-1">
                {doctorDetails?.specialty || 'Médico Especialista'}
              </AlertDialogDescription>
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