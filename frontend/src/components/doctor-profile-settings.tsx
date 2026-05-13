'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { User, Mail, Building, Stethoscope, Save, RefreshCw, CheckCircle2, ShieldCheck, BadgeCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Field, FieldLabel } from '@/components/ui/field'
import { useToast } from '@/hooks/use-toast'
import { useWallet } from '@/contexts/wallet-context'

export interface DoctorProfileSettingsRef {
  save: () => Promise<void>
  isSaving: boolean
}

interface DoctorProfileSettingsProps {
  userName?: string
}

export const DoctorProfileSettings = forwardRef<DoctorProfileSettingsRef, DoctorProfileSettingsProps>(
  function DoctorProfileSettings({ userName }, ref) {
    const { walletAddress } = useWallet()
    const { toast } = useToast()

    const [isSaving, setIsSaving] = useState(false)
    const [savedOk, setSavedOk] = useState(false)
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
      full_name: 'Dr. Luis Fernández',
      email: 'dr.fernandez@boliviahealth.id',
      medical_license: 'LIC-BOL-2024-00815',
      specialty: 'Medicina General',
      hospital: 'Hospital de Clínicas, La Paz',
    })

    // Simula carga inicial
    useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false)
      }, 800)
      return () => clearTimeout(timer)
    }, [])

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
        // Simulando una llamada a API
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSavedOk(true)
        toast({
          title: '✅ Perfil guardado',
          description: 'Tu información profesional fue guardada correctamente.',
        })
        // Reset el check de guardado después de 3s
        setTimeout(() => setSavedOk(false), 3000)
      } catch (err: any) {
        toast({
          title: 'Error al guardar',
          description: 'Hubo un problema guardando tu perfil. Intenta de nuevo.',
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
                Conecta tu wallet para ver y editar tu información profesional.
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
              Cargando tu perfil profesional...
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
              <CardTitle>Información Profesional</CardTitle>
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
            Tu información médica profesional y de contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-2xl bg-foreground/[0.02] border border-border">
            <Avatar className="size-20 ring-4 ring-cyan-500/20 flex-shrink-0">
              <AvatarFallback className="bg-gradient-electric text-white text-xl font-black">
                {formData.full_name ? formData.full_name.substring(0, 2).toUpperCase() : 'DR'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight truncate">
                {formData.full_name || 'Nuevo Médico'}
              </h3>
              <p className="text-sm text-foreground/50 font-bold mt-0.5">Médico Autorizado · Módulo Blockchain</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 font-bold tracking-widest uppercase text-[10px] flex items-center gap-1">
                  <ShieldCheck className="size-3" /> Verificado
                </Badge>
                <Badge className="bg-cyan-500/10 text-cyan-500 border-0 font-bold tracking-widest uppercase text-[10px] flex items-center gap-1">
                  <BadgeCheck className="size-3" /> Licencia Activa
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Campos del formulario */}
          <div className="grid gap-5">
            {/* Nombre + Licencia Médica */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel className={labelClass}>
                  <User className="size-4 text-cyan-500" /> Nombre completo
                </FieldLabel>
                <Input value={formData.full_name} onChange={e => handleChange('full_name', e.target.value)} className={inputClass} placeholder="Ej: Dr. Luis Sandoval" />
              </Field>
              <Field>
                <FieldLabel className={labelClass}>
                  <BadgeCheck className="size-4 text-cyan-500" /> Licencia Médica
                </FieldLabel>
                <Input value={formData.medical_license} readOnly className={`${inputClass} bg-muted text-muted-foreground`} placeholder="Ej: LIC-BOL-2024-00815" />
              </Field>
            </div>

            {/* Especialidad + Email */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel className={labelClass}>
                  <Stethoscope className="size-4 text-cyan-500" /> Especialidad
                </FieldLabel>
                <Input value={formData.specialty} onChange={e => handleChange('specialty', e.target.value)} className={inputClass} placeholder="Ej: Medicina General" />
              </Field>
              <Field>
                <FieldLabel className={labelClass}>
                  <Mail className="size-4 text-cyan-500" /> Email Profesional
                </FieldLabel>
                <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={inputClass} placeholder="dr.ejemplo@boliviahealth.id" />
              </Field>
            </div>

            {/* Hospital / Clínica */}
            <Field>
              <FieldLabel className={labelClass}>
                <Building className="size-4 text-cyan-500" /> Hospital / Clínica Principal
              </FieldLabel>
              <Input value={formData.hospital} onChange={e => handleChange('hospital', e.target.value)} className={inputClass} placeholder="Ej: Hospital de Clínicas, La Paz" />
            </Field>

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
