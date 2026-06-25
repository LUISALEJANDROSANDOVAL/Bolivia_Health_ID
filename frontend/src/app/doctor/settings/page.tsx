'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Shield, 
  Database, 
  Lock, 
  CreditCard, 
  Bell,
  User,
  Globe,
  Save,
  Fingerprint,
  RefreshCw
} from 'lucide-react'
import { useWallet, formatAddress } from '@/contexts/wallet-context'
import { toast } from 'sonner'
import { SecuritySettings } from '@/components/security-settings'
import { NotificationSettings } from '@/components/notification-settings'
import { PrivacySettings } from '@/components/privacy-settings'
import { BlockchainSettings } from '@/components/blockchain-settings'
import { DataManagement } from '@/components/data-management'
import { DoctorProfileSettings, DoctorProfileSettingsRef } from '@/components/doctor-profile-settings'

export default function DoctorSettingsPage() {
  const { isConnected, walletAddress } = useWallet()
  const [stats, setStats] = useState([
    {
      icon: Shield,
      label: 'Nivel de seguridad',
      value: 'Alto',
      description: '2FA activada',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    {
      icon: Database,
      label: 'Almacenamiento',
      value: 'Calculando...',
      description: 'de 20 GB',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      icon: Lock,
      label: 'Cifrado',
      value: 'AES-256',
      description: 'End-to-end',
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    {
      icon: CreditCard,
      label: 'Wallet',
      value: isConnected ? 'Conectada' : 'Desconectada',
      description: isConnected ? 'Red Avalanche' : 'Requiere conexión',
      color: isConnected ? 'text-emerald-500' : 'text-amber-500',
      bg: isConnected ? 'bg-emerald-50' : 'bg-amber-50'
    }
  ])

  const [activeTab, setActiveTab] = useState('perfil')
  const [copied, setCopied] = useState(false)


  // Actualizar stats reales
  const fetchRealStats = async () => {
    if (!walletAddress) return

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (!profile) return

      const { count: medicalCount } = await supabase
        .from('medical_background')
        .select('id', { count: 'exact' })
        .eq('doctor_id', profile.id)

      const usedGB = (((medicalCount || 0) * 0.15) / 1024 + 0.12).toFixed(1)

      setStats(prev => {
        const newStats = [...prev]
        newStats[1] = {
          ...newStats[1],
          value: `${usedGB} GB`,
          description: `${medicalCount || 0} registros médicos`
        }
        newStats[3] = {
          ...newStats[3],
          value: isConnected ? 'Conectada' : 'Desconectada',
          description: isConnected ? 'Red Avalanche' : 'Requiere conexión',
          color: isConnected ? 'text-emerald-500' : 'text-amber-500',
          bg: isConnected ? 'bg-emerald-50' : 'bg-amber-50'
        }
        return newStats
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  useEffect(() => {
    fetchRealStats()
  }, [walletAddress, isConnected])

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast.success('Dirección copiada', {
        description: 'La dirección de wallet ha sido copiada al portapapeles'
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }



  return (
    <DoctorLayout>
      <div className="space-y-8 animate-slide-in p-6">
        
        {/* Header con estadísticas */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
              <Settings className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Configuración de Médico</h1>
              <p className="text-sm text-gris-grafito">
                Gestiona tu perfil profesional, seguridad y preferencias de la plataforma
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {stats.map((stat, idx) => (
              <Card key={idx} className="card-premium p-4 hover:border-azul-electrico/30 transition-all">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl p-2 ${stat.bg}`}>
                      <stat.icon className={`size-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-azul-profundo">{stat.value}</p>
                    <p className="text-xs text-gris-grafito mt-0.5">{stat.label}</p>
                    <p className="text-xs text-gris-grafito/60 mt-0.5">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Banner de seguridad */}
        <div className="bg-gradient-electric rounded-2xl p-5 text-white overflow-hidden relative">
          <Lock className="size-32 text-white/10 absolute -right-4 -top-4 select-none pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg" />
                <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white/20 to-white/10">
                  <Fingerprint className="size-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Protege tu cuenta profesional</h3>
                <p className="text-sm text-white/80 mt-1">
                  Activa la autenticación de dos factores para mayor seguridad y control de acceso.
                </p>
              </div>
            </div>
            <Button className="bg-white text-azul-electrico hover:bg-white/90">
              <Shield className="size-4 mr-2" />
              Configurar 2FA
            </Button>
          </div>
        </div>

        {/* Tabs de configuración */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white/50 dark:bg-azul-profundo/50 backdrop-blur-md p-1.5 rounded-2xl border border-azul-electrico/10 shadow-sm overflow-x-auto">
            <TabsList className="flex w-full lg:grid lg:grid-cols-6 gap-2 bg-transparent h-auto p-0 border-none">
              <TabsTrigger 
                value="perfil" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <User className="size-4" />
                <span className="font-semibold">Perfil</span>
              </TabsTrigger>
              <TabsTrigger 
                value="seguridad" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Shield className="size-4" />
                <span className="font-semibold">Seguridad</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notificaciones" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Bell className="size-4" />
                <span className="font-semibold">Notificaciones</span>
              </TabsTrigger>
              <TabsTrigger 
                value="privacidad" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Lock className="size-4" />
                <span className="font-semibold">Privacidad</span>
              </TabsTrigger>
              <TabsTrigger 
                value="blockchain" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Globe className="size-4" />
                <span className="font-semibold">Blockchain</span>
              </TabsTrigger>
              <TabsTrigger 
                value="datos" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Database className="size-4" />
                <span className="font-semibold">Datos</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="perfil">
            <DoctorProfileSettings />
          </TabsContent>

          <TabsContent value="seguridad">
            <SecuritySettings />
          </TabsContent>
          
          <TabsContent value="notificaciones">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="privacidad">
            <PrivacySettings />
          </TabsContent>

          <TabsContent value="blockchain">
            <BlockchainSettings 
              isConnected={isConnected}
              walletAddress={walletAddress}
              onCopyAddress={copyAddress}
              copied={copied}
            />
          </TabsContent>

          <TabsContent value="datos">
            <DataManagement />
          </TabsContent>
        </Tabs>



      </div>
    </DoctorLayout>
  )
}
