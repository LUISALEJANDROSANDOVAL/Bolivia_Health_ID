'use client'

import { useState } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, Filter, User, Calendar, Shield, Plus, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

const mockPatients = [
  {
    id: '1',
    name: 'Carlos Mendoza',
    ci: '4567890',
    healthId: '0xA1B2...C3D4',
    status: 'Activo',
    lastVisit: '2024-03-20',
  },
  {
    id: '2',
    name: 'María García',
    ci: '5678901',
    healthId: '0xE5F6...G7H8',
    status: 'Activo',
    lastVisit: '2024-03-19',
  },
  {
    id: '3',
    name: 'Juan Pérez',
    ci: '6789012',
    healthId: '0xI9J0...K1L2',
    status: 'Inactivo',
    lastVisit: '2024-02-15',
  },
  {
    id: '4',
    name: 'Ana López',
    ci: '7890123',
    healthId: '0xM3N4...O5P6',
    status: 'Activo',
    lastVisit: '2024-03-21',
  },
]

export default function DoctorPatientsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos')
  const [isNewConsultOpen, setIsNewConsultOpen] = useState(false)
  const [newConsultCI, setNewConsultCI] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleNewConsultSearch = async () => {
    if (!newConsultCI) {
      toast.error('Por favor ingrese un CI o Health ID')
      return
    }

    setIsSearching(true)
    
    // Simular búsqueda en blockchain/DB
    await new Promise(resolve => setTimeout(resolve, 1200))

    const patient = mockPatients.find(
      p => p.ci === newConsultCI || p.healthId === newConsultCI || p.healthId.includes(newConsultCI)
    )

    setIsSearching(false)

    if (patient) {
      toast.success('Paciente encontrado', {
        description: `Abriendo historia clínica de ${patient.name}`
      })
      setIsNewConsultOpen(false)
      router.push(`/doctor/patients/${patient.id}`)
    } else {
      toast.error('No se encontró el paciente', {
        description: 'Verifique el CI o el Health ID ingresado.'
      })
    }
  }

  const filteredPatients = mockPatients.filter(
    (patient) => {
      const matchesSearch = 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.ci.includes(searchTerm) ||
        patient.healthId.includes(searchTerm)
      
      const matchesStatus = statusFilter === 'Todos' || patient.status === statusFilter
      
      return matchesSearch && matchesStatus
    }
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="bg-foreground/5 rounded-2xl font-bold h-12 px-6 hover:bg-foreground/10 border border-border/50">
                  <Filter className="size-4 mr-2" />
                  Filtrar {statusFilter !== 'Todos' && `(${statusFilter})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl bg-background/95 backdrop-blur-xl border-border shadow-2xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-3 py-2">Estado del Paciente</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => setStatusFilter('Todos')} className="rounded-xl h-11 font-bold focus:bg-cyan-500/10 focus:text-cyan-500 flex justify-between items-center">
                  Todos
                  {statusFilter === 'Todos' && <Check className="size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Activo')} className="rounded-xl h-11 font-bold focus:bg-cyan-500/10 focus:text-cyan-500 flex justify-between items-center">
                  Activo
                  {statusFilter === 'Activo' && <Check className="size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Inactivo')} className="rounded-xl h-11 font-bold focus:bg-cyan-500/10 focus:text-cyan-500 flex justify-between items-center">
                  Inactivo
                  {statusFilter === 'Inactivo' && <Check className="size-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isNewConsultOpen} onOpenChange={setIsNewConsultOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-electric text-azul-profundo font-black rounded-2xl h-12 px-8 border-none hover:scale-105 transition-all shadow-lg shadow-cyan-500/20">
                  <Plus className="size-4 mr-2" />
                  Nueva Consulta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[2rem] bg-background/95 backdrop-blur-xl border-border">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Iniciar Nueva Consulta</DialogTitle>
                  <DialogDescription className="font-bold text-foreground/40">
                    Ingrese el CI o Health ID del paciente para acceder a su historial.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-cyan-500 transition-colors" />
                    <Input
                      placeholder="CI o Wallet Address..."
                      value={newConsultCI}
                      onChange={(e) => setNewConsultCI(e.target.value)}
                      className="pl-12 h-14 rounded-2xl bg-foreground/[0.03] border-border/50 focus:border-cyan-500/50 text-base"
                    />
                  </div>
                </div>
                <DialogFooter className="sm:justify-start">
                  <Button 
                    className="w-full bg-gradient-electric text-azul-profundo font-black rounded-2xl h-14 border-none hover:scale-[1.02] transition-all disabled:opacity-50"
                    onClick={handleNewConsultSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Buscando en Red...
                      </>
                    ) : (
                      'Buscar y Abrir Historia'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <div className="flex justify-between items-center bg-foreground/5 p-3 rounded-2xl border border-border/30">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Health ID</p>
                      <p className="font-mono text-xs text-foreground/70 truncate">{patient.healthId}</p>
                    </div>
                    <Shield className="size-4 text-cyan-500 opacity-30" />
                  </div>
                  
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

        {filteredPatients.length === 0 && (
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

