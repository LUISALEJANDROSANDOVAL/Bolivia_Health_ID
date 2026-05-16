'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWallet } from '@/contexts/wallet-context'
import { supabase } from '@/lib/supabase'
import CryptoJS from 'crypto-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Stethoscope,
  User,
  Phone,
  MapPin,
  CreditCard,
  Briefcase,
  ArrowLeft,
  Smartphone,
  Droplets,
  AlertTriangle,
  Lock,
  ScanFace,
  CheckCircle2,
  XCircle,
  Loader2,
  Upload,
  ShieldCheck,
  Camera,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Role = 'paciente' | 'medico'

type VerificationStatus = 'idle' | 'scanning' | 'verified' | 'pending' | 'error'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const { isConnected, walletAddress, connect, disconnect } = useWallet()
  const [isLoading, setIsLoading] = useState(false)

  // OCR states
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle')
  const [verificationMessage, setVerificationMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [manualCI, setManualCI] = useState('')
  const [isVerifyingManual, setIsVerifyingManual] = useState(false)

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    cedula: '',
    telefono: '',
    direccion: '',
    email: '',
    especialidad: '',
    licenciaMedica: '',
    tipoSangre: '',
    alergias: '',
    password: '',
    fechaNacimiento: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const r = urlParams.get('role')
      if (r === 'doctor' || r === 'medico') setRole('medico')
      if (r === 'paciente') setRole('paciente')
    }
  }, [])

  // Redirección si ya es doctor y está intentando registrarse como tal
  useEffect(() => {
    async function checkExistingRole() {
      if (isConnected && walletAddress && role === 'medico') {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()
        
        if (data && data.role === 'medico') {
          console.log('Usuario ya es médico, redireccionando...')
          router.push('/doctor')
        }
      }
    }
    checkExistingRole()
  }, [isConnected, walletAddress, role, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleConnectWallet = async () => { connect() }

  // Manual CI verification (fallback when OCR fails)
  const handleManualVerify = async () => {
    if (!manualCI || manualCI.length < 6) return
    setIsVerifyingManual(true)
    setVerificationStatus('scanning')
    setVerificationMessage('Verificando manualmente contra el SEGIP...')
    try {
      const response = await fetch('/api/verify-ci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: manualCI })
      })
      const result = await response.json()
      if (result.status === 'verified') {
        setVerificationStatus('verified')
        setVerificationMessage(`Identidad verificada: ${result.data.nombres} ${result.data.apellidos}`)
        setFormData(prev => ({
          ...prev,
          nombreCompleto: `${result.data.nombres} ${result.data.apellidos}`,
          cedula: result.data.cedula,
          fechaNacimiento: result.data.fechaNacimiento || '',
        }))
      } else {
        setVerificationStatus('pending')
        setVerificationMessage('CI no encontrada en el SEGIP. Completa tus datos manualmente.')
        setFormData(prev => ({ ...prev, cedula: manualCI }))
      }
    } catch (err) {
      setVerificationStatus('error')
      setVerificationMessage('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsVerifyingManual(false)
    }
  }

  // Pre-process image for better OCR (grayscale + contrast)
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = img.width  * 2   // upscale 2x for better OCR
        canvas.height = img.height * 2
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Convert to grayscale + boost contrast
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]
          // High contrast: push values toward black or white
          const contrasted = avg < 128 ? Math.max(0, avg - 40) : Math.min(255, avg + 40)
          data[i] = data[i+1] = data[i+2] = contrasted
        }
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
        URL.revokeObjectURL(url)
      }
      img.src = url
    })
  }

  // --- OCR Handler ---
  const handleCIUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreviewUrl(URL.createObjectURL(file))
    setVerificationStatus('scanning')
    setVerificationMessage('Preprocesando imagen...')
    setScanProgress(5)

    try {
      const Tesseract = (await import('tesseract.js')).default

      // Pre-process image for better accuracy
      setScanProgress(10)
      setVerificationMessage('Mejorando calidad de imagen...')
      const processedDataUrl = await preprocessImage(file)

      setScanProgress(20)
      setVerificationMessage('Analizando documento con IA (pasada 1/2)...')

      // Pass 1: General text (gets names, all text)
      const pass1 = await Tesseract.recognize(processedDataUrl, 'spa', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setScanProgress(20 + Math.floor(m.progress * 30))
          }
        }
      })

      setScanProgress(55)
      setVerificationMessage('Extrayendo número de CI (pasada 2/2)...')

      // Pass 2: Digits only - much more accurate for CI numbers
      const pass2 = await Tesseract.recognize(processedDataUrl, 'spa', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setScanProgress(55 + Math.floor(m.progress * 30))
          }
        }
      })

      setScanProgress(90)
      setVerificationMessage('Verificando contra el SEGIP...')

      const combinedText = `${pass1.data.text}\n${pass2.data.text}`

      // Call verify API
      const response = await fetch('/api/verify-ci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: combinedText })
      })

      const result = await response.json()
      setScanProgress(100)

      if (result.status === 'verified') {
        setVerificationStatus('verified')
        setVerificationMessage(`Identidad verificada: ${result.data.nombres} ${result.data.apellidos}`)
        setFormData(prev => ({
          ...prev,
          nombreCompleto: `${result.data.nombres} ${result.data.apellidos}`,
          cedula: result.data.cedula,
          fechaNacimiento: result.data.fechaNacimiento || '',
        }))
      } else if (result.status === 'pending') {
        setVerificationStatus('pending')
        setVerificationMessage('CI no encontrada en el SEGIP. Ingresa tus datos manualmente.')
        if (result.extractedCI) {
          setFormData(prev => ({ ...prev, cedula: result.extractedCI }))
        }
      } else {
        setVerificationStatus('error')
        setVerificationMessage('No se detectó una CI válida. Intenta con una foto más clara y frontal.')
      }
    } catch (err) {
      console.error('OCR error:', JSON.stringify(err))
      setVerificationStatus('error')
      setVerificationMessage('Error al procesar la imagen. Intenta de nuevo.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !walletAddress) {
      alert('Por favor, conecta tu cuenta de Google/Wallet primero.')
      return
    }

    setIsLoading(true)
    try {
      const hashedPassword = CryptoJS.SHA256(formData.password).toString()

      const updates: any = {
        full_name: formData.nombreCompleto,
        cedula_identidad: formData.cedula,
        phone: formData.telefono,
        address: formData.direccion,
        email: formData.email || null,
        role: role,
        password_hash: hashedPassword,
        birth_date: formData.fechaNacimiento || null,
      }

      if (role === 'medico') {
        updates.license_number = formData.licenciaMedica
        updates.specialty = formData.especialidad
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('wallet_address', walletAddress.toLowerCase())

      if (error) {
        // Manejo específico de errores de duplicidad (Unique Constraint)
        if (error.code === '23505') {
          if (error.message?.includes('cedula_identidad')) {
            alert('Error: Esta Cédula de Identidad ya está registrada con otra cuenta.')
          } else if (error.message?.includes('wallet_address')) {
            alert('Error: Esta billetera ya tiene un perfil asignado.')
          } else {
            alert(`Error de duplicidad: ${error.message}`)
          }
        } else {
          alert(`Error desde Supabase: ${error.message || JSON.stringify(error)}`)
        }
        throw error
      }

      localStorage.setItem('walletAddress', walletAddress)
      localStorage.setItem('userRole', role || 'paciente')
      localStorage.setItem('userName', formData.nombreCompleto)

      if (role === 'medico') {
        localStorage.setItem('doctorLicense', formData.licenciaMedica)
        localStorage.setItem('doctorSpecialty', formData.especialidad)
        router.push('/verificando')
      } else {
        localStorage.setItem('patientSession', 'true')
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Error sincronizando perfil:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const statusConfig = {
    idle:     { color: 'border-border bg-foreground/5', icon: ScanFace,      iconColor: 'text-foreground/30' },
    scanning: { color: 'border-cyan-500/50 bg-cyan-500/5', icon: Loader2,    iconColor: 'text-cyan-400 animate-spin' },
    verified: { color: 'border-emerald-500/50 bg-emerald-500/5', icon: CheckCircle2, iconColor: 'text-emerald-400' },
    pending:  { color: 'border-amber-500/50 bg-amber-500/5', icon: AlertTriangle, iconColor: 'text-amber-400' },
    error:    { color: 'border-rose-500/50 bg-rose-500/5', icon: XCircle,    iconColor: 'text-rose-400' },
  }

  const currentStatus = statusConfig[verificationStatus]
  const StatusIcon = currentStatus.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Crear Identidad Médica</h1>
            <p className="text-muted-foreground">Bolivia Health ID — Registro seguro</p>
          </div>
        </div>

        {!role ? (
          <Card className="border-2">
            <CardHeader className="text-center pb-2">
              <CardTitle>¿Cuál es tu perfil?</CardTitle>
              <CardDescription>
                Selecciona tu rol para crear tu identidad médica de forma segura
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setRole('paciente')}
                className="flex-1 flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg focus:outline-none"
              >
                <div className="rounded-full bg-blue-500/10 p-4">
                  <User className="size-8 text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground text-lg">Soy Paciente</p>
                  <p className="text-sm text-muted-foreground mt-1">Quiero gestionar y proteger mi historial médico.</p>
                </div>
              </button>

              <button
                onClick={() => setRole('medico')}
                className="flex-1 flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg focus:outline-none"
              >
                <div className="rounded-full bg-green-500/10 p-4">
                  <Stethoscope className="size-8 text-green-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground text-lg">Soy Médico</p>
                  <p className="text-sm text-muted-foreground mt-1">Quiero atender a mis pacientes de forma segura y certificada.</p>
                </div>
              </button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 relative overflow-hidden">
            <div className={`absolute top-0 w-full h-1 ${role === 'paciente' ? 'bg-blue-500' : 'bg-green-500'}`} />

            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {role === 'paciente' ? <User className="size-5 text-blue-500" /> : <Stethoscope className="size-5 text-green-500" />}
                    Perfil de {role === 'paciente' ? 'Paciente' : 'Médico Profesional'}
                  </CardTitle>
                  <CardDescription>
                    Conecta tu cuenta y valida tu identidad con IA para completar el registro.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setRole(null)} className="text-xs text-muted-foreground">
                  Cambiar rol
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">

              {/* PASO 1: Cuenta de Google */}
              <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Smartphone className="size-4 text-primary" />
                      1. Cuenta de Google
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isConnected ? 'Cuenta conectada exitosamente.' : 'Conecta tu cuenta de Google para crear tu perfil de salud seguro.'}
                    </p>
                  </div>
                  {!isConnected ? (
                    <Button onClick={handleConnectWallet} disabled={isLoading} className="whitespace-nowrap">
                      <Smartphone className="size-4 mr-2" />
                      Continuar con Google
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 py-1.5 px-3 font-mono">
                        {walletAddress && `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive">
                        Cambiar cuenta
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* PASO 2: Escanear CI con IA */}
              <div className={`p-5 border-2 rounded-xl transition-all ${currentStatus.color}`}>
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                  <ShieldCheck className="size-4 text-primary" />
                  2. Validación de Identidad con IA (SEGIP)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sube una foto clara de tu Cédula de Identidad boliviana. La IA extraerá y verificará tus datos automáticamente.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Upload zone */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-shrink-0 w-40 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:border-primary/70 hover:bg-primary/5 ${previewUrl ? 'border-transparent p-0 overflow-hidden' : 'border-border'}`}
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="CI preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <Camera className="size-7 text-foreground/30" />
                        <span className="text-xs text-foreground/40 font-medium text-center">Subir foto del carnet</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCIUpload}
                  />

                  {/* Status */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`size-5 ${currentStatus.iconColor}`} />
                      <p className={`text-sm font-medium ${verificationStatus === 'verified' ? 'text-emerald-400' : verificationStatus === 'error' ? 'text-rose-400' : verificationStatus === 'pending' ? 'text-amber-400' : 'text-foreground/60'}`}>
                        {verificationStatus === 'idle' ? 'Esperando imagen...' : verificationMessage}
                      </p>
                    </div>

                    {verificationStatus === 'scanning' && (
                      <div className="w-full bg-foreground/10 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    )}

                    {verificationStatus === 'verified' && (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="size-3 mr-1" /> Verificado por SEGIP Bolivia
                      </Badge>
                    )}
                    {verificationStatus === 'pending' && (
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="size-3 mr-1" /> Pendiente de verificación manual
                      </Badge>
                    )}

                    {verificationStatus !== 'idle' && verificationStatus !== 'verified' && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-primary hover:underline"
                      >
                        Volver a intentar con otra foto
                      </button>
                    )}
                  </div>
                </div>

                {/* Manual fallback */}
                {verificationStatus !== 'verified' && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-foreground/50 mb-2 font-medium">
                      ¿La IA no detectó tu CI? Ingrésala manualmente:
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Ej: 8251794"
                        value={manualCI}
                        onChange={e => setManualCI(e.target.value.replace(/\D/g, ''))}
                        maxLength={9}
                        className="h-9 text-sm bg-foreground/5 border-border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleManualVerify}
                        disabled={isVerifyingManual || manualCI.length < 6}
                        className="whitespace-nowrap h-9 px-4"
                      >
                        {isVerifyingManual ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="size-4 mr-1" />
                        )}
                        Verificar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* PASO 3: Formulario de datos */}
              <div className={`transition-opacity duration-300 ${!isConnected ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <h3 className="font-semibold text-foreground mb-4">3. Completa tus datos personales</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FieldGroup>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <User className="size-4 text-primary" />
                          Nombre completo
                          {verificationStatus === 'verified' && <CheckCircle2 className="size-3 text-emerald-400" />}
                        </FieldLabel>
                        <Input
                          name="nombreCompleto"
                          placeholder={role === 'medico' ? 'Dr. Juan Pérez' : 'Carlos Mendoza'}
                          value={formData.nombreCompleto}
                          onChange={handleChange}
                          readOnly={verificationStatus === 'verified'}
                          className={verificationStatus === 'verified' ? 'bg-emerald-500/5 border-emerald-500/30' : ''}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <CreditCard className="size-4 text-primary" />
                          Cédula de Identidad
                          {verificationStatus === 'verified' && <CheckCircle2 className="size-3 text-emerald-400" />}
                        </FieldLabel>
                        <Input
                          name="cedula"
                          placeholder="8251794"
                          value={formData.cedula}
                          onChange={handleChange}
                          readOnly={verificationStatus === 'verified'}
                          className={verificationStatus === 'verified' ? 'bg-emerald-500/5 border-emerald-500/30' : ''}
                          required
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Lock className="size-4 text-primary" />
                          Correo electrónico
                        </FieldLabel>
                        <Input
                          name="email"
                          type="email"
                          placeholder="tu@correo.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Lock className="size-4 text-primary" />
                          Contraseña de Acceso
                        </FieldLabel>
                        <Input
                          name="password"
                          type="password"
                          placeholder="Crea una contraseña segura"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Phone className="size-4 text-primary" />
                          Teléfono
                        </FieldLabel>
                        <Input
                          name="telefono"
                          placeholder="70905110"
                          value={formData.telefono}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <MapPin className="size-4 text-primary" />
                          Dirección
                        </FieldLabel>
                        <Input
                          name="direccion"
                          placeholder="Calle 4, N 24, Barrio XYZ"
                          value={formData.direccion}
                          onChange={handleChange}
                        />
                      </Field>
                    </div>

                    {role === 'paciente' ? (
                      <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-border">
                        <Field>
                          <FieldLabel className="flex items-center gap-2">
                            <Droplets className="size-4 text-red-500" />
                            Tipo de Sangre
                          </FieldLabel>
                          <Input
                            name="tipoSangre"
                            placeholder="Ej. O+"
                            value={formData.tipoSangre}
                            onChange={handleChange}
                          />
                        </Field>
                        <Field>
                          <FieldLabel className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-amber-500" />
                            Alergias Conocidas
                          </FieldLabel>
                          <Input
                            name="alergias"
                            placeholder="Ej. Penicilina (o 'Ninguna')"
                            value={formData.alergias}
                            onChange={handleChange}
                          />
                        </Field>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-border">
                        <Field>
                          <FieldLabel className="flex items-center gap-2">
                            <Briefcase className="size-4 text-blue-500" />
                            Especialidad Principal
                          </FieldLabel>
                          <Input
                            name="especialidad"
                            placeholder="Cardiología, Medicina General..."
                            value={formData.especialidad}
                            onChange={handleChange}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel className="flex items-center gap-2">
                            <Stethoscope className="size-4 text-blue-500" />
                            Licencia Médica (SEDES)
                          </FieldLabel>
                          <Input
                            name="licenciaMedica"
                            placeholder="LIC-BOL-2024-..."
                            value={formData.licenciaMedica}
                            onChange={handleChange}
                            required
                          />
                        </Field>
                      </div>
                    )}
                  </FieldGroup>

                  <Button
                    type="submit"
                    disabled={isLoading || !isConnected}
                    size="lg"
                    className="w-full text-base h-12"
                  >
                    {isLoading ? (
                      <><Loader2 className="size-4 mr-2 animate-spin" />Guardando información...</>
                    ) : (
                      'Crear Identidad Médica Mía'
                    )}
                  </Button>
                </form>
              </div>

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
