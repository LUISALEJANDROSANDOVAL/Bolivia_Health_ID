// app/permisos/page.tsx
import { DashboardLayout } from '@/components/dashboard-layout'
import { PermissionsTable } from '@/components/permissions-table'
import { Shield, Plus, Info, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PermisosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-in">
        
        {/* Header con estadísticas */}
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
                <Shield className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Gestión de Permisos</h1>
                <p className="text-sm text-gris-grafito">
                  Controla quién tiene acceso a tus datos médicos
                </p>
              </div>
            </div>
            <Button className="btn-premium gap-2">
              <Plus className="size-4" />
              Nuevo Permiso
            </Button>
          </div>
        </div>

        {/* Alert con estilo mejorado */}
        <div className="rounded-2xl border border-azul-electrico/20 bg-gradient-to-r from-azul-hielo to-transparent p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-azul-electrico/10">
              <Shield className="size-5 text-azul-electrico" />
            </div>
            <div>
              <h3 className="font-semibold text-azul-profundo">Tus datos están protegidos</h3>
              <p className="mt-1 text-sm text-gris-grafito">
                Todos los cambios de permisos se registran en la blockchain, garantizando 
                transparencia y seguridad. Solo tú puedes otorgar o revocar acceso a tu información médica.
              </p>
            </div>
          </div>
        </div>

        <PermissionsTable />

        {/* Info adicional con estilo consistente */}
        <div className="rounded-2xl border border-border bg-gradient-to-r from-muted/30 to-transparent p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Info className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">¿Cómo funcionan los permisos?</h3>
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