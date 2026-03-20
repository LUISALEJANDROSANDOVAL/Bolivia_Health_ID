'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Bell, Shield, Smartphone, Moon, Globe, Key, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useWallet, formatAddress } from '@/contexts/wallet-context'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

export default function ConfiguracionPage() {
  const { isConnected, walletAddress, userName } = useWallet()
  const [copied, setCopied] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    accessAlerts: true,
  })

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tu cuenta y preferencias de la aplicación
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  <CardTitle>Perfil</CardTitle>
                </div>
                <CardDescription>Tu información personal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="size-20">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {userName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{userName || 'Usuario'}</h3>
                    <p className="text-sm text-muted-foreground">Paciente verificado</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Cambiar foto
                    </Button>
                  </div>
                </div>
                <Separator />
                <FieldGroup className="gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Nombre completo</FieldLabel>
                      <Input defaultValue={userName || ''} />
                    </Field>
                    <Field>
                      <FieldLabel>Correo electrónico</FieldLabel>
                      <Input defaultValue="maria.garcia@email.com" type="email" />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Teléfono</FieldLabel>
                      <Input defaultValue="+591 70123456" type="tel" />
                    </Field>
                    <Field>
                      <FieldLabel>Fecha de nacimiento</FieldLabel>
                      <Input defaultValue="15/05/1990" type="text" />
                    </Field>
                  </div>
                </FieldGroup>
                <Button>Guardar cambios</Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="size-5 text-primary" />
                  <CardTitle>Notificaciones</CardTitle>
                </div>
                <CardDescription>Configura cómo quieres recibir alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Notificaciones por email</p>
                    <p className="text-xs text-muted-foreground">Recibe actualizaciones en tu correo</p>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Notificaciones push</p>
                    <p className="text-xs text-muted-foreground">Recibe alertas en tu dispositivo</p>
                  </div>
                  <Switch 
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Alertas de acceso</p>
                    <p className="text-xs text-muted-foreground">Notifica cuando alguien acceda a tus datos</p>
                  </div>
                  <Switch 
                    checked={notifications.accessAlerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, accessAlerts: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="size-5 text-primary" />
                  <CardTitle className="text-base">Wallet</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected && walletAddress ? (
                  <>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Dirección</p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 truncate font-mono text-xs text-foreground">
                          {formatAddress(walletAddress)}
                        </code>
                        <Button variant="ghost" size="icon" className="size-8" onClick={copyAddress}>
                          {copied ? (
                            <Check className="size-4 text-success" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-full justify-center gap-2 py-2">
                      <div className="size-2 rounded-full bg-success" />
                      Conectado con Google
                    </Badge>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay wallet conectada</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="size-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Modo oscuro</span>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Idioma</span>
                  </div>
                  <Badge variant="secondary">ES</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">2FA</span>
                  </div>
                  <Badge className="bg-success/10 text-success border-0">Activo</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="border-destructive/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="size-5 text-destructive" />
                  <CardTitle className="text-base">Zona de peligro</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Descargar mis datos
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Eliminar cuenta
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
