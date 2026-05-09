'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { useModal } from 'connectkit'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import {
  Heart,
  Stethoscope,
  User,
  Mail,
  Lock,
  Smartphone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

type Role = 'paciente' | 'doctor' | null
type LoginMethod = 'email' | 'wallet'

export default function LoginPage() {
  const router = useRouter()
  const { isDoctorAuthenticated } = useDoctorAuth()
  const { setOpen } = useModal()
  const { isConnected } = useAccount()

  // Redirigir automáticamente si ya está autenticado como doctor o paciente
  useEffect(() => {
    if (isDoctorAuthenticated) {
      router.push('/doctor')
    } else if (isConnected && !isDoctorAuthenticated) {
      // Si está conectado pero no es doctor, asumimos que puede ir al dashboard de paciente
      // o quedarse aquí para elegir rol.
    }
  }, [isDoctorAuthenticated, isConnected, router])

  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    if (selectedRole === 'doctor') {
      router.push('/doctor')
    } else {
      localStorage.setItem('patientSession', 'true')
      router.push('/dashboard')
    }
    setIsLoading(false)
  }

  const handleWalletLogin = async () => {
    setOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Logo / Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-primary/10 p-4">
              <Heart className="size-10 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bolivia Health ID</h1>
            <p className="text-muted-foreground">Sistema de Salud Descentralizado</p>
          </div>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-xs">
              <ShieldCheck className="size-3 mr-1" />
              Blockchain Seguro
            </Badge>
            <Badge variant="outline" className="text-xs">
              🌐 Red Polygon
            </Badge>
          </div>
        </div>

        {/* Role Selection */}
        {!selectedRole ? (
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-muted-foreground">
              ¿Cómo deseas ingresar?
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Paciente */}
              <button
                onClick={() => setSelectedRole('paciente')}
                className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10 focus:outline-none"
              >
                <div className="rounded-xl bg-blue-500/10 p-4 transition-colors group-hover:bg-blue-500/20">
                  <User className="size-8 text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Soy Paciente</p>
                  <p className="text-xs text-muted-foreground mt-1">Accede a tu historial y datos</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </button>

              {/* Doctor */}
              <button
                onClick={() => setSelectedRole('doctor')}
                className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10 focus:outline-none"
              >
                <div className="rounded-xl bg-green-500/10 p-4 transition-colors group-hover:bg-green-500/20">
                  <Stethoscope className="size-8 text-green-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Soy Doctor</p>
                  <p className="text-xs text-muted-foreground mt-1">Panel médico profesional</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back / Role indicator */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedRole(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Cambiar rol
              </button>
              <Badge variant={selectedRole === 'doctor' ? 'default' : 'secondary'}>
                {selectedRole === 'doctor' ? (
                  <><Stethoscope className="size-3 mr-1" /> Panel Médico</>
                ) : (
                  <><User className="size-3 mr-1" /> Paciente</>
                )}
              </Badge>
            </div>

            {/* Login Method Toggle */}
            <div className="flex gap-2">
              <Button
                variant={loginMethod === 'email' ? 'default' : 'outline'}
                onClick={() => setLoginMethod('email')}
                className="flex-1"
                size="sm"
              >
                <Mail className="mr-2 size-4" />
                Email
              </Button>
              <Button
                variant={loginMethod === 'wallet' ? 'default' : 'outline'}
                onClick={() => setLoginMethod('wallet')}
                className="flex-1"
                size="sm"
              >
                <Smartphone className="mr-2 size-4" />
                Billetera
              </Button>
            </div>

            {/* Login Form */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedRole === 'doctor' ? (
                    <Stethoscope className="size-5 text-primary" />
                  ) : (
                    <User className="size-5 text-primary" />
                  )}
                  {loginMethod === 'email' ? 'Iniciar Sesión' : 'Conectar Billetera'}
                </CardTitle>
                <CardDescription>
                  {loginMethod === 'email'
                    ? 'Ingresa con tu correo y contraseña'
                    : 'Auténticate con MetaMask o Trust Wallet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loginMethod === 'email' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Mail className="size-4 text-primary" />
                          Correo electrónico
                        </FieldLabel>
                        <Input
                          name="email"
                          type="email"
                          placeholder={selectedRole === 'doctor' ? 'doctor@email.com' : 'paciente@email.com'}
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </Field>
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
                    </FieldGroup>
                    <Button type="submit" disabled={isLoading} size="lg" className="w-full">
                      {isLoading ? 'Ingresando...' : `Entrar como ${selectedRole === 'doctor' ? 'Doctor' : 'Paciente'}`}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <Button
                      onClick={handleWalletLogin}
                      disabled={isLoading}
                      size="lg"
                      className="w-full h-12 text-base"
                    >
                      <Smartphone className="mr-2 size-5" />
                      {isLoading ? 'Conectando...' : 'Conectar con MetaMask'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Asegúrate de estar en la red Polygon o Arbitrum
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Register link */}
            {selectedRole === 'doctor' && (
              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes cuenta médica?{' '}
                <a href="/doctor/register" className="text-primary hover:underline">
                  Crear cuenta
                </a>
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Tus datos están protegidos con cifrado AES-256 y blockchain
        </p>
      </div>
    </div>
  )
}
