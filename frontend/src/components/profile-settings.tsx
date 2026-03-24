'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { User, Mail, Phone, MapPin, Save, Briefcase, Heart, Activity, CreditCard, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Field, FieldLabel } from '@/components/ui/field'
import { useToast } from '@/hooks/use-toast'
import { useProfile } from '@/hooks/useProfile'
import { useWallet } from '@/contexts/wallet-context'

export interface ProfileSettingsRef {
  save: () => Promise<void>
  isSaving: boolean
}

interface ProfileSettingsProps {
  userName?: string
}

export const ProfileSettings = forwardRef<ProfileSettingsRef, ProfileSettingsProps>(
  function ProfileSettings({ userName }, ref) {
    const { walletAddress } = useWallet()
    const { profile, loading, updateProfile } = useProfile(walletAddress)
    const { toast } = useToast()

    const [isSaving, setIsSaving] = useState(false)
    const [savedOk, setSavedOk] = useState(false)
    const [formData, setFormData] = useState({
      full_name: '',
      email: '',
      phone: '',
      address: '',
      occupation: '',
      blood_type: '',
      allergies: '',
      cedula_identidad: ''
    })

    // Sincroniza formData con el perfil cargado desde Supabase
    useEffect(() => {
      if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          occupation: profile.occupation || '',
          blood_type: profile.blood_type || '',
          allergies: profile.allergies || '',
          cedula_identidad: profile.cedula_identidad || ''
        })
      }
    }, [profile])

    const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }))
      setSavedOk(false) // Marca como no guardado cuando hay cambios
    }

    const handleSave = async () => {
      if (!walletAddress) {
        toast({
          title: 'Wallet no conectada',
          description: 'Debes conectar tu wallet antes de guardar tu perfil.',
          variant: 'destructive'
        })
        return
      }
      setIsSaving(true)
      try {
        await updateProfile(formData)
        setSavedOk(true)
        toast({
          title: '✅ Perfil guardado',
          description: 'Tu información fue guardada en Supabase correctamente.',
        })
        // Reset el check de guardado después de 3s
        setTimeout(() => setSavedOk(false), 3000)
      } catch (err: any) {
        toast({
          title: 'Error al guardar',
          description: err?.message || 'Hubo un problema guardando tu perfil. Intenta de nuevo.',
          variant: 'destructive'
        })
      } finally {
        setIsSaving(false)
      }
    }

    // Expone save() al componente padre via ref
    useImperativeHandle(ref, () => ({
      save: handleSave,
      isSaving,
    }), [formData, isSaving, walletAddress])

    /* ─── Estado: sin wallet ─── */
    if (!walletAddress) {
      return (
        <Card className="card-premium">
          <CardContent className="p-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="rounded-full bg-foreground/5 p-6 border border-border">
              <User className="size-12 text-foreground/20" />
            </div>
            <div>
              <h4 className="text-lg font-black text-foreground tracking-tight">Wallet no conectada</h4>
              <p className="text-sm text-foreground/50 font-bold mt-1 max-w-xs mx-auto">
                Conecta tu wallet para ver y editar tu información personal.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    /* ─── Estado: cargando ─── */
    if (loading) {
      return (
        <Card className="card-premium">
          <CardContent className="p-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-8 text-cyan-500 animate-spin" />
            <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">
              Cargando tu perfil desde Supabase...
            </p>
          </CardContent>
        </Card>
      )
    }

    const inputClass = 'bg-background border-border focus:border-cyan-500/70 text-foreground font-medium transition-colors'
    const labelClass = 'flex items-center gap-2 text-foreground/70 font-semibold text-sm mb-1.5'

    return (
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="size-5 text-azul-electrico" />
              <CardTitle>Información Personal</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {savedOk && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="size-3" /> Guardado
                </Badge>
              )}
              <Badge className="bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-bold text-[10px] uppercase tracking-widest">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Tu información personal y datos médicos · sincronizados con Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-2xl bg-foreground/[0.02] border border-border">
            <Avatar className="size-20 ring-4 ring-cyan-500/20 flex-shrink-0">
              <AvatarFallback className="bg-gradient-electric text-white text-xl font-black">
                {formData.full_name ? formData.full_name.substring(0, 2).toUpperCase() : 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight truncate">
                {formData.full_name || 'Nuevo Usuario'}
              </h3>
              <p className="text-sm text-foreground/50 font-bold mt-0.5">Paciente principal · Módulo Blockchain</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 font-bold tracking-widest uppercase text-[10px]">Verificado</Badge>
                <Badge className="bg-cyan-500/10 text-cyan-500 border-0 font-bold tracking-widest uppercase text-[10px]">Asegurado</Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Campos del formulario */}
          <div className="grid gap-5">
            {/* Nombre + Cédula */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel className={labelClass}>
                  <User className="size-4 text-cyan-500" /> Nombre completo
                </FieldLabel>
                <Input value={formData.full_name} onChange={e => handleChange('full_name', e.target.value)} className={inputClass} placeholder="Ej: Luis Sandoval" />
              </Field>
              <Field>
                <FieldLabel className={labelClass}>
                  <CreditCard className="size-4 text-cyan-500" /> Cédula de Identidad
                </FieldLabel>
                <Input value={formData.cedula_identidad} onChange={e => handleChange('cedula_identidad', e.target.value)} className={inputClass} placeholder="Ej: 12345678" />
              </Field>
            </div>

            {/* Email + Ocupación */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel className={labelClass}>
                  <Mail className="size-4 text-cyan-500" /> Correo electrónico
                </FieldLabel>
                <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={inputClass} placeholder="correo@ejemplo.com" />
              </Field>
              <Field>
                <FieldLabel className={labelClass}>
                  <Briefcase className="size-4 text-cyan-500" /> Ocupación
                </FieldLabel>
                <Input value={formData.occupation} onChange={e => handleChange('occupation', e.target.value)} className={inputClass} placeholder="Ej: Desarrollador" />
              </Field>
            </div>

            {/* Teléfono */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel className={labelClass}>
                  <Phone className="size-4 text-cyan-500" /> Teléfono
                </FieldLabel>
                <Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} className={inputClass} placeholder="Ej: 70905110" />
              </Field>
            </div>

            {/* Dirección */}
            <Field>
              <FieldLabel className={labelClass}>
                <MapPin className="size-4 text-cyan-500" /> Dirección
              </FieldLabel>
              <Input value={formData.address} onChange={e => handleChange('address', e.target.value)} className={inputClass} placeholder="Ej: Av. Simons Bolívar, Calle 4" />
            </Field>

            <Separator className="bg-border/50" />

            {/* Tipo de Sangre + Alergias */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel className={labelClass}>
                  <Heart className="size-4 text-red-400" /> Tipo de sangre
                </FieldLabel>
                <Input value={formData.blood_type} onChange={e => handleChange('blood_type', e.target.value)} className={inputClass} maxLength={3} placeholder="Ej: O+" />
              </Field>
              <Field>
                <FieldLabel className={labelClass}>
                  <Activity className="size-4 text-orange-400" /> Alergias
                </FieldLabel>
                <Input value={formData.allergies} onChange={e => handleChange('allergies', e.target.value)} className={inputClass} placeholder="Ej: Penicilina, polen..." />
              </Field>
            </div>
          </div>

          {/* Botón guardar */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-premium h-12 px-8 rounded-2xl shadow-lg shadow-cyan-500/20 min-w-[180px]"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : savedOk ? (
                <>
                  <CheckCircle2 className="size-4 mr-2 text-emerald-300" />
                  ¡Guardado!
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
)