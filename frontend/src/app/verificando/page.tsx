'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { 
  ShieldCheck, 
  Search, 
  FileCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Fingerprint
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export default function VerificandoPage() {
  const router = useRouter()
  const { 
    approvalStatus, 
    identityVerified, 
    licenseVerified, 
    loading, 
    refreshProfile,
    isDoctorAuthenticated 
  } = useDoctorAuth()
  
  const [dots, setDots] = useState('')

  // Efecto para los puntos suspensivos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Verificar estado y redireccionar si ya está aprobado
  useEffect(() => {
    if (!loading && approvalStatus === 'approved') {
      router.push('/doctor')
    }
  }, [approvalStatus, loading, router])

  const handleRefresh = async () => {
    await refreshProfile()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white flex flex-col items-center justify-center p-6">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg space-y-8 text-center">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10 mb-2">
            <Stethoscope className="size-10 text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Verificando Credenciales{dots}
          </h1>
          <p className="text-slate-400 text-lg">
            Estamos validando tu identidad y matrícula con el Ministerio de Salud y el SEGIP Bolivia.
          </p>
        </div>

        {/* Validation Steps Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8">
          
          {/* Step 1: Identity */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border transition-colors ${identityVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                {identityVerified ? (
                  <Fingerprint className="size-6 text-emerald-400" />
                ) : (
                  <Search className="size-6 text-blue-400 animate-spin-slow" />
                )}
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Identidad Digital (SEGIP)</p>
                <p className="text-sm text-slate-400">Verificando Cédula de Identidad</p>
              </div>
            </div>
            {identityVerified ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Válido</Badge>
            ) : (
              <Badge variant="outline" className="border-white/20 text-slate-400">En curso</Badge>
            )}
          </div>

          <Progress value={identityVerified ? 100 : 45} className="h-1 bg-white/10" />

          {/* Step 2: License */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border transition-colors ${licenseVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                {licenseVerified ? (
                  <FileCheck className="size-6 text-emerald-400" />
                ) : (
                  <ShieldCheck className={`size-6 ${identityVerified ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`} />
                )}
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Matrícula Profesional (SIREPRO)</p>
                <p className="text-sm text-slate-400">Validando vigencia ministerial</p>
              </div>
            </div>
            {licenseVerified ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Vigente</Badge>
            ) : (
              <Badge variant="outline" className="border-white/20 text-slate-400">Procesando</Badge>
            )}
          </div>

          <Progress value={licenseVerified ? 100 : 15} className="h-1 bg-white/10" />

          {/* Footer Info */}
          <div className="pt-4 flex flex-col gap-3">
             <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-white/5 p-4 rounded-xl">
               <Loader2 className="size-4 animate-spin text-blue-400" />
               Este proceso suele tardar de 1 a 2 minutos.
             </div>
             
             <Button 
               variant="outline" 
               className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
               onClick={handleRefresh}
               disabled={loading}
             >
               {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
               Actualizar Estado
             </Button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <CheckCircle2 className="size-4" />
          <span>Sistema de Validación Descentralizado de Bolivia</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  )
}
