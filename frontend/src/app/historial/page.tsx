import { DashboardLayout } from '@/components/dashboard-layout'
import { HistorialAntecedentes } from '@/components/historial-antecedentes'
import { ClipboardList, Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HistorialPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Historial Médico</h1>
              <p className="text-sm text-muted-foreground">
                Tus antecedentes personales y familiares
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              Filtrar
            </Button>
            <Button className="gap-2">
              <Plus className="size-4" />
              Agregar Antecedente
            </Button>
          </div>
        </div>

        {/* Statistics cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                <span className="text-lg font-bold text-red-600">4</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Condiciones Crónicas</p>
                <p className="text-xs text-muted-foreground">Personales activas</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-slate-100">
                <span className="text-lg font-bold text-slate-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Antecedentes Familiares</p>
                <p className="text-xs text-muted-foreground">Registrados</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                <span className="text-lg font-bold text-green-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Cirugías Previas</p>
                <p className="text-xs text-muted-foreground">Documentadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <HistorialAntecedentes />

        {/* Additional sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cirugías */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">Cirugías Previas</h3>
            <p className="text-sm text-muted-foreground">Procedimientos quirúrgicos realizados</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-foreground">Apendicectomía</p>
                  <p className="text-xs text-muted-foreground">Hospital Obrero - 2018</p>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  Sin complicaciones
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-foreground">Extracción de muelas del juicio</p>
                  <p className="text-xs text-muted-foreground">Clínica Dental Santa Cruz - 2020</p>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  Sin complicaciones
                </span>
              </div>
            </div>
          </div>

          {/* Vacunas */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">Vacunas Registradas</h3>
            <p className="text-sm text-muted-foreground">Historial de vacunación</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-foreground">COVID-19 (Pfizer)</p>
                  <p className="text-xs text-muted-foreground">3 dosis - Última: Marzo 2023</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Completa
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-foreground">Influenza</p>
                  <p className="text-xs text-muted-foreground">Anual - Última: Octubre 2024</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Al día
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-foreground">Hepatitis B</p>
                  <p className="text-xs text-muted-foreground">3 dosis - Completada 2015</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Completa
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
