'use client'

import { useState } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Settings, 
  Shield, 
  HardDrive, 
  Lock, 
  Wallet, 
  Bell,
  User,
  Globe,
  Database,
  Save,
  ShieldCheck
} from 'lucide-react'

const tabs = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'privacidad', label: 'Privacidad', icon: Lock },
  { id: 'blockchain', label: 'Blockchain', icon: Globe },
  { id: 'datos', label: 'Datos', icon: Database },
]

export default function DoctorSettingsPage() {
  const [activeTab, setActiveTab] = useState('perfil')
  const [walletConnected] = useState(false)

  return (
    <DoctorLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-3">
            <Settings className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">Gestiona tu perfil, seguridad y preferencias de la plataforma</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground">Alto</p>
            <p className="text-xs text-muted-foreground">Nivel de seguridad</p>
            <p className="text-xs text-muted-foreground">2FA activada</p>
          </CardContent></Card>

          <Card><CardContent className="p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <HardDrive className="size-5 text-primary" />
            </div>
            <p className="text-xl font-bold text-primary">2.4 GB</p>
            <p className="text-xs text-muted-foreground">Almacenamiento</p>
            <p className="text-xs text-muted-foreground">de 10 GB</p>
          </CardContent></Card>

          <Card><CardContent className="p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Lock className="size-5 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-foreground">AES-256</p>
            <p className="text-xs text-muted-foreground">Cifrado</p>
            <p className="text-xs text-muted-foreground">End-to-end</p>
          </CardContent></Card>

          <Card><CardContent className="p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-pink-500/10">
              <Wallet className="size-5 text-pink-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{walletConnected ? 'Conectada' : 'Desconectada'}</p>
            <p className="text-xs text-muted-foreground">Wallet</p>
            <p className="text-xs text-muted-foreground">{walletConnected ? 'Red Ethereum' : 'Sin conexión'}</p>
          </CardContent></Card>
        </div>

        {/* 2FA Banner */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <p className="font-semibold">Protege tu cuenta</p>
              <p className="text-sm opacity-80">Activa la autenticación de dos factores para mayor seguridad y control de acceso.</p>
            </div>
          </div>
          <Button variant="outline" className="border-white bg-white text-primary hover:bg-white/90">
            <Shield className="mr-2 size-4" />
            Configurar 2FA
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <Card className="border border-dashed">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-12">
            {!walletConnected ? (
              <>
                <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10">
                  <User className="size-10 text-primary/50" />
                </div>
                <p className="text-lg font-semibold text-foreground">Wallet no conectada</p>
                <p className="text-center text-sm text-muted-foreground">
                  Conecta tu wallet para ver y editar tu<br />información personal.
                </p>
              </>
            ) : (
              <div className="w-full max-w-md space-y-4">
                {activeTab === 'perfil' && (
                  <>
                    <div className="space-y-2">
                      <Label>Nombre Completo</Label>
                      <Input defaultValue="Dr. Luis Fernández" />
                    </div>
                    <div className="space-y-2">
                      <Label>Licencia Médica</Label>
                      <Input defaultValue="LIC-BOL-2024-00815" readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Especialidad</Label>
                      <Input defaultValue="Medicina General" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input defaultValue="dr.fernandez@boliviahealth.id" />
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floating Save Button */}
        <div className="fixed bottom-6 right-6">
          <Button>
            <Save className="mr-2 size-4" />
            Guardar todos los cambios
          </Button>
        </div>
      </div>
    </DoctorLayout>
  )
}
