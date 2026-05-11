'use client'

import { useState, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  User, 
  Bell, 
  Shield, 
  Smartphone, 
  Moon, 
  Globe, 
  Key, 
  Copy, 
  Check,
  Settings,
  Database,
  Lock,
  CreditCard,
  Fingerprint,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Download,
  Trash2,
  Eye,
  Clock,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useWallet, formatAddress } from '@/contexts/wallet-context'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSettings, ProfileSettingsRef } from '@/components/profile-settings'
import { SecuritySettings } from '@/components/security-settings'
import { NotificationSettings } from '@/components/notification-settings'
import { PrivacySettings } from '@/components/privacy-settings'
import { BlockchainSettings } from '@/components/blockchain-settings'
import { DataManagement } from '@/components/data-management'

const settingsStats = [
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
    value: '2.4 GB',
    description: 'de 10 GB',
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
    value: 'Conectada',
    description: 'Red Ethereum',
    color: 'text-amber-500',
    bg: 'bg-amber-50'
  }
]

export default function ConfiguracionPage() {
  const profileRef = useRef<ProfileSettingsRef>(null)
  const { isConnected, walletAddress, userName } = useWallet()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('perfil')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { toast } = useToast()

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast({
        title: 'Dirección copiada',
        description: 'La dirección de wallet ha sido copiada al portapapeles',
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      if (profileRef.current) {
        await profileRef.current.save()
      }
      setLastSaved(new Date())
      toast({
        title: 'Configuración guardada',
        description: 'Todos los cambios han sido sincronizados con Supabase.',
      })
    } catch {
      toast({
        title: 'Error al guardar',
        description: 'Hubo un problema al guardar los cambios.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-in">
        
        {/* Header con estadísticas */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
              <Settings className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-azul-profundo">Configuración</h1>
              <p className="text-sm text-gris-grafito">
                Gestiona tu perfil, seguridad y preferencias de la plataforma
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {settingsStats.map((stat, idx) => (
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
          <div className="absolute right-0 top-0 opacity-10">
            <div className="text-9xl">🔒</div>
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg" />
                <div className="relative rounded-2xl p-4 bg-gradient-to-br from-white/20 to-white/10">
                  <Fingerprint className="size-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl">Protege tu cuenta</h3>
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
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="perfil" className="flex items-center gap-2 data-[state=active]:bg-gradient-electric data-[state=active]:text-white">
              <User className="size-4" />
              <span className="hidden lg:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="flex items-center gap-2 data-[state=active]:bg-gradient-electric data-[state=active]:text-white">
              <Shield className="size-4" />
              <span className="hidden lg:inline">Seguridad</span>
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="flex items-center gap-2 data-[state=active]:bg-gradient-electric data-[state=active]:text-white">
              <Bell className="size-4" />
              <span className="hidden lg:inline">Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger value="privacidad" className="flex items-center gap-2 data-[state=active]:bg-gradient-electric data-[state=active]:text-white">
              <Lock className="size-4" />
              <span className="hidden lg:inline">Privacidad</span>
            </TabsTrigger>
            <TabsTrigger value="blockchain" className="flex items-center gap-2 data-[state=active]:bg-gradient-electric data-[state=active]:text-white">
              <Globe className="size-4" />
              <span className="hidden lg:inline">Blockchain</span>
            </TabsTrigger>
            <TabsTrigger value="datos" className="flex items-center gap-2 data-[state=active]:bg-gradient-electric data-[state=active]:text-white">
              <Database className="size-4" />
              <span className="hidden lg:inline">Datos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <ProfileSettings ref={profileRef} userName={userName || undefined} />
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

        {/* Barra de acciones */}
        <div className="sticky bottom-6 flex items-center justify-end gap-3">
          {lastSaved && (
            <div className="flex items-center gap-2 text-xs text-gris-grafito bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm">
              <RefreshCw className="size-3 text-emerald-500" />
              Última sincronización: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="btn-premium shadow-lg"
          >
            {isSaving ? (
              <>
                <RefreshCw className="size-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Guardar todos los cambios
              </>
            )}
          </Button>
        </div>

      </div>
    </DashboardLayout>
  )
}