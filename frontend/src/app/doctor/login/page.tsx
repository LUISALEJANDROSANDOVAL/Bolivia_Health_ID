'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { Stethoscope, Lock, Smartphone, Mail, ArrowLeft } from 'lucide-react'

export default function DoctorLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'email' | 'wallet'>('email')
  const router = useRouter()
  const { doctorConnect } = useDoctorAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    doctorConnect()
    router.push('/doctor')
    setIsLoading(false)
  }

  const handleWalletConnect = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    doctorConnect()
    router.push('/doctor')
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Panel Médico</h1>
            <p className="text-muted-foreground">Bolivia Health ID - Acceso Profesional</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={loginMethod === 'email' ? 'default' : 'outline'}
            onClick={() => setLoginMethod('email')}
            className="flex-1"
          >
            <Mail className="mr-2 size-4" />
            Email
          </Button>
          <Button
            variant={loginMethod === 'wallet' ? 'default' : 'outline'}
            onClick={() => setLoginMethod('wallet')}
            className="flex-1"
          >
            <Smartphone className="mr-2 size-4" />
            Billetera
          </Button>
        </div>

        {loginMethod === 'email' ? (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="size-5 text-primary" />
                Iniciar Sesión
              </CardTitle>
              <CardDescription>
                Ingresa con tu correo y contraseña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <FieldGroup>
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="size-5 text-primary" />
                Conectar Billetera
              </CardTitle>
              <CardDescription>
                Auténticate con tu wallet MetaMask o Trust Wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleWalletConnect}
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Por qué conectar una billetera?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="rounded-full bg-primary/10 p-2 h-fit">
                <Lock className="size-4 text-primary" />
              </div>
              <p>Firmatura criptográfica de diagnósticos y recetas</p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-full bg-primary/10 p-2 h-fit">
                <Lock className="size-4 text-primary" />
              </div>
              <p>Acceso seguro a historiales encriptados en IPFS</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/doctor/register" className="text-primary hover:underline">
            Crear Cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}
