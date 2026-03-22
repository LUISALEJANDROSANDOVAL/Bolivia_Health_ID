'use client'

import { useState } from 'react'
import { 
  Bell, 
  Mail, 
  Smartphone, 
  AlertCircle, 
  FileText, 
  Users,
  Shield,
  MessageSquare,
  Calendar,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

// Definir tipos para las categorías
type NotificationCategory = 'medicalUpdates' | 'appointments' | 'securityAlerts' | 'sharingRequests' | 'promotions'

interface NotificationChannel {
  enabled: boolean
  categories: Record<NotificationCategory, boolean>
}

interface NotificationSettings {
  email: NotificationChannel
  push: NotificationChannel
  inApp: NotificationChannel
}

export function NotificationSettings() {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: {
      enabled: true,
      categories: {
        medicalUpdates: true,
        appointments: true,
        securityAlerts: true,
        sharingRequests: true,
        promotions: false
      }
    },
    push: {
      enabled: false,
      categories: {
        medicalUpdates: true,
        appointments: true,
        securityAlerts: true,
        sharingRequests: true,
        promotions: false
      }
    },
    inApp: {
      enabled: true,
      categories: {
        medicalUpdates: true,
        appointments: true,
        securityAlerts: true,
        sharingRequests: true,
        promotions: false
      }
    }
  })

  const { toast } = useToast()

  const handleToggleChannel = (channel: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        enabled: !prev[channel].enabled
      }
    }))
    toast({
      title: `${channel === 'email' ? 'Email' : channel === 'push' ? 'Push' : 'In-App'} ${!notifications[channel].enabled ? 'activado' : 'desactivado'}`,
      description: `Las notificaciones por ${channel === 'email' ? 'correo' : channel === 'push' ? 'push' : 'dentro de la app'} han sido ${!notifications[channel].enabled ? 'activadas' : 'desactivadas'}`,
    })
  }

  const handleToggleCategory = (channel: keyof NotificationSettings, category: NotificationCategory) => {
    setNotifications(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        categories: {
          ...prev[channel].categories,
          [category]: !prev[channel].categories[category]
        }
      }
    }))
  }

  const notificationCategories = [
    { id: 'medicalUpdates' as const, label: 'Actualizaciones médicas', icon: FileText, description: 'Nuevos resultados y registros' },
    { id: 'appointments' as const, label: 'Citas médicas', icon: Calendar, description: 'Recordatorios y confirmaciones' },
    { id: 'securityAlerts' as const, label: 'Alertas de seguridad', icon: Shield, description: 'Inicios de sesión y cambios' },
    { id: 'sharingRequests' as const, label: 'Solicitudes de acceso', icon: Users, description: 'Permisos para ver tus datos' },
    { id: 'promotions' as const, label: 'Promociones y novedades', icon: MessageSquare, description: 'Ofertas y actualizaciones' }
  ]

  const notificationChannels = [
    { id: 'email' as const, label: 'Correo electrónico', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'push' as const, label: 'Notificaciones push', icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'inApp' as const, label: 'Dentro de la app', icon: Bell, color: 'text-emerald-500', bg: 'bg-emerald-50' }
  ]

  return (
    <div className="space-y-6">
      {notificationChannels.map((channel) => (
        <Card key={channel.id} className="card-premium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`rounded-lg p-2 ${channel.bg}`}>
                  <channel.icon className={`size-5 ${channel.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{channel.label}</CardTitle>
                  <CardDescription>
                    Configura las notificaciones que recibes por {channel.label.toLowerCase()}
                  </CardDescription>
                </div>
              </div>
              <Switch 
                checked={notifications[channel.id].enabled}
                onCheckedChange={() => handleToggleChannel(channel.id)}
              />
            </div>
          </CardHeader>
          {notifications[channel.id].enabled && (
            <CardContent className="space-y-4">
              <Separator />
              {notificationCategories.map((category) => {
                const CategoryIcon = category.icon
                const isEnabled = notifications[channel.id].categories[category.id]
                return (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <CategoryIcon className="size-4 text-gris-grafito mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-azul-profundo">{category.label}</p>
                        <p className="text-xs text-gris-grafito">{category.description}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleCategory(channel.id, category.id)}
                    />
                  </div>
                )
              })}
            </CardContent>
          )}
        </Card>
      ))}

      {/* Resumen de configuración */}
      <Card className="bg-gradient-electric text-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="size-8 text-white/80" />
            <div>
              <h3 className="font-semibold text-lg">Resumen de notificaciones</h3>
              <p className="text-sm text-white/80 mt-1">
                Recibirás notificaciones de {Object.values(notifications).filter(n => n.enabled).length} de 3 canales
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(notifications).map(([key, value]) => (
                  value.enabled && (
                    <Badge key={key} className="bg-white/20 text-white border-0">
                      {key === 'email' ? 'Email' : key === 'push' ? 'Push' : 'In-App'}
                    </Badge>
                  )
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}