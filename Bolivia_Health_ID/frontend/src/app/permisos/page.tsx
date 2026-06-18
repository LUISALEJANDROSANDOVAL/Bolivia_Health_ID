'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { PermissionsTable } from '@/components/permissions-table'
import { Shield, Plus, Info } from 'lucide-react'
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
                <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">Gestión de Permisos</h1>
                <p className="text-sm text-foreground/60 font-medium">
                  Controla quién tiene acceso a tus datos médicos
                </p>
              </div>
            </div>
            <Button className="bg-foreground text-background hover:scale-105 px-8 py-6 text-lg font-black rounded-2xl shadow-2xl transition-all border-none">
              <Plus className="size-5 mr-3" />
              Nuevo Permiso
            </Button>
          </div>
        </div>

        <PermissionsTable />

        {/* Info adicional */}
        <div className="rounded-2xl border border-border bg-foreground/5 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/10">
              <Info className="size-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-black text-foreground tracking-tight uppercase text-sm">¿Cómo funcionan los permisos?</h3>
              <p className="mt-1 text-sm text-foreground/50 font-medium leading-relaxed">
Line 44 update.
                Cuando otorgas un permiso, la institución médica recibe una clave de acceso 
                temporal que les permite ver únicamente los datos que hayas autorizado. 
                Puedes revocar el acceso en cualquier momento, y la acción quedará 
                registrada de forma inmutable en la red.
              </p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}