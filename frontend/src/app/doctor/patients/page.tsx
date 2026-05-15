'use client'

import { useState, useEffect, useCallback } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Eye, Filter, User, Calendar, Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'

interface Patient {
  id: string
  name: string
  ci: string
  healthId: string
  status: string
  lastVisit: string
}

export default function DoctorPatientsPage() {
  const { doctorId } = useDoctorAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPatients = useCallback(async () => {
    if (!doctorId) return
    setLoading(true)
    try {
      // Consultar permisos activos para este doctor
      const { data, error } = await supabase
        .from('access_permissions')
        .select(`
          id,
          status,
          created_at,
          profiles!patient_id (
            id,
            full_name,
            cedula_identidad,
            wallet_address
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'active')

      if (error) throw error

      const mapped: Patient[] = (data || []).map((p: any) => ({
        id: p.profiles?.id || '',
        name: p.profiles?.full_name || 'Paciente Desconocido',
        ci: p.profiles?.cedula_identidad || 'N/A',
        healthId: p.profiles?.wallet_address || 'N/A',
        status: 'Activo',
        lastVisit: new Date(p.created_at).toLocaleDateString() // Usamos la fecha de permiso como referencia
      }))

      setPatients(mapped)
    } catch (err) {
      console.error('Error fetching patients:', err)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.ci.includes(searchTerm) ||
      patient.healthId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DoctorLayout>
      <div className="space-y-8 animate-slide-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Mis Pacientes</h1>
            <p className="text-sm text-foreground/50 font-bold uppercase tracking-widest mt-1">Directorio con acceso autorizado</p>
          </div>
          <div className="flex gap-2">
             <Button 
               variant="ghost" 
               className="bg-foreground/5 rounded-2xl font-bold h-12 px-6 hover:bg-foreground/10"
               onClick={() => fetchPatients()}
             >
               <Filter className="size-4 mr-2" />
               Filtrar
             </Button>
          </div>
        </div>

        {/* Search Bar Premium */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
          <Input
            placeholder="Buscar por nombre, CI o Health ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 rounded-3xl bg-foreground/[0.03] backdrop-blur-xl border-border/50 focus:border-cyan-500/50 text-base"
          />
        </div>

        {/* Patients Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="size-12 text-cyan-500 animate-spin mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-foreground/40">Cargando directorio...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="relative overflow-hidden bg-foreground/[0.03] backdrop-blur-xl p-8 rounded-[2rem] border border-border group hover:border-cyan-500/20 transition-all shadow-lg shadow-black/5">
              {/* Badge superior */}
              <div className="absolute top-0 right-0 p-4">
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-foreground/5 rounded-full border border-border/50">
                    <div className={`size-1.5 rounded-full ${patient.status === 'Activo' ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">{patient.status}</span>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="size-14 rounded-2xl bg-foreground/5 flex items-center justify-center border border-border/50 group-hover:bg-cyan-500/10 transition-colors">
                      <User className="size-7 text-foreground/40 group-hover:text-cyan-500" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-foreground group-hover:text-cyan-400 transition-colors">{patient.name}</h3>
                      <p className="text-xs font-bold text-foreground/40 tracking-wider">CI: {patient.ci}</p>
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/30">

                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-foreground/30" />
                    <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Última visita:</span>
                    <span className="text-xs font-black text-foreground/80">{patient.lastVisit}</span>
                  </div>
                </div>

                <Link href={`/doctor/patients/${patient.id}`} className="block">
                  <Button className="w-full bg-foreground/10 hover:bg-cyan-500 text-foreground hover:text-azul-profundo font-black rounded-2xl h-14 border-none transition-all group-hover:scale-[1.02]">
                    <Eye className="mr-2 size-5" />
                    Ver Historia 360
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}

        {!loading && filteredPatients.length === 0 && (
          <div className="bg-foreground/[0.03] backdrop-blur-xl p-20 rounded-[3rem] border border-border/50 text-center">
             <div className="flex justify-center mb-4">
                <div className="size-16 rounded-full bg-foreground/5 flex items-center justify-center">
                   <Search className="size-8 text-foreground/20" />
                </div>
             </div>
             <h3 className="text-xl font-black text-foreground">Sin resultados</h3>
             <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest mt-2">No se encontraron pacientes que coincidan con la búsqueda</p>
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}

