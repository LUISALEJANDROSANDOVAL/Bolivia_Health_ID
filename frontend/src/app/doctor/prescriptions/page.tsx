'use client'

import { useState } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Calendar,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react'

interface Patient {
  id: string
  name: string
  ci: string
  age: number
  allergies: string[]
  gender: 'M' | 'F'
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
  { id: '1', name: 'María García López', ci: '4523698', age: 45, allergies: ['Penicilina'], gender: 'F' },
  { id: '2', name: 'Carlos Mendoza R.', ci: '6587412', age: 32, allergies: [], gender: 'M' },
  { id: '3', name: 'Ana Quispe Mamani', ci: '7896541', age: 28, allergies: ['Aspirina', 'Ibuprofeno'], gender: 'F' },
]

export default function DoctorPrescriptionsPage() {
  const [activeTab, setActiveTab] = useState<'nueva' | 'historial'>('nueva')
  const [searchPatient, setSearchPatient] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [showAddMed, setShowAddMed] = useState(false)
  const [diagnosis, setDiagnosis] = useState('')
  const [observations, setObservations] = useState('')
  
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
      <div className="animate-slide-in space-y-8 p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Pill className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Recetas Médicas</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Sistema de prescripción digital segura y verificada
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl border-2">
              <ClipboardList className="mr-2 h-4 w-4" />
              Guías Médicas
            </Button>
            <Button className="btn-premium shadow-lg">
              <Plus className="mr-2 h-5 w-5" />
              Nueva Receta
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Recetas Hoy', value: '12', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Esta Semana', value: '48', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'Pendientes', value: '3', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Emitidas (Mes)', value: '156', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <Card key={i} className="card-premium border-none shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    <p className={`mt-1 text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b-2 border-muted pb-1">
          <button
            onClick={() => setActiveTab('nueva')}
            className={`relative px-6 py-4 text-sm font-bold transition-all ${
              activeTab === 'nueva'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Nueva Prescripción
            {activeTab === 'nueva' && (
              <div className="absolute bottom-[-2px] left-0 h-[3px] w-full bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`relative px-6 py-4 text-sm font-bold transition-all ${
              activeTab === 'historial'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Historial de Recetas
            {activeTab === 'historial' && (
              <div className="absolute bottom-[-2px] left-0 h-[3px] w-full bg-primary rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'nueva' ? (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Form Section */}
            <div className="lg:col-span-8 space-y-8">
              {/* 1. Patient Selection */}
              <Card className="card-premium border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Información del Paciente</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {!selectedPatient ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          placeholder="Buscar paciente por nombre o documento de identidad..."
                          value={searchPatient}
                          onChange={(e) => setSearchPatient(e.target.value)}
                          className="pl-12 h-14 text-lg rounded-xl border-muted transition-all focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                      
                      {searchPatient && (
                        <div className="mt-4 divide-y divide-muted rounded-2xl border border-muted bg-card shadow-xl animate-in fade-in slide-in-from-top-4 overflow-hidden">
                          {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                            <button
                              key={patient.id}
                              onClick={() => {
                                setSelectedPatient(patient)
                                setSearchPatient('')
                              }}
                              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${patient.gender === 'F' ? 'bg-pink-500/20 text-pink-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                  {patient.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">{patient.name}</p>
                                  <p className="text-sm text-muted-foreground">CI: {patient.ci} • {patient.age} años</p>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                          )) : (
                            <div className="p-8 text-center text-muted-foreground">
                              No se encontraron pacientes con ese criterio.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-transparent p-6 border border-primary/10">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-5">
                          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm text-2xl font-black ${selectedPatient.gender === 'F' ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white'}`}>
                            {selectedPatient.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-foreground">{selectedPatient.name}</h3>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge variant="outline" className="bg-background/80 font-bold">CI: {selectedPatient.ci}</Badge>
                              <Badge variant="outline" className="bg-background/80 font-bold">{selectedPatient.age} Años</Badge>
                              <Badge variant="outline" className="bg-background/80 font-bold">{selectedPatient.gender === 'M' ? 'Masculino' : 'Femenino'}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedPatient(null)}
                          className="rounded-full hover:bg-red-50 hover:text-red-500"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {selectedPatient.allergies.length > 0 && (
                        <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-red-600 dark:text-red-400 border border-red-500/20">
                          <AlertTriangle className="h-6 w-6 animate-pulse" />
                          <div>
                            <p className="text-sm font-black uppercase tracking-tight">Alerta Médica: Alergias Detectadas</p>
                            <p className="text-sm font-medium">{selectedPatient.allergies.join(', ')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2. Diagnosis */}
              <Card className="card-premium border-none shadow-md">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Diagnóstico y Observaciones</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground">Diagnóstico Principal (CIE-10)</Label>
                    <Input 
                      placeholder="Ej: E11.9 - Diabetes mellitus tipo 2 sin complicaciones"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="h-12 rounded-xl focus:ring-primary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground">Observaciones Clínicas</Label>
                    <Textarea 
                      placeholder="Detalles adicionales, recomendaciones dietéticas o precauciones..." 
                      rows={4} 
                      className="rounded-xl focus:ring-primary/10 resize-none"
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 3. Medications */}
              <Card className="card-premium border-none shadow-md">
                <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <Pill className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Tratamiento Farmacológico</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddMed(true)}
                    className="rounded-lg border-primary text-primary hover:bg-primary/5 font-bold"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Añadir Fármaco
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  {showAddMed && (
                    <div className="mb-8 space-y-6 rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 animate-in zoom-in-95">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="font-bold text-foreground">Nombre del Medicamento</Label>
                          <Input
                            placeholder="Ej: Metformina"
                            value={newMed.name}
                            onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                            className="bg-background rounded-xl h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-foreground">Dosis / Concentración</Label>
                          <Input
                            placeholder="Ej: 850mg"
                            value={newMed.dose}
                            onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                            className="bg-background rounded-xl h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-foreground">Frecuencia de Toma</Label>
                          <Select value={newMed.frequency} onValueChange={(val) => setNewMed({ ...newMed, frequency: val })}>
                            <SelectTrigger className="w-full bg-background rounded-xl h-11">
                              <SelectValue placeholder="Seleccionar frecuencia..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cada 24 horas (1 vez al día)">Cada 24 horas (1 vez al día)</SelectItem>
                              <SelectItem value="Cada 12 horas (2 veces al día)">Cada 12 horas (2 veces al día)</SelectItem>
                              <SelectItem value="Cada 8 horas (3 veces al día)">Cada 8 horas (3 veces al día)</SelectItem>
                              <SelectItem value="Cada 6 horas (4 veces al día)">Cada 6 horas (4 veces al día)</SelectItem>
                              <SelectItem value="Según necesidad (SOS)">Según necesidad (SOS)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-foreground">Duración del Tratamiento</Label>
                          <Select value={newMed.duration} onValueChange={(val) => setNewMed({ ...newMed, duration: val })}>
                            <SelectTrigger className="w-full bg-background rounded-xl h-11">
                              <SelectValue placeholder="Seleccionar duración..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3 días">3 días</SelectItem>
                              <SelectItem value="5 días">5 días</SelectItem>
                              <SelectItem value="7 días">7 días</SelectItem>
                              <SelectItem value="10 días">10 días</SelectItem>
                              <SelectItem value="14 días">14 días</SelectItem>
                              <SelectItem value="30 días">30 días</SelectItem>
                              <SelectItem value="Tratamiento prolongado">Tratamiento prolongado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground">Instrucciones Especiales</Label>
                        <Input
                          placeholder="Ej: Administrar con el almuerzo, no suspender bruscamente..."
                          value={newMed.instructions}
                          onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                          className="bg-background rounded-xl h-11"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setShowAddMed(false)} className="font-bold">
                          Cancelar
                        </Button>
                        <Button onClick={addMedication} className="btn-premium px-8">
                          Confirmar Medicamento
                        </Button>
                      </div>
                    </div>
                  )}

                  {medications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted py-16 text-center">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
                        <Pill className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Sin fármacos registrados</h4>
                      <p className="max-w-[280px] text-sm text-muted-foreground mt-1">
                        Presione el botón "Añadir Fármaco" para incluir medicamentos en la receta.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medications.map((med, index) => (
                        <div key={med.id} className="group relative flex items-center justify-between rounded-2xl border border-muted bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg">
                          <div className="flex items-center gap-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-black shadow-md">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-lg font-black text-foreground">{med.name} <span className="text-primary ml-1">{med.dose}</span></p>
                              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {med.frequency}</span>
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Por {med.duration}</span>
                              </div>
                              {med.instructions && (
                                <p className="mt-2 text-xs italic text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded inline-block">
                                  Nota: {med.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeMedication(med.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-red-500 hover:bg-red-50"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar / Summary Section */}
            <div className="lg:col-span-4 space-y-6">
              {/* Prescription Live Summary */}
              <div className="sticky top-8 space-y-6">
                <Card className="border-none shadow-xl overflow-hidden glass-dark text-white">
                  <div className="bg-gradient-premium p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                        <FileSignature className="h-6 w-6" />
                      </div>
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                        Borrador Digital
                      </Badge>
                    </div>
                    <h3 className="text-xl font-black">Resumen de la Receta</h3>
                    <p className="text-white/60 text-xs mt-1 uppercase tracking-widest font-bold">Registro Blockchain Health ID</p>
                  </div>
                  <CardContent className="p-6 space-y-6 bg-white/5 backdrop-blur-sm">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Paciente</p>
                        <p className="text-sm font-bold">{selectedPatient?.name || 'No seleccionado'}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Diagnóstico</p>
                        <p className="text-sm font-medium line-clamp-1 italic">{diagnosis || 'Sin especificar'}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Medicamentos ({medications.length})</p>
                        <div className="space-y-2 mt-1">
                          {medications.length > 0 ? medications.slice(0, 3).map(m => (
                            <div key={m.id} className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded-lg">
                              <Pill className="h-3 w-3 text-primary" />
                              <span className="font-bold">{m.name}</span>
                              <span className="text-white/50">{m.dose}</span>
                            </div>
                          )) : (
                            <p className="text-xs text-white/30">Ningún fármaco añadido</p>
                          )}
                          {medications.length > 3 && <p className="text-[10px] text-white/40">+{medications.length - 3} más...</p>}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <Button 
                        className="w-full bg-white text-primary hover:bg-white/90 h-14 rounded-2xl font-black text-base shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                        disabled={!selectedPatient || medications.length === 0}
                      >
                        Firmar y Emitir Receta
                      </Button>
                      <p className="text-[10px] text-center text-white/40 mt-4 leading-relaxed px-4">
                        Al emitir esta receta, se generará una firma criptográfica única vinculada a su identidad profesional.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Helpful Resources */}
                <Card className="card-premium border-none shadow-md overflow-hidden">
                  <div className="bg-muted/30 p-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Validación y Seguridad
                    </CardTitle>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                      <p className="text-xs text-muted-foreground">Verificación automática de interacciones medicamentosas activa.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                      <p className="text-xs text-muted-foreground">Sincronización en tiempo real con la Wallet del Paciente.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          /* Historial Tab - Improved Empty State */
          <Card className="card-premium border-none shadow-md">
            <CardContent className="flex min-h-[500px] flex-col items-center justify-center p-12 text-center">
              <div className="mb-6 relative">
                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-xl animate-pulse" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-12 w-12 text-primary/50" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-foreground">Historial de Recetas Vacío</h3>
              <p className="mt-2 max-w-[320px] text-muted-foreground">
                Aún no has emitido recetas digitales. Las recetas firmadas aparecerán aquí organizadas por fecha.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('nueva')}
                className="mt-8 rounded-xl border-2 font-bold px-8 h-12"
              >
                Comenzar Primera Receta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DoctorLayout>
  )
}
