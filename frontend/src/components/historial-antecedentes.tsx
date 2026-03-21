'use client'

import { ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Antecedente {
  id: number
  nombre: string
  tipo: 'Cronico' | 'Familiar'
  anio?: string
  familiar?: string
}

const antecedentes: Antecedente[] = [
  { id: 1, nombre: 'Diabetes tipo 2', tipo: 'Cronico', anio: '2022' },
  { id: 2, nombre: 'Hipertensión arterial', tipo: 'Cronico', anio: '2023' },
  { id: 3, nombre: 'Hipotiroidismo', tipo: 'Cronico', anio: '2020' },
  { id: 4, nombre: 'Diabetes tipo 2', tipo: 'Familiar', familiar: 'Padre' },
  { id: 5, nombre: 'Infarto al miocardio', tipo: 'Familiar', familiar: 'Abuelo paterno' },
  { id: 6, nombre: 'Cáncer de colon', tipo: 'Familiar', familiar: 'Tío materno' },
  { id: 7, nombre: 'Hipertensión', tipo: 'Familiar', familiar: 'Madre' },
]

const cronicos = antecedentes.filter((a) => a.tipo === 'Cronico')
const familiares = antecedentes.filter((a) => a.tipo === 'Familiar')

export function HistorialAntecedentes() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">Historial y Antecedentes</h2>
        <p className="text-sm text-muted-foreground">
          Condiciones crónicas y antecedentes familiares
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Resumen de Antecedentes
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {cronicos.length} crónicos · {familiares.length} familiares
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Crónicos / Personales */}
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Crónicos / Personales
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cronicos.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 ring-1 ring-inset ring-red-200"
                >
                  {a.nombre}
                  {a.anio && (
                    <span className="text-red-400">· {a.anio}</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Familiares */}
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="size-2 rounded-full bg-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Antecedentes Familiares
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {familiares.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                >
                  {a.nombre}
                  {a.familiar && (
                    <span className="text-slate-400">· {a.familiar}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
