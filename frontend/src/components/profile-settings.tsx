'use client'

import { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit2, 
  Camera, 
  Save,
  X,
  UserCircle,
  Briefcase,
  Heart,
  Activity,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useToast } from '@/hooks/use-toast'

interface ProfileSettingsProps {
  userName?: string
}

export function ProfileSettings({ userName = 'Usuario' }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: userName || 'María García',
    email: 'maria.garcia@email.com',
    phone: '+591 70123456',
    birthDate: '15/05/1990',
    address: 'Av. San Martín 123, La Paz, Bolivia',
    occupation: 'Ingeniera de Sistemas',
    bloodType: 'O+',
    allergies: 'Ninguna conocida'
  })
  const { toast } = useToast()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setIsEditing(false)
    toast({
      title: 'Perfil actualizado',
      description: 'Los cambios han sido guardados correctamente',
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original
  }

  return (
    <Card className="card-premium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="size-5 text-azul-electrico" />
            <CardTitle>Información Personal</CardTitle>
          </div>
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="btn-outline-premium"
            >
              <Edit2 className="size-4 mr-2" />
              Editar perfil
            </Button>
          )}
        </div>
        <CardDescription>Tu información personal y datos médicos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <Avatar className="size-24 ring-4 ring-azul-electrico/20">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-gradient-electric text-white text-2xl">
                {formData.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute -bottom-2 -right-2 size-8 rounded-full bg-white shadow-md"
              >
                <Camera className="size-4" />
              </Button>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-azul-profundo">{formData.fullName}</h3>
            <p className="text-sm text-gris-grafito">Paciente verificado • Miembro desde 2024</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-emerald-50 text-emerald-600 border-0">Verificado</Badge>
              <Badge className="bg-blue-50 text-blue-600 border-0">Premium</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Form Fields */}
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="flex items-center gap-2">
                <User className="size-4 text-azul-electrico" />
                Nombre completo
              </FieldLabel>
              <Input 
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </Field>
            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Mail className="size-4 text-azul-electrico" />
                Correo electrónico
              </FieldLabel>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Phone className="size-4 text-azul-electrico" />
                Teléfono
              </FieldLabel>
              <Input 
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </Field>
            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Calendar className="size-4 text-azul-electrico" />
                Fecha de nacimiento
              </FieldLabel>
              <Input 
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel className="flex items-center gap-2">
              <MapPin className="size-4 text-azul-electrico" />
              Dirección
            </FieldLabel>
            <Input 
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
            />
          </Field>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Briefcase className="size-4 text-azul-electrico" />
                Ocupación
              </FieldLabel>
              <Input 
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
              />
            </Field>
            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Heart className="size-4 text-azul-electrico" />
                Tipo de sangre
              </FieldLabel>
              <Input 
                value={formData.bloodType}
                onChange={(e) => handleChange('bloodType', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50' : ''}
                maxLength={3}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel className="flex items-center gap-2">
              <Activity className="size-4 text-azul-electrico" />
              Alergias
            </FieldLabel>
            <Input 
              value={formData.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? 'bg-gray-50' : ''}
              placeholder="Ej: Penicilina, polen, etc."
            />
          </Field>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCancel} className="btn-outline-premium">
              <X className="size-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} className="btn-premium">
              <Save className="size-4 mr-2" />
              Guardar cambios
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}