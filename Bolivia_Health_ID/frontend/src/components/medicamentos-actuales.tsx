'use client'

import { Pill } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Medicamento {
  id: number
  nombre: string
  dosis: string
  frecuencia: string
  inicio: string
  fin: string | null
  estado: 'Activo' | 'Finalizado'
  indicacion: string
}

const medicamentos: Medicamento[] = [
  {
    id: 1,
    nombre: 'Metformina',
    dosis: '500 mg',
    frecuencia: '2 veces al día',
    inicio: '01 Ene, 2026',
    fin: null,
    estado: 'Activo',
    indicacion: 'Diabetes tipo 2',
  },
  {
    id: 2,
    nombre: 'Losartán',
    dosis: '50 mg',
    frecuencia: '1 vez al día',
    inicio: '15 Feb, 2026',
    fin: null,
    estado: 'Activo',
    indicacion: 'Hipertensión',
  },
  {
    id: 3,
    nombre: 'Amoxicilina',
    dosis: '875 mg',
    frecuencia: 'Cada 8 horas',
    inicio: '01 Mar, 2026',
    fin: '10 Mar, 2026',
    estado: 'Finalizado',
    indicacion: 'Infección respiratoria',
  },
  {
    id: 4,
    nombre: 'Atorvastatina',
    dosis: '20 mg',
    frecuencia: '1 vez al día (noche)',
    inicio: '10 Ene, 2026',
    fin: null,
    estado: 'Activo',
    indicacion: 'Control de colesterol',
  },
]

export function MedicamentosActuales() {
  const activos = medicamentos.filter((m) => m.estado === 'Activo').length

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">Medicamentos Actuales</h2>
        <p className="text-sm text-muted-foreground">
          {activos} medicamentos activos registrados
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {medicamentos.map((med) => (
          <Card
            key={med.id}
            className={med.estado === 'Finalizado' ? 'opacity-60' : ''}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      med.estado === 'Activo'
                        ? 'bg-primary/10'
                        : 'bg-muted'
                    }`}
                  >
                    <Pill
                      className={`size-4 ${
                        med.estado === 'Activo'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground leading-tight">
                      {med.nombre}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{med.indicacion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`size-2 rounded-full ${
                      med.estado === 'Activo' ? 'bg-green-500' : 'bg-muted-foreground/40'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      med.estado === 'Activo' ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    {med.estado}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 border-t pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-muted-foreground">Dosis:</span>
                  <span className="text-xs font-medium text-foreground">{med.dosis}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-muted-foreground">Frecuencia:</span>
                  <span className="text-xs font-medium text-foreground">{med.frecuencia}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-muted-foreground">Desde:</span>
                  <span className="text-xs font-medium text-foreground">{med.inicio}</span>
                </div>
                {med.fin && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">Hasta:</span>
                    <span className="text-xs font-medium text-foreground">{med.fin}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
