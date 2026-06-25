'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { useWallet } from '@/contexts/wallet-context'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Stethoscope,
  User,
  Mail,
  Lock,
  Smartphone,
  ShieldCheck,
  Shield,
  Globe,
  Briefcase,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Role = 'paciente' | 'doctor' | 'admin' | 'secretaria' | null
type LoginMethod = 'email' | 'google'

export default function LoginPage() {
  const router = useRouter()
  const { isDoctorAuthenticated } = useDoctorAuth()
  const { isConnected, connect } = useWallet()

  // La redirección automática se ha eliminado para que el usuario pueda elegir explícitamente cuándo entrar.

  const [selectedRole, setSelectedRole] = useState<Role>('paciente')
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdminLoading, setIsAdminLoading] = useState(false)
  const [dialogRole, setDialogRole] = useState<'admin' | 'secretaria'>('secretaria')

  const handleDialogLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdminLoading(true)

    try {
      // Llamar a nuestra propia API route (mismo dominio = no puede ser bloqueado)
      // El servidor se encarga de autenticar con Supabase
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          role: dialogRole,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al iniciar sesión')
      }

      // Establecer la sesión en el cliente de Supabase con los tokens del servidor
      await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      })

      // Redirigir con recarga completa para que la página destino cargue la sesión limpia
      if (dialogRole === 'secretaria') {
        toast.success('Sesión iniciada como Secretaría')
        setIsAdminModalOpen(false)
        window.location.href = '/secretaria'
      } else {
        toast.success('Sesión iniciada como Administrador')
        setIsAdminModalOpen(false)
        window.location.href = '/admin'
      }
    } catch (err: any) {
      console.error('Admin/Secretaria login error:', err)
      toast.error(err.message || 'Error al iniciar sesión')
    } finally {
      setIsAdminLoading(false)
    }
  }
  const [showAuth, setShowAuth] = useState(false)
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
    
    localStorage.setItem('lastSessionPassword', formData.password)
    
    if (selectedRole === 'doctor') {
      router.push('/doctor')
    } else {
      localStorage.setItem('patientSession', 'true')
      router.push('/dashboard')
    }
    setIsLoading(false)
  }

  const handleWalletLogin = async () => {
    setIsLoading(true)
    if (selectedRole === 'paciente') {
      localStorage.setItem('patientSession', 'true')
    }
    await connect() // Dispara el login de Google con Particle
    
    // Redirección manual solo después de interactuar con el botón
    if (selectedRole === 'doctor') {
      router.push('/doctor')
    } else if (selectedRole === 'secretaria') {
      router.push('/secretaria')
    } else {
      router.push('/dashboard')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Logo / Header */}
        <div className="text-center space-y-3 relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="ghost"
              size="icon"
              className="opacity-25 hover:opacity-100 transition-opacity"
              onClick={() => setIsAdminModalOpen(true)}
              title="Administrador"
            >
              <Shield className="size-5 text-muted-foreground" />
            </Button>
          </div>

          <div className="flex justify-center">
            <img src="/logo.png" alt="Bolivia Health ID Logo" className="h-20 w-auto object-contain dark:hidden" />
            <img src="/logo-dark.png" alt="Bolivia Health ID Logo" className="h-20 w-auto object-contain hidden dark:block" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bolivia Health ID</h1>
            <p className="text-muted-foreground">Sistema de Salud Descentralizado</p>
          </div>
          <div className="flex justify-center gap-2">
            <Badge 
              variant="outline" 
              className="text-xs select-none"
            >
              <ShieldCheck className="size-3 mr-1" />
              Blockchain Seguro
            </Badge>
            <Badge variant="outline" className="text-xs gap-1 flex items-center">
              <Globe className="size-3 text-primary" />
              Red Avalanche
            </Badge>
          </div>
        </div>

        {/* Role Selection */}
        {!showAuth ? (
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Selecciona tu perfil para continuar
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto w-full">
              {/* Paciente */}
              <button
                onClick={() => setSelectedRole('paciente')}
                className={`group flex flex-col items-center gap-4 rounded-2xl border-2 p-5 transition-all focus:outline-none ${
                  selectedRole === 'paciente'
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className={`rounded-xl p-3.5 transition-colors ${selectedRole === 'paciente' ? 'bg-blue-500/20' : 'bg-blue-500/10 group-hover:bg-blue-500/20'}`}>
                  <User className="size-6 text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm text-foreground">Soy Paciente</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Accede a tus datos</p>
                </div>
              </button>

              {/* Doctor */}
              <button
                onClick={() => setSelectedRole('doctor')}
                className={`group flex flex-col items-center gap-4 rounded-2xl border-2 p-5 transition-all focus:outline-none ${
                  selectedRole === 'doctor'
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className={`rounded-xl p-3.5 transition-colors ${selectedRole === 'doctor' ? 'bg-green-500/20' : 'bg-green-500/10 group-hover:bg-green-500/20'}`}>
                  <Stethoscope className="size-6 text-green-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm text-foreground">Soy Doctor</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Panel médico</p>
                </div>
              </button>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                size="lg" 
                className="w-full h-12 text-base font-semibold"
                onClick={() => setShowAuth(true)}
              >
                Ingresar como Usuario Existente
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-12 text-base font-semibold"
                onClick={() => {
                  if (selectedRole === 'doctor') {
                    router.push('/register?role=medico')
                  } else {
                    router.push('/register?role=paciente')
                  }
                }}
              >
                Crear Usuario Nuevo
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back / Role indicator */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowAuth(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Cambiar rol
              </button>
              <Badge variant={selectedRole === 'doctor' ? 'default' : selectedRole === 'admin' ? 'destructive' : selectedRole === 'secretaria' ? 'outline' : 'secondary'}>
                {selectedRole === 'doctor' ? (
                  <><Stethoscope className="size-3 mr-1" /> Panel Médico</>
                ) : selectedRole === 'admin' ? (
                  <><ShieldCheck className="size-3 mr-1" /> Administrador</>
                ) : selectedRole === 'secretaria' ? (
                  <><Briefcase className="size-3 mr-1" /> Secretaría</>
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
                variant={loginMethod === 'google' ? 'default' : 'outline'}
                onClick={() => setLoginMethod('google')}
                className="flex-1"
                size="sm"
              >
                <Smartphone className="mr-2 size-4" />
                Google
              </Button>
            </div>

            {/* Login Form */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedRole === 'doctor' ? (
                    <Stethoscope className="size-5 text-primary" />
                  ) : selectedRole === 'secretaria' ? (
                    <Briefcase className="size-5 text-amber-500" />
                  ) : (
                    <User className="size-5 text-primary" />
                  )}
                  {loginMethod === 'email' ? 'Iniciar Sesión' : 'Conectar con Google'}
                </CardTitle>
                <CardDescription>
                  {loginMethod === 'email'
                    ? 'Ingresa con tu correo y contraseña'
                    : 'Autentícate de forma segura con tu cuenta de Google'}
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
                          placeholder={selectedRole === 'doctor' ? 'doctor@email.com' : selectedRole === 'secretaria' ? 'secretaria@boliviahealth.com' : 'paciente@email.com'}
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
                      {isLoading ? 'Ingresando...' : `Entrar como ${selectedRole === 'doctor' ? 'Doctor' : selectedRole === 'admin' ? 'Administrador' : selectedRole === 'secretaria' ? 'Secretaría' : 'Paciente'}`}
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
                      {isLoading ? 'Conectando...' : 'Continuar con Google'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Inicio de sesión rápido y seguro mediante tu cuenta de Google.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Register link */}
            {selectedRole === 'doctor' && (
              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes cuenta médica?{' '}
                <a href="/register?role=medico" className="text-primary hover:underline">
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

      {/* Admin/Secretaria Auth Modal */}
      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleDialogLogin}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                Control de Acceso Administrativo
              </DialogTitle>
              <DialogDescription>
                Ingresa tus credenciales autorizadas para acceder al sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Tab Selector */}
              <div className="flex bg-muted p-1 rounded-lg gap-1 border">
                <button
                  type="button"
                  onClick={() => setDialogRole('secretaria')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    dialogRole === 'secretaria' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Secretaría
                </button>
                <button
                  type="button"
                  onClick={() => setDialogRole('admin')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    dialogRole === 'admin' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Administrador
                </button>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Correo electrónico</label>
                <Input
                  type="email"
                  placeholder={dialogRole === 'admin' ? 'admin@boliviahealth.com' : 'secretaria@boliviahealth.com'}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Contraseña</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isAdminLoading}>
                {isAdminLoading ? 'Verificando...' : `Ingresar como ${dialogRole === 'admin' ? 'Administrador' : 'Secretaría'}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
