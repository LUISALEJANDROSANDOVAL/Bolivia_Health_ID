'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Wallet,
  Droplets,
  AlertTriangle,
  Lock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Role = 'paciente' | 'medico'

export default function RegisterPage() {
  const router = useRouter()
  // const searchParams = useSearchParams()
  // Fallback to purely client-side routing if we want to avoid useSearchParams block issues
  // But we can just use a simple state for role selection:
  const [role, setRole] = useState<Role | null>(null)
  
  const { isConnected, walletAddress, connect, disconnect } = useWallet()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    cedula: '',
    telefono: '',
    direccion: '',
    // Si es médico
    especialidad: '',
    licenciaMedica: '',
    // Si es paciente
    tipoSangre: '',
    alergias: '',
    // Password
    password: ''
  })

  // Handle setting role if we arrived via "Crear cuenta" from login
  useEffect(() => {
    // Basic detection for query params using window since we are in a client component
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const r = urlParams.get('role')
      if (r === 'doctor' || r === 'medico') setRole('medico')
      if (r === 'paciente') setRole('paciente')
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleConnectWallet = async () => {
    connect()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !walletAddress) {
      alert("Por favor, conecta tu cuenta de Google/Wallet primero.")
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
        role: role,
        password_hash: hashedPassword
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('wallet_address', walletAddress.toLowerCase())

      if (error) {
        console.error("Supabase error detail:", error)
        alert(`Error desde Supabase: ${error.message || JSON.stringify(error)}`)
        throw error
      }

      // Guardar sesión base para demostración frontend
      localStorage.setItem('walletAddress', walletAddress)
      localStorage.setItem('userRole', role || 'paciente')
      localStorage.setItem('userName', formData.nombreCompleto)

      if (role === 'medico') {
        localStorage.setItem('doctorLicense', formData.licenciaMedica)
        localStorage.setItem('doctorSpecialty', formData.especialidad)
        router.push('/doctor')
      } else {
        localStorage.setItem('patientSession', 'true')
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Error actualizando perfil:', err)
      // La alerta específica ya se lanzó arriba si fue error de Supabase,
      // esto es solo un respaldo general.
      if (!err.message) {
        alert("Hubo un error al guardar tus datos.")
      }
    } finally {
      setIsLoading(false)
    }
  }

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
            <p className="text-muted-foreground">Bolivia Health ID - Registro unificado</p>
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
            {/* Cabecera del Rol Elegido */}
            <div className={`absolute top-0 w-full h-1 ${role === 'paciente' ? 'bg-blue-500' : 'bg-green-500'}`} />
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {role === 'paciente' ? <User className="size-5 text-blue-500" /> : <Stethoscope className="size-5 text-green-500" />}
                    Perfil de {role === 'paciente' ? 'Paciente' : 'Médico Profesional'}
                  </CardTitle>
                  <CardDescription>
                    Paso obligatorio: Vincula tu cuenta de Google y completa tus datos.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setRole(null)} className="text-xs text-muted-foreground">
                  Cambiar rol
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* PASO 1: Conectar Billetera */}
              <div className="mb-8 p-5 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Smartphone className="size-4 text-primary" />
                      1. Cuenta de Google
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isConnected 
                        ? "Cuenta conectada exitosamente." 
                        : "Conecta tu cuenta de Google para crear tu perfil de salud seguro."}
                    </p>
                  </div>
                  {!isConnected ? (
                    <Button onClick={handleConnectWallet} disabled={isLoading} className="whitespace-nowrap">
                      <Smartphone className="size-4 mr-2" />
                      {isLoading ? 'Conectando...' : 'Continuar con Google'}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 py-1.5 px-3 font-mono">
                        {walletAddress && `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                        Cambiar cuenta
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* PASO 2: Formulario (Solo se habilita si hay wallet) */}
              <div className={`transition-opacity duration-300 ${!isConnected ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <h3 className="font-semibold text-foreground mb-4">2. Datos de tu Carnet Médico (Supabase)</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FieldGroup>
                    {/* Campos Generales Comunes */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <User className="size-4 text-primary" />
                          Nombre completo
                        </FieldLabel>
                        <Input
                          name="nombreCompleto"
                          placeholder={role === 'medico' ? "Dr. Juan Pérez" : "Carlos Mendoza"}
                          value={formData.nombreCompleto}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <CreditCard className="size-4 text-primary" />
                          Cédula de Identidad
                        </FieldLabel>
                        <Input
                          name="cedula"
                          placeholder="8251794"
                          value={formData.cedula}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-1">
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Esta contraseña te servirá como capa extra de seguridad para tu identidad médica.
                        </p>
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

                    {/* Campos Específicos según Rol */}
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
                            placeholder="Ej. Penicilina, Nueces (o 'Ninguna')"
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
                            Licencia Médica
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

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading || !isConnected}
                      size="lg"
                      className="w-full text-base h-12"
                    >
                      {isLoading ? 'Guardando información...' : 'Crear Identidad Médica Mía'}
                    </Button>
                  </div>
                </form>
              </div>

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
