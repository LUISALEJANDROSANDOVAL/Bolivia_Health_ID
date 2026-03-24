'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { AlertCircle, Lock, Heart, Pill, FileText, Zap } from 'lucide-react'

export default function PatientView360() {
  const params = useParams()

  // Mock patient data
  const patient = {
    name: 'Carlos Mendoza',
    age: 45,
    gender: 'M',
    bloodType: 'O+',
    ci: '4567890',
    healthId: '0xA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
    allergies: ['Penicilina', 'Sulfonamidas'],
    chronicConditions: ['Hipertensión', 'Diabetes Tipo 2'],
  }

  const [consultNotes, setConsultNotes] = useState('')
  const [bloodPressure, setBloodPressure] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [temperature, setTemperature] = useState('')

  return (
    <DoctorLayout>
      <div className="space-y-6 p-6">
        {/* Patient Header */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-accent/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{patient.name}</h1>
              <p className="text-muted-foreground">{patient.age} años • {patient.gender}</p>
              <p className="mt-2 font-mono text-sm text-foreground">CI: {patient.ci}</p>
              <p className="font-mono text-sm text-muted-foreground">Health ID: {patient.healthId}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{patient.bloodType}</div>
              <p className="text-sm text-muted-foreground">Grupo Sanguíneo</p>
            </div>
          </div>

          {/* Alerts */}
          <div className="mt-4 space-y-2">
            {patient.allergies.map((allergy) => (
              <Alert key={allergy} className="border-destructive bg-destructive/5">
                <AlertCircle className="size-4 text-destructive" />
                <AlertDescription className="text-destructive font-semibold">
                  ⚠️ ALERGIA: {allergy}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="consultation">Nueva Consulta</TabsTrigger>
            <TabsTrigger value="studies">Estudios</TabsTrigger>
          </TabsList>

          {/* Resumen Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Vital Signs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="size-5 text-primary" />
                    Signos Vitales Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Presión Arterial</p>
                    <p className="text-2xl font-bold text-foreground">140/90</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Frecuencia Cardíaca</p>
                    <p className="text-2xl font-bold text-foreground">78 bpm</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Temperatura</p>
                    <p className="text-2xl font-bold text-foreground">36.8°C</p>
                  </div>
                </CardContent>
              </Card>

              {/* Current Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="size-5 text-primary" />
                    Medicamentos Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { name: 'Metformina', dose: '500mg' },
                      { name: 'Enalapril', dose: '10mg' },
                      { name: 'Atorvastatina', dose: '20mg' },
                    ].map((med) => (
                      <div key={med.name} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{med.name}</span>
                        <Badge variant="secondary">{med.dose}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chronic Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Antecedentes Médicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {patient.chronicConditions.map((condition) => (
                    <Badge key={condition} variant="outline" className="bg-red-50 text-red-800 border-red-300">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historial Tab */}
          <TabsContent value="history" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="size-5 text-primary" />
                  Historial Clínico Blockchain
                </CardTitle>
                <CardDescription>Timeline inmutable de todas las consultas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: '2024-03-20', type: 'Consulta Cardiológica', status: 'Acceso concedido' },
                    { date: '2024-03-10', type: 'Control de Hipertensión', status: 'Bloqueado' },
                    { date: '2024-02-28', type: 'Laboratorios', status: 'Acceso concedido' },
                  ].map((record, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-semibold text-foreground">{record.type}</p>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                      <Badge variant={record.status === 'Acceso concedido' ? 'default' : 'secondary'}>
                        {record.status === 'Acceso concedido' ? '🔓' : '🔒'} {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nueva Consulta Tab */}
          <TabsContent value="consultation" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Nueva Consulta</CardTitle>
                <CardDescription>Esta información será firmada criptográficamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FieldGroup>
                  <FieldLabel>Motivo de Consulta</FieldLabel>
                  <Textarea
                    placeholder="Describe el motivo de la consulta"
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                  />
                </FieldGroup>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Signos Vitales</h4>
                  <div className="grid gap-3 md:grid-cols-3">
                    <FieldGroup>
                      <FieldLabel>Presión Arterial (mmHg)</FieldLabel>
                      <Input
                        placeholder="120/80"
                        value={bloodPressure}
                        onChange={(e) => setBloodPressure(e.target.value)}
                      />
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel>Frecuencia Cardíaca (bpm)</FieldLabel>
                      <Input
                        placeholder="72"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        type="number"
                      />
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel>Temperatura (°C)</FieldLabel>
                      <Input
                        placeholder="36.8"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        type="number"
                      />
                    </FieldGroup>
                  </div>
                </div>

                <FieldGroup>
                  <FieldLabel>Diagnóstico (CIE-10)</FieldLabel>
                  <Input placeholder="Buscar código CIE-10" />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Receta/Tratamiento</FieldLabel>
                  <Textarea placeholder="Medicamentos y recomendaciones" />
                </FieldGroup>

                <Alert className="border-primary bg-primary/5">
                  <Zap className="size-4 text-primary" />
                  <AlertDescription>
                    Al guardar, se solicitará una firma de tu wallet para registrar este diagnóstico en blockchain
                  </AlertDescription>
                </Alert>

                <Button size="lg" className="w-full">
                  <Zap className="mr-2 size-5" />
                  Guardar y Firmar Diagnóstico
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estudios Tab */}
          <TabsContent value="studies" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  Estudios y Exámenes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-dashed p-8 text-center">
                  <p className="text-muted-foreground mb-2">Arrastra archivos o haz clic para subir</p>
                  <Button variant="outline">Seleccionar Archivo</Button>
                  <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG (máx 20MB)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  )
}
