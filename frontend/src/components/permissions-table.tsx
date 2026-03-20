'use client'

import { useState } from 'react'
import { Shield, Building2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
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
}

const initialPermissions: Permission[] = [
  {
    id: '1',
    hospitalName: 'Hospital Obrero No. 1',
    accessDate: '10 Ene, 2026',
    expirationDate: '10 Jul, 2026',
    status: 'active',
    accessType: 'Historial Completo',
  },
  {
    id: '2',
    hospitalName: 'Clínica del Sur',
    accessDate: '25 Feb, 2026',
    expirationDate: '25 Ago, 2026',
    status: 'active',
    accessType: 'Solo Emergencias',
  },
  {
    id: '3',
    hospitalName: 'Hospital de Clínicas',
    accessDate: '05 Dic, 2025',
    expirationDate: '05 Mar, 2026',
    status: 'expired',
    accessType: 'Análisis de Laboratorio',
  },
  {
    id: '4',
    hospitalName: 'Centro Médico Cemes',
    accessDate: '15 Nov, 2025',
    expirationDate: '15 May, 2026',
    status: 'active',
    accessType: 'Imágenes Diagnósticas',
  },
]

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
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-success/10 text-success hover:bg-success/20 border-0">
            <CheckCircle2 className="mr-1 size-3" />
            Activo
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            <AlertCircle className="mr-1 size-3" />
            Expirado
          </Badge>
        )
      case 'revoked':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 size-3" />
            Revocado
          </Badge>
        )
    }
  }

  const activeCount = permissions.filter((p) => p.status === 'active').length

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>Gestión de Permisos</CardTitle>
                <CardDescription>
                  Controla qué instituciones tienen acceso a tus datos médicos
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              {activeCount} accesos activos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital / Institución</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha de Acceso</TableHead>
                <TableHead className="hidden md:table-cell">Tipo de Acceso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{permission.hospitalName}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {permission.accessDate}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div>
                      <p className="text-sm text-foreground">{permission.accessDate}</p>
                      <p className="text-xs text-muted-foreground">
                        Expira: {permission.expirationDate}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{permission.accessType}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(permission.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={permission.status !== 'active'}
                      onClick={() => handleRevokeClick(permission)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                    >
                      Revocar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar Acceso</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas revocar el acceso de{' '}
              <span className="font-semibold text-foreground">
                {selectedPermission?.hospitalName}
              </span>{' '}
              a tus datos médicos? Esta acción se registrará en la blockchain y no podrá deshacerse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, Revocar Acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
