'use client'

import { useState } from 'react'
import { 
  Lock, 
  Eye, 
  Users, 
  FileText, 
  Globe, 
  Shield,
  CheckCircle2,
  AlertTriangle,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

export function PrivacySettings() {
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    shareMedicalRecords: false,
    shareWithResearchers: false,
    allowDataExport: true,
    anonymizedData: true,
    showOnlineStatus: true,
    allowMessagesFrom: 'contacts'
  })

  const { toast } = useToast()

  const handleToggle = (setting: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }))
    toast({
      title: 'Configuración actualizada',
      description: 'Los cambios han sido aplicados correctamente',
    })
  }

  const visibilityOptions = [
    { value: 'public', label: 'Público', description: 'Cualquiera puede ver tu perfil' },
    { value: 'private', label: 'Privado', description: 'Solo tú puedes ver tu perfil' },
    { value: 'contacts', label: 'Contactos', description: 'Solo tus contactos médicos pueden ver tu perfil' }
  ]

  return (
    <div className="space-y-6">
      {/* Visibilidad del perfil */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="size-5 text-azul-electrico" />
            <CardTitle>Visibilidad del perfil</CardTitle>
          </div>
          <CardDescription>Controla quién puede ver tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {visibilityOptions.map((option) => (
              <div
                key={option.value}
                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  privacySettings.profileVisibility === option.value
                    ? 'border-azul-electrico bg-azul-electrico/5'
                    : 'border-gray-200 hover:border-azul-electrico/30'
                }`}
                onClick={() => {
                  setPrivacySettings(prev => ({ ...prev, profileVisibility: option.value }))
                  toast({
                    title: 'Visibilidad actualizada',
                    description: `Tu perfil ahora es ${option.label.toLowerCase()}`,
                  })
                }}
              >
                <div>
                  <p className="font-medium text-azul-profundo">{option.label}</p>
                  <p className="text-xs text-gris-grafito">{option.description}</p>
                </div>
                {privacySettings.profileVisibility === option.value && (
                  <CheckCircle2 className="size-5 text-azul-electrico" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Datos médicos */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-azul-electrico" />
            <CardTitle>Datos médicos</CardTitle>
          </div>
          <CardDescription>Controla cómo se comparten tus datos médicos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-azul-profundo">Compartir registros médicos</p>
              <p className="text-xs text-gris-grafito">Permitir que médicos autorizados accedan a tus registros</p>
            </div>
            <Switch 
              checked={privacySettings.shareMedicalRecords}
              onCheckedChange={() => handleToggle('shareMedicalRecords')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-azul-profundo">Compartir con investigadores</p>
              <p className="text-xs text-gris-grafito">Contribuir con datos anónimos para investigación médica</p>
            </div>
            <Switch 
              checked={privacySettings.shareWithResearchers}
              onCheckedChange={() => handleToggle('shareWithResearchers')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-azul-profundo">Datos anonimizados</p>
              <p className="text-xs text-gris-grafito">Eliminar información personal al compartir datos</p>
            </div>
            <Switch 
              checked={privacySettings.anonymizedData}
              onCheckedChange={() => handleToggle('anonymizedData')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacidad de comunicación */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-azul-electrico" />
            <CardTitle>Comunicación</CardTitle>
          </div>
          <CardDescription>Controla cómo interactúan contigo otros usuarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-azul-profundo">Mostrar estado en línea</p>
              <p className="text-xs text-gris-grafito">Permitir que otros vean cuando estás activo</p>
            </div>
            <Switch 
              checked={privacySettings.showOnlineStatus}
              onCheckedChange={() => handleToggle('showOnlineStatus')}
            />
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-azul-profundo mb-2">¿Quién puede enviarte mensajes?</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'everyone', label: 'Todos' },
                { value: 'contacts', label: 'Contactos' },
                { value: 'none', label: 'Nadie' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={privacySettings.allowMessagesFrom === option.value ? 'default' : 'outline'}
                  className={privacySettings.allowMessagesFrom === option.value 
                    ? 'btn-premium' 
                    : 'btn-outline-premium'
                  }
                  onClick={() => {
                    setPrivacySettings(prev => ({ ...prev, allowMessagesFrom: option.value }))
                    toast({
                      title: 'Configuración actualizada',
                      description: `Ahora ${option.label.toLowerCase()} puede enviarte mensajes`,
                    })
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertencia */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Privacidad de datos</h3>
              <p className="text-sm text-amber-700 mt-1">
                Tus datos están protegidos por cifrado AES-256. Los cambios en la configuración de privacidad pueden tardar hasta 5 minutos en aplicarse completamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}