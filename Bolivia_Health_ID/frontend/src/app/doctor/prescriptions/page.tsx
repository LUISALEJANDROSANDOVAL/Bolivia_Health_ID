'use client'

import { useState } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Pill,
  Search,
  Plus,
  User,
  AlertTriangle,
  Clock,
  FileSignature,
  X,
  Calendar
} from 'lucide-react'

interface Patient {
  id: string
  name: string
  ci: string
  age: number
  allergies: string[]
}

interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  duration: string
  instructions: string
}

const mockPatients: Patient[] = [
  { id: '1', name: 'María García López', ci: '4523698', age: 45, allergies: ['Penicilina'] },
  { id: '2', name: 'Carlos Mendoza R.', ci: '6587412', age: 32, allergies: [] },
  { id: '3', name: 'Ana Quispe Mamani', ci: '7896541', age: 28, allergies: ['Aspirina', 'Ibuprofeno'] },
]

export default function DoctorPrescriptionsPage() {
  const [activeTab, setActiveTab] = useState<'nueva' | 'historial'>('nueva')
  const [searchPatient, setSearchPatient] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [showAddMed, setShowAddMed] = useState(false)
  const [diagnosis, setDiagnosis] = useState('')
  
  const [newMed, setNewMed] = useState({
    name: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: ''
  })

  const filteredPatients = mockPatients.filter(p => 
    p.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.ci.includes(searchPatient)
  )

  const addMedication = () => {
    if (newMed.name && newMed.dose && newMed.frequency) {
      setMedications([...medications, { ...newMed, id: Date.now().toString() }])
      setNewMed({ name: '', dose: '', frequency: '', duration: '', instructions: '' })
      setShowAddMed(false)
    }
  }

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id))
  }

  return (
    <DoctorLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Pill className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recetas Médicas</h1>
              <p className="text-muted-foreground">Prescribe medicamentos a tus pacientes de forma segura</p>
            </div>
          </div>
          <Button>
            <Plus className="mr-2 size-4" />
            Nueva Receta
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Recetas Hoy</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs uppercase tracking-wide text-primary">Esta Semana</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-2xl font-bold text-orange-500">0</p>
            <p className="text-xs uppercase tracking-wide text-orange-500">Pendientes</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-2xl font-bold text-pink-500">0</p>
            <p className="text-xs uppercase tracking-wide text-pink-500">Este Mes</p>
          </CardContent></Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab('nueva')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'nueva'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Nueva Receta
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'historial'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Historial
          </button>
        </div>

        {activeTab === 'nueva' ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Patient Selection */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 font-semibold text-foreground">1. Seleccionar Paciente</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o CI..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {searchPatient && !selectedPatient && (
                    <div className="mt-2 space-y-1 rounded-lg border p-2">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatient(patient)
                            setSearchPatient(patient.name)
                          }}
                          className="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span className="font-medium">{patient.name}</span>
                          <span className="ml-2 text-muted-foreground">CI: {patient.ci}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedPatient && (
                    <div className="mt-4 rounded-lg border bg-muted/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="size-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{selectedPatient.name}</p>
                            <p className="text-sm text-muted-foreground">
                              CI: {selectedPatient.ci} | {selectedPatient.age} años
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedPatient(null)
                            setSearchPatient('')
                          }}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      {selectedPatient.allergies.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 rounded bg-red-50 p-2 text-red-600">
                          <AlertTriangle className="size-4" />
                          <span className="text-sm font-medium">
                            Alergias: {selectedPatient.allergies.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Diagnosis */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 font-semibold text-foreground">2. Diagnóstico</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Diagnóstico (CIE-10)</Label>
                      <Input 
                        placeholder="Ej: E11 - Diabetes mellitus tipo 2"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Observaciones</Label>
                      <Textarea placeholder="Notas adicionales..." rows={3} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medications */}
              <Card>
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">3. Medicamentos</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAddMed(true)}
                    >
                      <Plus className="mr-1 size-4" />
                      Agregar
                    </Button>
                  </div>

                  {showAddMed && (
                    <div className="mb-4 space-y-4 rounded-lg border bg-muted/50 p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Medicamento</Label>
                          <Input
                            placeholder="Nombre del medicamento"
                            value={newMed.name}
                            onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Dosis</Label>
                          <Input
                            placeholder="Ej: 500mg"
                            value={newMed.dose}
                            onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Frecuencia</Label>
                          <Select value={newMed.frequency} onValueChange={(val) => setNewMed({ ...newMed, frequency: val })}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Una vez al día">Una vez al día</SelectItem>
                              <SelectItem value="Cada 12 horas">Cada 12 horas</SelectItem>
                              <SelectItem value="Cada 8 horas">Cada 8 horas</SelectItem>
                              <SelectItem value="Cada 6 horas">Cada 6 horas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duración</Label>
                          <Select value={newMed.duration} onValueChange={(val) => setNewMed({ ...newMed, duration: val })}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3 días">3 días</SelectItem>
                              <SelectItem value="5 días">5 días</SelectItem>
                              <SelectItem value="7 días">7 días</SelectItem>
                              <SelectItem value="14 días">14 días</SelectItem>
                              <SelectItem value="30 días">30 días</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Instrucciones</Label>
                        <Input
                          placeholder="Ej: Con alimentos, en ayunas..."
                          value={newMed.instructions}
                          onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddMed(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={addMedication}>
                          Agregar Medicamento
                        </Button>
                      </div>
                    </div>
                  )}

                  {medications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                      <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-primary/10">
                        <Pill className="size-8 text-primary/50" />
                      </div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground">
                        No hay medicamentos agregados
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {medications.map((med, index) => (
                        <div key={med.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{med.name} - {med.dose}</p>
                              <p className="text-sm text-muted-foreground">
                                {med.frequency} por {med.duration}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeMedication(med.id)}
                          >
                            <X className="size-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Sign Banner */}
              <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-white/20">
                  <FileSignature className="size-5" />
                </div>
                <p className="font-semibold">Firma Digital</p>
                <p className="mb-4 text-sm opacity-80">
                  La receta será firmada con tu wallet y registrada en blockchain.
                </p>
                <Button 
                  className="w-full bg-white text-primary hover:bg-white/90"
                  disabled={!selectedPatient || medications.length === 0}
                >
                  Firmar y Emitir Receta
                </Button>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 font-semibold text-foreground">Actividad Reciente</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Sin actividad reciente</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-4 font-semibold text-foreground">Estadísticas</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Recetas emitidas</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pacientes atendidos</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Este mes</span>
                      <span className="font-semibold">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Historial Tab */
          <Card className="border border-dashed">
            <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12">
              <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="size-10 text-primary/50" />
              </div>
              <p className="text-lg font-semibold text-foreground">No hay recetas en el historial</p>
              <p className="text-center text-sm text-muted-foreground">
                Las recetas que emitas aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DoctorLayout>
  )
}
