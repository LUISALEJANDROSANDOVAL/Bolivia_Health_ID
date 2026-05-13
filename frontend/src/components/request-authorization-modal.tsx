'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  User, 
  Shield, 
  Send, 
  X,
  CheckCircle2,
  RefreshCw,
  UserPlus
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
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { useToast } from '@/hooks/use-toast'
import { sendNotification } from '@/lib/notifications'

interface Patient {
  id: string
  full_name: string
  cedula_identidad: string
  wallet_address: string
}

interface RequestAuthorizationModalProps {
  onRequestSent?: () => void
}

export function RequestAuthorizationModal({ onRequestSent }: RequestAuthorizationModalProps) {
  const { doctorId, doctorName } = useDoctorAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patientFound, setPatientFound] = useState<Patient | null>(null)
  const [searchCI, setSearchCI] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Reset state when opening/closing
  useEffect(() => {
    if (!open) {
      setSearchCI('')
      setPatientFound(null)
      setHasSearched(false)
    }
  }, [open])

  async function handleSearch() {
    if (!searchCI.trim()) return
    
    setLoading(true)
    setHasSearched(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cedula_identidad, wallet_address')
        .eq('role', 'paciente')
        .eq('cedula_identidad', searchCI.trim())
        .single()
      
      if (error) {
        setPatientFound(null)
      } else {
        setPatientFound(data)
      }
    } catch (err) {
      console.error('Error searching patient:', err)
      setPatientFound(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestAccess(patient: Patient) {
    if (!doctorId) {
        toast({
            title: 'Error',
            description: 'No se pudo identificar tu perfil médico.',
            variant: 'destructive'
        })
        return
    }
    
    setIsSending(true)
    try {
      // 1. Check if a request already exists
      const { data: existing } = await supabase
        .from('access_permissions')
        .select('id, status')
        .eq('patient_id', patient.id)
        .eq('doctor_id', doctorId)
        .or('status.eq.pending,status.eq.active')
        .single()

      if (existing) {
        toast({
          title: 'Solicitud ya existe',
          description: `Ya tienes una solicitud ${existing.status === 'active' ? 'activa' : 'pendiente'} con este paciente.`,
          variant: 'destructive'
        })
        setIsSending(false)
        return
      }

      // 2. Insert pending permission request
      const { error: requestError } = await supabase
        .from('access_permissions')
        .insert([{
          patient_id: patient.id,
          doctor_id: doctorId,
          status: 'pending'
        }])
      
      if (requestError) {
        console.error('Error insertando permiso:', requestError)
        throw requestError
      }

      // Enviar notificación al paciente (con try/catch para no bloquear el flujo principal)
      try {
        await sendNotification({
          recipientId: patient.id,
          senderId: doctorId,
          title: 'Nueva solicitud de acceso',
          message: `El Dr. ${doctorName} desea acceder a su historial médico.`,
          type: 'request',
          link: '/permisos'
        })
      } catch (notifyErr) {
        console.warn('No se pudo enviar la notificación, pero el permiso fue creado:', notifyErr)
      }

      toast({
        title: 'Solicitud enviada',
        description: `Se ha enviado una solicitud de acceso a ${patient.full_name}.`
      })

      setOpen(false)
      if (onRequestSent) onRequestSent()
    } catch (err: any) {
      console.error('Error sending request:', err)
      toast({
        title: 'Error',
        description: err.message || 'No se pudo enviar la solicitud.',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-azul-electrico hover:bg-white/90 shadow-lg font-bold">
          <Send className="size-4 mr-2" />
          Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-border max-w-lg rounded-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 bg-foreground/5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-electric">
              <Shield className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground">Solicitar Autorización</DialogTitle>
              <DialogDescription className="text-foreground/50">
                Busca un paciente por su CI para solicitar acceso a su historial médico
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-foreground/40 ml-1">
              Carnet de Identidad del Paciente
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" />
                <Input 
                  placeholder="Ej: 8765432 SC" 
                  className="pl-10 bg-foreground/5 border-border h-12 rounded-xl font-bold"
                  value={searchCI}
                  onChange={(e) => setSearchCI(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading || !searchCI.trim()}
                className="h-12 px-6 bg-azul-electrico hover:bg-azul-electrico/90 text-white font-black rounded-xl transition-all"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : 'Buscar'}
              </Button>
            </div>
          </div>

          <div className="min-h-[120px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-foreground/[0.02] p-4 transition-all">
            {loading ? (
              <div className="text-center animate-pulse">
                <RefreshCw className="size-8 text-azul-electrico animate-spin mx-auto mb-2" />
                <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">Buscando paciente...</p>
              </div>
            ) : patientFound ? (
              <div className="w-full flex items-center justify-between p-2 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-azul-profundo shadow-lg">
                    <User className="size-7 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-foreground text-lg leading-tight">{patientFound.full_name}</p>
                    <p className="text-xs text-azul-electrico font-bold uppercase tracking-widest mt-1">
                      CI: {patientFound.cedula_identidad}
                    </p>
                    <p className="text-[10px] text-foreground/40 font-medium overflow-hidden text-ellipsis max-w-[150px]">
                        {patientFound.wallet_address}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleRequestAccess(patientFound)}
                  disabled={isSending}
                  className="bg-azul-electrico text-white hover:scale-105 px-6 h-12 rounded-xl font-black transition-all"
                >
                  {isSending ? <RefreshCw className="size-4 animate-spin mr-2" /> : <UserPlus className="size-4 mr-2" />}
                  Solicitar
                </Button>
              </div>
            ) : hasSearched ? (
              <div className="text-center animate-in fade-in slide-in-from-top-2">
                <X className="size-8 text-rose-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-black text-rose-500/60 tracking-tight">Paciente no encontrado</p>
                <p className="text-[10px] text-foreground/40 font-medium">Verifica el número de carnet e intenta de nuevo</p>
              </div>
            ) : (
              <div className="text-center opacity-30">
                <Search className="size-10 mx-auto mb-2" />
                <p className="text-sm font-bold tracking-tight uppercase">Ingresa el CI del paciente</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-foreground/5 border-t border-border text-center">
          <p className="text-[10px] text-foreground/40 font-medium">
            * El paciente recibirá una notificación y deberá aprobar la solicitud para que puedas ver su historial.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
