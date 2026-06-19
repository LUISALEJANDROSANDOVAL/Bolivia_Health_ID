'use client'

import { useState, useEffect } from 'react'
import { Pill, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'

interface Medicamento {
  id: string
  nombre: string
  dosis: string
  frecuencia: string
  inicio: string
  fin: string | null
  estado: string
  indicacion: string
}

export function MedicamentosActuales() {
  const { walletAddress, isDbConnected } = useWallet()
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMedications() {
      if (!walletAddress || !isDbConnected) return
      
      try {
        setLoading(true)
        // 1. Get profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()

        if (profile) {
          // 2. Get medications
          const { data, error } = await supabase
            .from('medications')
            .select('*')
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false })

          if (error) throw error

          const mapped: Medicamento[] = (data || []).map((m: any) => ({
            id: m.id,
            nombre: m.name,
            dosis: m.dosage || 'N/A',
            frecuencia: m.frequency || 'N/A',
            inicio: m.start_date ? new Date(m.start_date.replace(/-/g, '/')).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            fin: m.end_date ? new Date(m.end_date.replace(/-/g, '/')).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
            estado: m.status === 'active' ? 'Activo' : m.status === 'completed' ? 'Finalizado' : 'Suspendido',
            indicacion: 'Tratamiento Médico'
          }))
          setMedicamentos(mapped)
        }
      } catch (err) {
        console.error('Error fetching medications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMedications()
  }, [walletAddress, isDbConnected])

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
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <RefreshCw className="size-8 text-cyan-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest">Sincronizando tratamientos...</p>
          </div>
        ) : medicamentos.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-2xl border-2 border-dashed border-border bg-foreground/[0.02]">
            <Pill className="size-10 text-foreground/10 mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground/40">No tienes medicamentos registrados actualmente.</p>
          </div>
        ) : (
          medicamentos.map((med) => (
            <Card
              key={med.id}
              className={med.estado !== 'Activo' ? 'opacity-60' : ''}
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
          ))
        )}
      </div>
    </section>
  )
}
