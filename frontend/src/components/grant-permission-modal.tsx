'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  User, 
  Building2, 
  Shield, 
  Plus, 
  X,
  CheckCircle2,
  RefreshCw,
  Stethoscope
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'
import { useToast } from '@/hooks/use-toast'

interface Doctor {
  id: string
  full_name: string
  specialty?: string
  license_number?: string
  wallet_address: string
}

interface GrantPermissionModalProps {
  onPermissionGranted?: () => void
}

export function GrantPermissionModal({ onPermissionGranted }: GrantPermissionModalProps) {
  const { walletAddress } = useWallet()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [doctorFound, setDoctorFound] = useState<Doctor | null>(null)
  const [searchCI, setSearchCI] = useState('')
  const [isGranting, setIsGranting] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [grantDuration, setGrantDuration] = useState<'1h' | '24h' | 'permanent'>('permanent')

  // Reset state when opening/closing
  useEffect(() => {
    if (!open) {
      setSearchCI('')
      setDoctorFound(null)
      setHasSearched(false)
      setGrantDuration('permanent')
    }
  }, [open])

  async function handleSearch() {
    if (!searchCI.trim()) return
    
    setLoading(true)
    setHasSearched(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, specialty, license_number, wallet_address')
        .eq('role', 'medico')
        .eq('cedula_identidad', searchCI.trim())
        .single()
      
      if (error) {
        setDoctorFound(null)
      } else {
        setDoctorFound(data)
      }
    } catch (err) {
      console.error('Error searching doctor:', err)
      setDoctorFound(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleGrantAccess(doctor: Doctor) {
    if (!walletAddress) return
    
    setIsGranting(true)
    try {
      // 1. Get patient ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()
      
      if (profileError) throw profileError

      // 2. Calculate expires_at
      let expiresAt: string | null = null
      const now = new Date()
      if (grantDuration === '1h') {
        now.setHours(now.getHours() + 1)
        expiresAt = now.toISOString()
      } else if (grantDuration === '24h') {
        now.setHours(now.getHours() + 24)
        expiresAt = now.toISOString()
      }

      // 3. Insert permission
      const { error: grantError } = await supabase
        .from('access_permissions')
        .insert([{
          patient_id: profile.id,
          doctor_id: doctor.id,
          status: 'active',
          expires_at: expiresAt
        }])
      
      if (grantError) throw grantError

      toast({
        title: 'Acceso concedido',
        description: `Has otorgado permiso al Dr. ${doctor.full_name} exitosamente.`
      })

      setOpen(false)
      if (onPermissionGranted) onPermissionGranted()
    } catch (err: any) {
      console.error('Error granting access:', err)
      toast({
        title: 'Error',
        description: err.message || 'No se pudo otorgar el permiso.',
        variant: 'destructive'
      })
    } finally {
      setIsGranting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-foreground text-background hover:scale-105 px-8 py-6 text-lg font-black rounded-2xl shadow-2xl transition-all border-none">
          <Plus className="size-5 mr-3" />
          Nuevo Permiso
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-border max-w-lg rounded-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 bg-foreground/5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-electric">
              <Shield className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground">Conceder Acceso</DialogTitle>
              <DialogDescription className="text-foreground/50">
                Selecciona un médico de la red para otorgarle acceso temporal
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-foreground/40 ml-1">
              Carnet de Identidad del Médico
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
                <Input 
                  placeholder="Ej: 1234567 LP" 
                  className="pl-10 bg-foreground/5 border-border h-12 rounded-xl font-bold"
                  value={searchCI}
                  onChange={(e) => setSearchCI(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading || !searchCI.trim()}
                className="h-12 px-6 bg-cyan-500 hover:bg-cyan-600 text-white font-black rounded-xl transition-all"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : 'Buscar'}
              </Button>
            </div>
          </div>

          <div className="min-h-[120px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-foreground/[0.02] p-4 transition-all">
            {loading ? (
              <div className="text-center animate-pulse">
                <RefreshCw className="size-8 text-cyan-500 animate-spin mx-auto mb-2" />
                <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">Verificando en la red...</p>
              </div>
            ) : doctorFound ? (
              <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-electric shadow-lg shadow-cyan-500/20">
                      <Stethoscope className="size-7 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-foreground text-lg leading-tight">{doctorFound.full_name}</p>
                      <p className="text-xs text-cyan-500 font-bold uppercase tracking-widest mt-1">
                        {doctorFound.specialty || 'Médico General'}
                      </p>
                      <p className="text-[10px] text-foreground/40 font-medium">Matrícula: {doctorFound.license_number || 'N/A'}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleGrantAccess(doctorFound)}
                    disabled={isGranting}
                    className="bg-foreground text-background hover:scale-105 px-6 h-12 rounded-xl font-black transition-all"
                  >
                    {isGranting ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                    Otorgar
                  </Button>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-foreground/40 block">
                    Duración del Acceso
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGrantDuration('1h')}
                      className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                        grantDuration === '1h'
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                          : 'border-border bg-foreground/5 text-foreground/75 hover:bg-foreground/10'
                      }`}
                    >
                      1 Hora
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrantDuration('24h')}
                      className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                        grantDuration === '24h'
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                          : 'border-border bg-foreground/5 text-foreground/75 hover:bg-foreground/10'
                      }`}
                    >
                      24 Horas
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrantDuration('permanent')}
                      className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                        grantDuration === 'permanent'
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                          : 'border-border bg-foreground/5 text-foreground/75 hover:bg-foreground/10'
                      }`}
                    >
                      Permanente
                    </button>
                  </div>
                </div>
              </div>
            ) : hasSearched ? (
              <div className="text-center animate-in fade-in slide-in-from-top-2">
                <X className="size-8 text-rose-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-black text-rose-500/60 tracking-tight">Médico no encontrado</p>
                <p className="text-[10px] text-foreground/40 font-medium">Verifica el número de carnet e intenta de nuevo</p>
              </div>
            ) : (
              <div className="text-center opacity-30">
                <User className="size-10 mx-auto mb-2" />
                <p className="text-sm font-bold tracking-tight uppercase">Esperando búsqueda</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-foreground/5 border-t border-border text-center">
          <p className="text-[10px] text-foreground/40 font-medium">
            * El acceso otorgado puede ser revocado manualmente en cualquier momento desde el panel de control.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
