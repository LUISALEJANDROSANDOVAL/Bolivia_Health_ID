'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Lock, 
  Fingerprint, 
  Smartphone, 
  Key, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useToast } from '@/hooks/use-toast'
import { useProfile } from '@/hooks/useProfile'
import { useWallet } from '@/contexts/wallet-context'
import { useRouter } from 'next/navigation'
import CryptoJS from 'crypto-js'
import { supabase } from '@/lib/supabase'

export function SecuritySettings() {
  const { walletAddress, disconnect } = useWallet()
  const { profile, updateProfile } = useProfile(walletAddress)
  const router = useRouter()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [twoFAEnabled, setTwoFAEnabled] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [sessionActive, setSessionActive] = useState(true)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const { toast } = useToast()
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })

  const [sessions, setSessions] = useState<any[]>([])

  // ... (rest of the helper functions remain same)

  const handleChangePassword = async () => {
    if (!passwords.new || !passwords.confirm) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor, ingresa la nueva contraseña y su confirmación.',
        variant: 'destructive'
      })
      return
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: 'Error de coincidencia',
        description: 'La nueva contraseña y la confirmación no coinciden.',
        variant: 'destructive'
      })
      return
    }

    setIsChangingPassword(true)
    try {
      if (profile?.password_hash && passwords.current) {
        const currentHash = CryptoJS.SHA256(passwords.current).toString()
        if (currentHash !== profile.password_hash) {
          throw new Error('La contraseña actual es incorrecta.')
        }
      }

      const newHash = CryptoJS.SHA256(passwords.new).toString()
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          password_hash: newHash
        })
        .eq('wallet_address', walletAddress?.toLowerCase())

      if (error) throw error

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada correctamente en la base de datos.',
      })
      
      localStorage.setItem('lastSessionPassword', passwords.new)
      setPasswords({ current: passwords.new, new: '', confirm: '' })
    } catch (err: any) {
      toast({
        title: 'Error al actualizar',
        description: err.message || 'No se pudo cambiar la contraseña.',
        variant: 'destructive'
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleToggle2FA = () => {
    const newState = !twoFAEnabled
    setTwoFAEnabled(newState)
    saveToDatabase({ twoFAEnabled: newState })
    toast({
      title: newState ? '2FA activada' : '2FA desactivada',
      description: newState 
        ? 'La autenticación de dos factores ha sido activada'
        : 'La autenticación de dos factores ha sido desactivada',
    })
  }

  const handleToggleBiometric = (newState: boolean) => {
    setBiometricEnabled(newState)
    saveToDatabase({ biometricEnabled: newState })
  }

  return (
    <div className="space-y-6">
      {/* Cambiar contraseña */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="size-5 text-azul-electrico" />
            <CardTitle>Contraseña</CardTitle>
          </div>
          <CardDescription>Cambia tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Contraseña actual</FieldLabel>
              <div className="relative">
                <Input 
                  type={showCurrentPassword ? 'text' : 'password'} 
                  placeholder="Ingresa tu contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </Field>
            <Field>
              <FieldLabel>Nueva contraseña</FieldLabel>
              <div className="relative">
                <Input 
                  type={showNewPassword ? 'text' : 'password'} 
                  placeholder="Ingresa tu nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </Field>
            <Field>
              <FieldLabel>Confirmar nueva contraseña</FieldLabel>
              <div className="relative">
                <Input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Confirma tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </Field>
          </FieldGroup>
          <Button 
            onClick={handleChangePassword} 
            disabled={isChangingPassword}
            className="btn-premium"
          >
            {isChangingPassword ? (
              <>
                <RefreshCw className="size-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Key className="size-4 mr-2" />
                Cambiar contraseña
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Autenticación */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-azul-electrico" />
            <CardTitle>Autenticación</CardTitle>
          </div>
          <CardDescription>Métodos de verificación de identidad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-azul-electrico" />
                <p className="text-sm font-medium text-azul-profundo">Autenticación de dos factores (2FA)</p>
              </div>
              <p className="text-xs text-gris-grafito">Recibe un código en tu teléfono al iniciar sesión</p>
            </div>
            <Switch checked={twoFAEnabled} onCheckedChange={handleToggle2FA} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Fingerprint className="size-4 text-azul-electrico" />
                <p className="text-sm font-medium text-azul-profundo">Autenticación biométrica</p>
              </div>
              <p className="text-xs text-gris-grafito">Usa tu huella digital o Face ID para acceder</p>
            </div>
            <Switch 
              checked={biometricEnabled} 
              onCheckedChange={handleToggleBiometric} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Sesiones activas */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-azul-electrico" />
            <CardTitle>Sesiones activas</CardTitle>
          </div>
          <CardDescription>Dispositivos conectados a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session, idx) => (
            <div key={idx} className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className={`mt-1 size-2 rounded-full ${session.current ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm font-medium text-azul-profundo">
                    {session.device}
                    {session.current && (
                      <Badge className="ml-2 bg-emerald-50 text-emerald-600 border-0 text-xs">
                        Actual
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-gris-grafito mt-0.5">
                    {session.location} • {session.ip}
                  </p>
                  <p className="text-xs text-gris-grafito/60 mt-0.5">
                    Última actividad: {session.lastActive}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={session.current ? "text-amber-500 hover:text-amber-600" : "text-coral hover:text-coral"}
                onClick={() => handleRevokeSession(session.id)}
              >
                {session.current ? 'Cerrar esta sesión' : 'Cerrar sesión'}
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            className="w-full btn-outline-premium mt-2"
            onClick={handleRevokeOthers}
            disabled={sessions.length <= 1}
          >
            Cerrar todas las demás sesiones
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}