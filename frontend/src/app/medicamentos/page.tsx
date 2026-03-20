import { DashboardLayout } from '@/components/dashboard-layout'
import { MedicamentosActuales } from '@/components/medicamentos-actuales'
import { Pill, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function MedicamentosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Pill className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Medicamentos</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona tu lista de medicamentos actuales y pasados
              </p>
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="size-4" />
            Agregar Medicamento
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar medicamento..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              Todos
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Activos
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Finalizados
            </Button>
          </div>
        </div>

        {/* Main content */}
        <MedicamentosActuales />

        {/* Info card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Pill className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Recordatorios de Medicamentos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Activa las notificaciones para recibir recordatorios de tus medicamentos. 
                Esta función estará disponible próximamente en la aplicación móvil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
