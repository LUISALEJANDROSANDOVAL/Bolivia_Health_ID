'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { AlertCircle, Heart, Pill, FileText, Loader2, UploadCloud, Download, Edit2, Check, X, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function PatientView360() {
  const params = useParams()
  const patientId = params.id as string
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [vitals, setVitals] = useState<any>(null)
  const [medications, setMedications] = useState<any[]>([])
  const [background, setBackground] = useState<any[]>([])
  const [studies, setStudies] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  // Vitals Edit State
  const [isEditingVitals, setIsEditingVitals] = useState(false)
  const [isSavingVitals, setIsSavingVitals] = useState(false)
  const [editVitalsForm, setEditVitalsForm] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    weight: '',
    height: ''
  })

  const fetchPatientData = useCallback(async () => {
    try {
      setIsLoading(true)

      // 1. Perfil
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single()

      if (profileErr) throw profileErr
      setProfile(profileData)

      // 2. Vitals
      const { data: vitalsData } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('patient_id', patientId)
        .single()

      setVitals(vitalsData || {})
      setEditVitalsForm({
        blood_pressure: vitalsData?.blood_pressure || '',
        heart_rate: vitalsData?.heart_rate || '',
        temperature: vitalsData?.temperature || '',
        weight: vitalsData?.weight || '',
        height: vitalsData?.height || ''
      })

      // 3. Medications
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')

      setMedications(medsData || [])

      // 4. Background (Condiciones crónicas y otras cosas, filtraremos)
      const { data: bgData } = await supabase
        .from('medical_background')
        .select('*')
        .eq('patient_id', patientId)

      setBackground(bgData || [])

      // 5. Studies
      const { data: recordsData } = await supabase
        .from('health_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      setStudies(recordsData || [])

    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', description: 'No se pudieron cargar los datos del paciente', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [patientId, toast])

  useEffect(() => {
    if (patientId) {
      fetchPatientData()
    }
  }, [fetchPatientData, patientId])

  const handleSaveVitals = async () => {
    setIsSavingVitals(true)
    try {
      // 1. Verificar si ya existe un registro de vitales para este paciente
      const { data: existingVitals } = await supabase
        .from('patient_vitals')
        .select('id')
        .eq('patient_id', patientId)
        .maybeSingle()

      let dbError = null;

      if (existingVitals) {
        // Actualizar si ya existe
        const { error } = await supabase
          .from('patient_vitals')
          .update({
            blood_pressure: editVitalsForm.blood_pressure,
            heart_rate: editVitalsForm.heart_rate,
            temperature: editVitalsForm.temperature,
            weight: editVitalsForm.weight,
            height: editVitalsForm.height,
            updated_at: new Date().toISOString()
          })
          .eq('patient_id', patientId)
        dbError = error
      } else {
        // Insertar si no existe
        const { error } = await supabase
          .from('patient_vitals')
          .insert({
            patient_id: patientId,
            blood_pressure: editVitalsForm.blood_pressure,
            heart_rate: editVitalsForm.heart_rate,
            temperature: editVitalsForm.temperature,
            weight: editVitalsForm.weight,
            height: editVitalsForm.height
          })
        dbError = error
      }

      if (dbError) throw dbError

      setVitals({ ...vitals, ...editVitalsForm })
      setIsEditingVitals(false)
      toast({ title: 'Éxito', description: 'Signos vitales actualizados correctamente' })
    } catch (err: any) {
      console.error("Error guardando vitales:", err)
      toast({
        title: 'Error al guardar',
        description: err.message || 'Revisa la consola para más detalles',
        variant: 'destructive'
      })
    } finally {
      setIsSavingVitals(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. Upload to Supabase Storage (Bucket: health_records)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${patientId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('health_records')
        .upload(filePath, file)

      if (uploadError) {
        // Create bucket if it doesn't exist? (Often needs to be done via dashboard due to RLS, but we catch it)
        throw new Error('Error al subir a Storage. Asegúrate de tener un bucket llamado "health_records" creado y público. Detalle: ' + uploadError.message)
      }

      // 2. Get Public URL or save path
      const { data: { publicUrl } } = supabase.storage
        .from('health_records')
        .getPublicUrl(filePath)

      // 3. Insert into health_records table
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)

      const { error: dbError } = await supabase
        .from('health_records')
        .insert({
          patient_id: patientId,
          title: file.name,
          category: 'Otros', // Default
          file_size: `${fileSizeInMB} MB`,
          file_url: publicUrl,
          file_type: fileExt
        })

      if (dbError) throw dbError

      toast({ title: 'Éxito', description: 'Estudio subido correctamente' })
      fetchPatientData() // Recargar estudios

    } catch (err: any) {
      console.error('Error uploading:', err)
      toast({ title: 'Error', description: err.message || 'Error al subir el archivo', variant: 'destructive' })
    } finally {
      setUploading(false)
      // Reset input value to allow uploading the same file again if needed
      e.target.value = ''
    }
  }

  if (isLoading) {
    return (
      <DoctorLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Cargando historia clínica...</p>
        </div>
      </DoctorLayout>
    )
  }

  if (!profile) {
    return (
      <DoctorLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-destructive font-bold">Paciente no encontrado</p>
        </div>
      </DoctorLayout>
    )
  }

  const age = calculateAge(profile.birth_date)
  const allergiesList = vitals?.allergies ? vitals.allergies.split(',').map((a: string) => a.trim()) : []
  // Mostrar cualquier background como antecedente médico
  const chronicConditions = background

  return (
    <DoctorLayout>
      <div className="space-y-6 p-6 animate-slide-in">
        {/* Patient Header */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-accent/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{profile.full_name}</h1>
              <p className="text-muted-foreground">
                {age} años • {profile.gender === 'M' ? 'Masculino' : profile.gender === 'F' ? 'Femenino' : profile.gender || 'N/A'}
              </p>
              <p className="mt-2 font-mono text-sm text-foreground">CI: {profile.cedula_identidad}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{vitals?.blood_type || 'N/A'}</div>
              <p className="text-sm text-muted-foreground">Grupo Sanguíneo</p>
            </div>
          </div>

          {/* Alerts */}
          {allergiesList.length > 0 && (
            <div className="mt-4 space-y-2">
              {allergiesList.map((allergy: string, idx: number) => (
                <Alert key={idx} className="border-destructive bg-destructive/5">
                  <AlertCircle className="size-4 text-destructive" />
                  <AlertDescription className="text-destructive font-semibold">
                    ⚠️ ALERGIA: {allergy}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="bg-white/50 dark:bg-azul-profundo/30 backdrop-blur-md p-1 rounded-2xl border border-azul-electrico/10 shadow-sm inline-block w-full overflow-x-auto whitespace-nowrap">
            <TabsList className="flex bg-transparent h-auto p-0 border-none min-w-max">
              <TabsTrigger 
                value="overview"
                className="px-4 md:px-6 py-2.5 rounded-xl transition-all duration-300 font-semibold
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="px-4 md:px-6 py-2.5 rounded-xl transition-all duration-300 font-semibold
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Historial
              </TabsTrigger>
              <TabsTrigger 
                value="consultation"
                className="px-4 md:px-6 py-2.5 rounded-xl transition-all duration-300 font-semibold
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Nueva Consulta
              </TabsTrigger>
              <TabsTrigger 
                value="studies"
                className="px-4 md:px-6 py-2.5 rounded-xl transition-all duration-300 font-semibold
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Estudios
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Resumen Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Vital Signs */}
              <Card className="relative overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="size-5 text-primary" />
                    Signos Vitales Recientes
                  </CardTitle>
                  {!isEditingVitals && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingVitals(true)}
                      className="h-8 px-3 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 rounded-full"
                    >
                      <Edit2 className="size-4 mr-1.5" />
                      Editar
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {isEditingVitals ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Presión Arterial</p>
                          <Input
                            placeholder="Ej: 120/80"
                            value={editVitalsForm.blood_pressure}
                            onChange={(e) => setEditVitalsForm({ ...editVitalsForm, blood_pressure: e.target.value })}
                            className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Frec. Cardíaca</p>
                          <div className="relative">
                            <Input
                              placeholder="Ej: 72"
                              value={editVitalsForm.heart_rate}
                              onChange={(e) => setEditVitalsForm({ ...editVitalsForm, heart_rate: e.target.value })}
                              className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">bpm</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Temperatura</p>
                          <div className="relative">
                            <Input
                              placeholder="Ej: 36.5"
                              value={editVitalsForm.temperature}
                              onChange={(e) => setEditVitalsForm({ ...editVitalsForm, temperature: e.target.value })}
                              className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">°C</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Peso</p>
                          <div className="relative">
                            <Input
                              placeholder="Ej: 75"
                              value={editVitalsForm.weight}
                              onChange={(e) => setEditVitalsForm({ ...editVitalsForm, weight: e.target.value })}
                              className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">kg</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Altura</p>
                          <div className="relative">
                            <Input
                              placeholder="Ej: 170"
                              value={editVitalsForm.height}
                              onChange={(e) => setEditVitalsForm({ ...editVitalsForm, height: e.target.value })}
                              className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">cm</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-3 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingVitals(false)
                            setEditVitalsForm({
                              blood_pressure: vitals?.blood_pressure || '',
                              heart_rate: vitals?.heart_rate || '',
                              temperature: vitals?.temperature || '',
                              weight: vitals?.weight || '',
                              height: vitals?.height || ''
                            })
                          }}
                          disabled={isSavingVitals}
                          className="h-8 rounded-full"
                        >
                          <X className="size-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveVitals}
                          disabled={isSavingVitals}
                          className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm"
                        >
                          {isSavingVitals ? (
                            <Loader2 className="size-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="size-4 mr-1" />
                          )}
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="flex justify-between items-center border-b border-border/50 pb-2 group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Presión Arterial</p>
                        <p className="text-lg font-bold text-foreground">{vitals?.blood_pressure || 'N/A'}</p>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/50 pb-2 group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Frecuencia Cardíaca</p>
                        <p className="text-lg font-bold text-foreground">
                          {vitals?.heart_rate ? `${vitals.heart_rate} bpm` : 'N/A'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/50 pb-2 group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Temperatura</p>
                        <p className="text-lg font-bold text-foreground">
                          {vitals?.temperature ? `${vitals.temperature} °C` : 'N/A'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/50 pb-2 group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Peso</p>
                        <p className="text-lg font-bold text-foreground">
                          {vitals?.weight ? `${vitals.weight} kg` : 'N/A'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Altura</p>
                        <p className="text-lg font-bold text-foreground">
                          {vitals?.height ? `${vitals.height} cm` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
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
                  <div className="space-y-3">
                    {medications.length > 0 ? (
                      medications.map((med) => (
                        <div key={med.id} className="flex items-center justify-between text-sm p-2 bg-foreground/5 rounded-lg">
                          <div>
                            <span className="text-foreground font-semibold block">{med.name}</span>
                            <span className="text-xs text-muted-foreground">{med.frequency}</span>
                          </div>
                          <Badge variant="secondary">{med.dosage}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay medicamentos activos.</p>
                    )}
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
                {chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chronicConditions.map((condition) => (
                      <Badge key={condition.id} variant="outline" className="bg-red-50 text-red-800 border-red-300 px-3 py-1">
                        {condition.title}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin antecedentes registrados.</p>
                )}
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
                <CardDescription>Timeline inmutable de todas las consultas y registros médicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {background.length > 0 ? (
                    background.map((record) => (
                      <div key={record.id} className="flex items-start justify-between border-b border-border/50 pb-4 last:border-0 group hover:bg-foreground/5 p-3 -mx-3 rounded-xl transition-colors">
                        <div>
                          <p className="font-semibold text-foreground text-lg">{record.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{record.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] uppercase bg-background">{record.category}</Badge>
                            <span className="text-xs text-muted-foreground font-medium">{new Date(record.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant="default" className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30 border-none">
                          {record.status_detail || 'Registrado'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-foreground/5 rounded-xl border border-border/50">
                      <Lock className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-muted-foreground">No hay registros en el historial.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estudios Tab */}
          <TabsContent value="studies" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  Estudios y Exámenes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Upload Area */}
                <div className="relative rounded-xl border-2 border-dashed border-border/50 bg-foreground/5 hover:bg-foreground/10 transition-colors p-10 text-center group cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                    {uploading ? (
                      <Loader2 className="size-10 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="size-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                    <p className="text-foreground font-semibold text-lg">
                      {uploading ? 'Subiendo archivo y registrando...' : 'Arrastra archivos o haz clic para subir'}
                    </p>
                    <p className="text-sm text-muted-foreground">Soporta archivos PDF, JPG, PNG (máx. 20MB)</p>
                  </div>
                </div>

                {/* List of Studies */}
                <div className="space-y-4 pt-4">
                  <h4 className="font-semibold text-foreground border-b border-border/30 pb-2">Documentos Guardados</h4>
                  {studies.length > 0 ? (
                    <div className="grid gap-3">
                      {studies.map((study) => (
                        <div key={study.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="size-6 text-primary" />
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-foreground truncate">{study.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{study.category}</Badge>
                                <span className="text-xs text-muted-foreground font-medium">{study.file_size}</span>
                                <span className="text-xs text-muted-foreground">• {new Date(study.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <a
                            href={study.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-10 w-10 rounded-full bg-foreground/5 hover:bg-primary/10">
                              <Download className="size-4" />
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-foreground/5 rounded-xl border border-border/50">
                      <FileText className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-muted-foreground">No hay estudios registrados.</p>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  )
}
