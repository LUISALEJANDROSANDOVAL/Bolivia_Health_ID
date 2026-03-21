// components/permissions-table.tsx
'use client'

import { useState } from 'react'
import { 
  Shield, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar,
  Clock,
  ChevronRight,
  Eye,
  ExternalLink,
  Lock
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

interface Permission {
  id: string
  hospitalName: string
  accessDate: string
  expirationDate: string
  status: 'active' | 'expired' | 'revoked'
  accessType: string
  description?: string
}

const initialPermissions: Permission[] = [
  {
    id: '1',
    hospitalName: 'Hospital Obrero No. 1',
    accessDate: '10 Ene, 2026',
    expirationDate: '10 Jul, 2026',
    status: 'active',
    accessType: 'Historial Completo',
    description: 'Acceso completo a historial clínico, laboratorios y recetas'
  },
  {
    id: '2',
    hospitalName: 'Clínica del Sur',
    accessDate: '25 Feb, 2026',
    expirationDate: '25 Ago, 2026',
    status: 'active',
    accessType: 'Solo Emergencias',
    description: 'Acceso limitado a información crítica para emergencias'
  },
  {
    id: '3',
    hospitalName: 'Hospital de Clínicas',
    accessDate: '05 Dic, 2025',
    expirationDate: '05 Mar, 2026',
    status: 'expired',
    accessType: 'Análisis de Laboratorio',
    description: 'Resultados de análisis de sangre y orina'
  },
  {
    id: '4',
    hospitalName: 'Centro Médico Cemes',
    accessDate: '15 Nov, 2025',
    expirationDate: '15 May, 2026',
    status: 'active',
    accessType: 'Imágenes Diagnósticas',
    description: 'Radiografías, ecografías y resonancias'
  },
]

// Configuración de estados con colores de tu tema
const statusConfig = {
  active: { 
    icon: CheckCircle2, 
    color: 'text-turquesa', 
    bg: 'bg-turquesa/10', 
    label: 'Activo',
    borderColor: 'border-turquesa/20',
    badgeBg: 'bg-turquesa/10',
    badgeText: 'text-turquesa'
  },
  expired: { 
    icon: AlertCircle, 
    color: 'text-coral', 
    bg: 'bg-coral/10', 
    label: 'Expirado',
    borderColor: 'border-coral/20',
    badgeBg: 'bg-coral/10',
    badgeText: 'text-coral'
  },
  revoked: { 
    icon: XCircle, 
    color: 'text-gris-grafito', 
    bg: 'bg-gris-perla', 
    label: 'Revocado',
    borderColor: 'border-gris-perla',
    badgeBg: 'bg-gris-perla',
    badgeText: 'text-gris-grafito'
  }
}

export function PermissionsTable() {
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)

  const handleRevokeClick = (permission: Permission) => {
    setSelectedPermission(permission)
    setRevokeDialogOpen(true)
  }

  const handleRevokeConfirm = () => {
    if (selectedPermission) {
      setPermissions((prev) =>
        prev.map((p) =>
          p.id === selectedPermission.id ? { ...p, status: 'revoked' as const } : p
        )
      )
    }
    setRevokeDialogOpen(false)
    setSelectedPermission(null)
  }

  const getStatusBadge = (status: Permission['status']) => {
    const config = statusConfig[status]
    const StatusIcon = config.icon
    
    return (
      <Badge className={`${config.badgeBg} ${config.badgeText} hover:${config.badgeBg} border-0 px-2 py-1`}>
        <StatusIcon className="mr-1 size-3" />
        {config.label}
      </Badge>
    )
  }

  const activeCount = permissions.filter((p) => p.status === 'active').length
  const expiredCount = permissions.filter((p) => p.status === 'expired').length

  return (
    <>
      <div className="space-y-4">
        {/* Stats cards para permisos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-premium p-4 text-center hover:border-turquesa/30 transition-all">
            <p className="text-2xl font-bold text-azul-electrico">{activeCount}</p>
            <p className="text-xs text-gris-grafito flex items-center justify-center gap-1">
              <CheckCircle2 className="size-3 text-turquesa" />
              Accesos activos
            </p>
          </div>
          <div className="card-premium p-4 text-center hover:border-coral/30 transition-all">
            <p className="text-2xl font-bold text-coral">{expiredCount}</p>
            <p className="text-xs text-gris-grafito flex items-center justify-center gap-1">
              <Clock className="size-3 text-coral" />
              Permisos expirados
            </p>
          </div>
          <div className="card-premium p-4 text-center hover:border-azul-electrico/30 transition-all">
            <p className="text-2xl font-bold text-turquesa">{permissions.length}</p>
            <p className="text-xs text-gris-grafito flex items-center justify-center gap-1">
              <Shield className="size-3 text-azul-electrico" />
              Total gestionados
            </p>
          </div>
        </div>

        {/* Tabla de permisos con diseño mejorado */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-electric">
                  <Shield className="size-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-azul-profundo">Gestión de Permisos</CardTitle>
                  <CardDescription className="text-gris-grafito">
                    Controla qué instituciones tienen acceso a tus datos médicos
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="hidden sm:flex border-azul-electrico/30 text-azul-electrico">
                {activeCount} accesos activos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="py-4">Institución</TableHead>
                    <TableHead className="hidden sm:table-cell">Fecha de Acceso</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo de Acceso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => {
                    const statusConf = statusConfig[permission.status]
                    const StatusIcon = statusConf.icon
                    
                    return (
                      <TableRow 
                        key={permission.id} 
                        className={`group hover:bg-muted/20 transition-colors border-l-4 ${statusConf.borderColor}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-azul-hielo to-azul-hielo/50">
                              <Building2 className="size-5 text-azul-electrico" />
                            </div>
                            <div>
                              <p className="font-semibold text-azul-profundo">{permission.hospitalName}</p>
                              <p className="text-xs text-gris-grafito sm:hidden">
                                {permission.accessDate}
                              </p>
                              {permission.description && (
                                <p className="text-xs text-gris-grafito/70 hidden sm:block">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-sm text-foreground">
                              <Calendar className="size-3 text-azul-electrico" />
                              <span>{permission.accessDate}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Clock className="size-3 text-coral/70" />
                              <span>Expira: {permission.expirationDate}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {permission.accessType}
                            </span>
                            {permission.status === 'active' && (
                              <span className="text-xs text-turquesa mt-0.5">
                                Acceso concedido
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConf.badgeBg} ${statusConf.badgeText} hover:${statusConf.badgeBg} border-0 px-2 py-1`}>
                            <StatusIcon className="mr-1 size-3" />
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {permission.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-coral hover:text-coral hover:bg-coral/10"
                                onClick={() => handleRevokeClick(permission)}
                              >
                                <Lock className="size-4 mr-1" />
                                Revocar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gris-grafito hover:text-azul-electrico"
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gris-grafito hover:text-azul-electrico"
                            >
                              <ExternalLink className="size-4" />
                            </Button>
                            <ChevronRight className="size-4 text-gris-grafito/40 group-hover:text-azul-electrico transition-colors hidden sm:block" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Mensaje cuando no hay permisos */}
        {permissions.length === 0 && (
          <div className="card-premium p-12 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="size-16 text-gris-grafito/30" />
            </div>
            <h3 className="text-lg font-semibold text-azul-profundo">No hay permisos activos</h3>
            <p className="text-sm text-gris-grafito mt-1">
              Otorga acceso a instituciones médicas para compartir tus datos de forma segura.
            </p>
            <Button className="mt-6 btn-premium">
              <Plus className="size-4 mr-2" />
              Nuevo Permiso
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de confirmación para revocar */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-azul-profundo">Revocar Acceso</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas revocar el acceso de{' '}
              <span className="font-semibold text-azul-electrico">
                {selectedPermission?.hospitalName}
              </span>{' '}
              a tus datos médicos? Esta acción se registrará en la blockchain y no podrá deshacerse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-coral text-white hover:bg-coral/90 rounded-xl"
            >
              Sí, Revocar Acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}