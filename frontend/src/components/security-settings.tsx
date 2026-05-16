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

  // Función para detectar el dispositivo actual
  const getDeviceInfo = () => {
    const ua = navigator.userAgent
    let browser = "Navegador desconocido"
    let os = "Sistema desconocido"

    if (ua.includes("Firefox")) browser = "Firefox"
    else if (ua.includes("Edg")) browser = "Edge"
    else if (ua.includes("Chrome")) browser = "Chrome"
    else if (ua.includes("Safari")) browser = "Safari"

    if (ua.includes("Windows")) os = "en Windows"
    else if (ua.includes("Mac")) os = "en macOS"
    else if (ua.includes("Android")) os = "en Android"
    else if (ua.includes("iPhone")) os = "en iPhone"

    return `${browser} ${os}`
  }

  useEffect(() => {
    if (profile?.preferences?.security) {
      setTwoFAEnabled(profile.preferences.security.twoFAEnabled ?? true)
      setBiometricEnabled(profile.preferences.security.biometricEnabled ?? false)
    }

    // Gestionar Sesiones Activas
    const currentDevice = getDeviceInfo()
    const storedSessions = profile?.preferences?.active_sessions || []
    
    // Identificador único para esta "pestaña/sesión" (usando localStorage para persistir el ID de este dispositivo)
    let deviceId = localStorage.getItem('bolivia_health_device_id')
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15)
      localStorage.setItem('bolivia_health_device_id', deviceId)
    }

    const currentSessionIndex = storedSessions.findIndex((s: any) => s.id === deviceId)
    
    if (currentSessionIndex === -1) {
      // Registrar nueva sesión
      const newSession = {
        id: deviceId,
        device: currentDevice,
        location: 'La Paz, Bolivia', // Mock de ubicación
        ip: '190.104.xxx.xxx',
        lastActive: 'Activo ahora',
        current: true,
        timestamp: Date.now()
      }
      const updatedSessions = [...storedSessions, newSession]
      setSessions(updatedSessions)
      saveSessionsToDB(updatedSessions)
    } else {
      // Actualizar sesión existente como "Actual"
      const updatedSessions = storedSessions.map((s: any) => ({
        ...s,
        current: s.id === deviceId,
        lastActive: s.id === deviceId ? 'Activo ahora' : s.lastActive
      }))
      setSessions(updatedSessions)
    }
  }, [profile?.preferences?.security, profile?.preferences?.active_sessions])

  const saveSessionsToDB = async (updatedSessions: any[]) => {
    try {
      await updateProfile({
        preferences: {
          ...(profile.preferences || {}),
          active_sessions: updatedSessions
        }
      })
    } catch (err) {
      console.error('Error saving sessions:', err)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId)
    setSessions(updatedSessions)
    await saveSessionsToDB(updatedSessions)
    
    // Si el usuario cierra su propia sesión actual, desconectar de la wallet/app
    const deviceId = localStorage.getItem('bolivia_health_device_id')
    if (sessionId === deviceId) {
      toast({
        title: 'Cerrando sesión...',
        description: 'Has decidido cerrar la sesión en este dispositivo.'
      })
      setTimeout(() => {
        disconnect()
        router.push('/')
      }, 1000)
    } else {
      toast({
        title: 'Sesión cerrada',
        description: 'El dispositivo ha sido desconectado correctamente.'
      })
    }
  }

  const handleRevokeOthers = async () => {
    const deviceId = localStorage.getItem('bolivia_health_device_id')
    const updatedSessions = sessions.filter(s => s.id === deviceId)
    setSessions(updatedSessions)
    await saveSessionsToDB(updatedSessions)
    toast({
      title: 'Sesiones limpias',
      description: 'Se han cerrado todas las demás sesiones activas.'
    })
  }

  const saveToDatabase = async (newSecurity: any) => {
    try {
      await updateProfile({
        preferences: {
          ...(profile.preferences || {}),
          security: {
            ...(profile.preferences?.security || {}),
            ...newSecurity
          }
        }
      })
    } catch (err) {
      console.error('Error saving security settings:', err)
      toast({
        title: 'Error de conexión',
        description: 'No se pudieron guardar las configuraciones de seguridad.',
        variant: 'destructive'
      })
    }
  }

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