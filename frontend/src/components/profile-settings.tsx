'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Edit2, Camera, Save, X, Briefcase, Heart, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Field, FieldLabel } from '@/components/ui/field'
import { useToast } from '@/hooks/use-toast'
import { useProfile } from '@/hooks/useProfile'
import { useWallet } from '@/contexts/wallet-context'

interface ProfileSettingsProps {
  userName?: string
}

export function ProfileSettings({ userName }: ProfileSettingsProps) {
  const { walletAddress } = useWallet()
  const { profile, loading, updateProfile } = useProfile(walletAddress)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    blood_type: '',
    allergies: ''
  })
  
  const { toast } = useToast()

  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        occupation: profile.occupation || '',
        blood_type: profile.blood_type || '',
        allergies: profile.allergies || ''
      })
    }
  }, [profile, isEditing])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile(formData)
      setIsEditing(false)
      toast({
        title: 'Perfil actualizado',
        description: 'Los cambios han sido guardados en la red.',
      })
    } catch (err) {
      toast({
        title: 'Error al actualizar',
        description: 'Hubo un problema guardando tu perfil.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        occupation: profile.occupation || '',
        blood_type: profile.blood_type || '',
        allergies: profile.allergies || ''
      })
    }
  }

  if (!walletAddress) {
    return (
      <Card className="card-premium opacity-60">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <User className="size-12 text-foreground/20 mb-4" />
          <p className="text-foreground/40 font-bold uppercase tracking-widest text-sm">
            Conecta tu wallet para ver y editar tu perfil.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="card-premium">
        <CardContent className="p-12 text-center text-foreground/40 font-bold uppercase tracking-widest text-sm animate-pulse">
          Cargando configuración de perfil...
        </CardContent>
      </Card>
    )
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
              <AvatarFallback className="bg-gradient-electric text-white text-2xl font-black">
                {formData.full_name ? formData.full_name.substring(0,2).toUpperCase() : 'US'}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute -bottom-2 -right-2 size-8 rounded-full bg-white shadow-md text-slate-800 hover:text-cyan-600"
              >
                <Camera className="size-4" />
              </Button>
            )}
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{formData.full_name || 'Nuevo Usuario'}</h3>
            <p className="text-sm text-foreground/50 font-bold mt-1">Paciente principal • Módulo Blockchain</p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-emerald-500/10 text-emerald-500 border-0 font-bold tracking-widest uppercase text-[10px]">Verificado</Badge>
              <Badge className="bg-cyan-500/10 text-cyan-500 border-0 font-bold tracking-widest uppercase text-[10px]">Asegurado</Badge>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Form Fields */}
        <div className="grid gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel className="flex items-center gap-2 text-foreground">
                <User className="size-4 text-cyan-500" />
                Nombre completo
              </FieldLabel>
              <Input 
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-foreground/5 border-transparent text-foreground/70 font-semibold' : 'bg-background border-cyan-500/50 text-foreground'}
              />
            </Field>
            <Field>
              <FieldLabel className="flex items-center gap-2 text-foreground">
                <Mail className="size-4 text-cyan-500" />
                Correo electrónico
              </FieldLabel>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-foreground/5 border-transparent text-foreground/70 font-semibold' : 'bg-background border-cyan-500/50 text-foreground'}
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel className="flex items-center gap-2 text-foreground">
                <Phone className="size-4 text-cyan-500" />
                Teléfono
              </FieldLabel>
              <Input 
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-foreground/5 border-transparent text-foreground/70 font-semibold' : 'bg-background border-cyan-500/50 text-foreground'}
              />
            </Field>
            <Field>
              <FieldLabel className="flex items-center gap-2 text-foreground">
                <Briefcase className="size-4 text-cyan-500" />
                Ocupación
              </FieldLabel>
              <Input 
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-foreground/5 border-transparent text-foreground/70 font-semibold' : 'bg-background border-cyan-500/50 text-foreground'}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel className="flex items-center gap-2 text-foreground">
              <MapPin className="size-4 text-cyan-500" />
              Dirección
            </FieldLabel>
            <Input 
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? 'bg-foreground/5 border-transparent text-foreground/70 font-semibold' : 'bg-background border-cyan-500/50 text-foreground'}
            />
          </Field>

          <Separator className="bg-border" />

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel className="flex items-center gap-2 text-foreground">
                <Heart className="size-4 text-cyan-500" />
                Tipo de sangre
              </FieldLabel>
              <Input 
                value={formData.blood_type}
                onChange={(e) => handleChange('blood_type', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-foreground/5 border-transparent text-foreground/70 font-semibold' : 'bg-background border-cyan-500/50 text-foreground'}
                maxLength={3}
                placeholder="Ej: O+"
              />
            </Field>
            <Field>
              <FieldLabel className="flex items-center gap-2 text-foreground">
                <Activity className="size-4 text-cyan-500" />
                Alergias
              </FieldLabel>
              <Input 
                value={formData.allergies}
                onChange={(e) => handleChange('allergies', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? 'bg-foreground/5 border-transparent text-foreground/70 font-semibold' : 'bg-background border-cyan-500/50 text-foreground'}
                placeholder="Ej: Penicilina, polen, etc."
              />
            </Field>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="btn-outline-premium text-foreground hover:bg-foreground/5">
              <X className="size-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="btn-premium">
              <Save className="size-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}