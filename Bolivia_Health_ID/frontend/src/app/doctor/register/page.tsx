'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Stethoscope, User, Mail, Phone, MapPin, CreditCard, Briefcase, Lock, ArrowLeft } from 'lucide-react'

export default function DoctorRegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    cedula: '',
    email: '',
    telefono: '',
    direccion: '',
    especialidad: '',
    licenciaMedica: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    localStorage.setItem('doctorName', formData.nombreCompleto)
    localStorage.setItem('doctorLicense', formData.licenciaMedica)
    localStorage.setItem('doctorEmail', formData.email)
    localStorage.setItem('doctorSpecialty', formData.especialidad)
    router.push('/doctor/login')
    setIsLoading(false)
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
            <h1 className="text-2xl font-bold text-foreground">Registro de Doctor</h1>
            <p className="text-muted-foreground">Bolivia Health ID - Crear cuenta profesional</p>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-5 text-primary" />
              Datos del Profesional
            </CardTitle>
            <CardDescription>
              Complete todos los campos para crear su cuenta médica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <User className="size-4 text-primary" />
                      Nombre completo
                    </FieldLabel>
                    <Input
                      name="nombreCompleto"
                      placeholder="Dr. Juan Pérez"
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

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <Mail className="size-4 text-primary" />
                      Correo electrónico
                    </FieldLabel>
                    <Input
                      name="email"
                      type="email"
                      placeholder="doctor@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <Briefcase className="size-4 text-primary" />
                      Especialidad
                    </FieldLabel>
                    <Input
                      name="especialidad"
                      placeholder="Medicina General"
                      value={formData.especialidad}
                      onChange={handleChange}
                      required
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
                      <Stethoscope className="size-4 text-primary" />
                      Licencia Médica
                    </FieldLabel>
                    <Input
                      name="licenciaMedica"
                      placeholder="LIC-BOL-2024-00815"
                      value={formData.licenciaMedica}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    Dirección
                  </FieldLabel>
                  <Input
                    name="direccion"
                    placeholder="Plan 3000, Barrio Simón Bolívar, Calle 4, N 24"
                    value={formData.direccion}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <Lock className="size-4 text-primary" />
                      Contraseña
                    </FieldLabel>
                    <Input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <Lock className="size-4 text-primary" />
                      Confirmar Contraseña
                    </FieldLabel>
                    <Input
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                </div>
              </FieldGroup>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/doctor/login" className="text-primary hover:underline">
                    Iniciar Sesión
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
