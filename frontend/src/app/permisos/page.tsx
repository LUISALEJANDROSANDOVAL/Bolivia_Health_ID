import { DashboardLayout } from '@/components/dashboard-layout'
import { PermissionsTable } from '@/components/permissions-table'
import { Shield, Plus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function PermisosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Permisos</h1>
            <p className="text-sm text-muted-foreground">
              Controla quién tiene acceso a tus datos médicos
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="size-4" />
            Nuevo Permiso
          </Button>
        </div>

        <Alert>
          <Shield className="size-4" />
          <AlertTitle>Tus datos están protegidos</AlertTitle>
          <AlertDescription>
            Todos los cambios de permisos se registran en la blockchain, garantizando 
            transparencia y seguridad. Solo tú puedes otorgar o revocar acceso a tu información médica.
          </AlertDescription>
        </Alert>

        <PermissionsTable />

        <div className="rounded-xl border bg-muted/30 p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Info className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">¿Cómo funcionan los permisos?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cuando otorgas un permiso, la institución médica recibe una clave de acceso 
                temporal que les permite ver únicamente los datos que hayas autorizado. 
                Puedes revocar el acceso en cualquier momento, y la acción quedará 
                registrada de forma inmutable en la blockchain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
