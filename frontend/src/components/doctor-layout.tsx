'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DoctorSidebar } from '@/components/doctor-sidebar'
import { DoctorNavbar } from '@/components/doctor-navbar'
import { AppLayoutBase } from '@/components/ui/app-layout-base'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { useWallet } from '@/contexts/wallet-context'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Wallet, UserPlus, LogOut, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface DoctorLayoutProps {
  children: ReactNode
}

const TEST_DOCTORS = [
  { name: 'Dr. Angel Sandoval', address: '0x88e93cbe9461fab60939dd6eb534d85254e6af39', specialty: 'Traumatología' },
  { name: 'Dr. Jorge Luis Ayala Paniagua', address: '0xb3ba9c31e53b7ce14c6d227b261cbcb81374a20d', specialty: 'Pediatría' },
  { name: 'Dr. Andres Galarza', address: '0xb8e9b2d52a80407712fb5944dffe4e4a3b0eadb0', specialty: 'Cardiología' },
  { name: 'Dr. Jose Luis Rodriguez Rojas', address: '0x05f605a0a9c2b6b82a56fcfdbdc3d4d4ff3f2fa5', specialty: 'Ginecología' }
]

function RestrictedAccess() {
  const { walletAddress, isConnected, connect, disconnect } = useWallet()
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const router = useRouter()

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    toast.success('Dirección de Doctor copiada', {
      description: 'Dirección copiada. Configura esta dirección en tu billetera para firmar.'
    })
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-slide-in">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4 py-8">
        <div className="relative flex items-center justify-center size-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-2">
          <div className="absolute inset-0 size-full rounded-3xl bg-rose-500/5 animate-ping opacity-75" />
          <Lock className="size-10" />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Acceso Restringido a Médicos</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Para ver el historial de pacientes, firmar diagnósticos o registrar recetas en la blockchain de pruebas (Avalanche Fuji), necesitas estar conectado como un médico verificado.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Estado actual de la Billetera */}
        <div className="bg-foreground/[0.02] border border-border rounded-[2rem] p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Wallet className="size-5 text-cyan-500" />
              Estado de Billetera
            </h2>
            <p className="text-xs text-muted-foreground">
              Detalle de tu conexión de billetera actual:
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-foreground/5 border border-border/50">
                <span className="text-xs font-bold text-foreground/50 uppercase">Conexión</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-black uppercase ${isConnected ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              {isConnected && (
                <>
                  <div className="p-3.5 rounded-2xl bg-foreground/5 border border-border/50 space-y-1">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block">Dirección de Billetera</span>
                    <span className="font-mono text-xs text-foreground/80 break-all select-all block">{walletAddress}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-foreground/5 border border-border/50">
                    <span className="text-xs font-bold text-foreground/50 uppercase">Rol en Sistema</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-black uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      Paciente / No Autorizado
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-4">
            {isConnected ? (
              <Button 
                onClick={() => disconnect()} 
                variant="outline"
                className="w-full h-12 rounded-xl font-bold border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2"
              >
                <LogOut className="size-4" />
                Desconectar Billetera Actual
              </Button>
            ) : (
              <Button 
                onClick={() => connect()} 
                className="w-full h-12 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-2"
              >
                <Wallet className="size-4" />
                Conectar Billetera
              </Button>
            )}
          </div>
        </div>

        {/* Habilitación y Opciones */}
        <div className="bg-foreground/[0.02] border border-border rounded-[2rem] p-6 space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <UserPlus className="size-5 text-cyan-500" />
              ¿Cómo obtener acceso?
            </h2>
            <p className="text-xs text-muted-foreground">
              Tienes dos opciones para probar el flujo de médicos:
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-cyan-500/[0.03] border border-cyan-500/20 rounded-2xl space-y-2">
              <h3 className="text-xs font-black text-cyan-500 uppercase tracking-wider">Opción A: Registrar tu Wallet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Puedes registrar la billetera que tienes conectada actualmente como un perfil de médico en Bolivia Health ID ingresando al registro de médico:
              </p>
              <Button 
                onClick={() => router.push('/register?role=doctor')}
                className="mt-2 h-10 px-4 bg-cyan-500 hover:bg-cyan-400 text-azul-profundo font-black rounded-xl text-xs flex items-center gap-2"
              >
                <UserPlus className="size-3.5" />
                Registrar esta Cuenta como Médico
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black text-foreground/60 uppercase tracking-wider">Opción B: Usar Billeteras de Prueba</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Copia y conecta en tu wallet (ej. MetaMask) una de las siguientes cuentas pre-registradas en la base de datos de pruebas para simular el rol de médico:
              </p>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {TEST_DOCTORS.map((doc) => (
                  <div key={doc.address} className="p-3 bg-foreground/5 border border-border/50 rounded-xl flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground truncate">{doc.name}</p>
                      <p className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">{doc.specialty}</p>
                      <p className="font-mono text-[10px] text-foreground/50 truncate mt-0.5">{doc.address}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="size-8 rounded-lg bg-foreground/5 hover:bg-cyan-500/10 hover:text-cyan-500 shrink-0"
                      onClick={() => handleCopy(doc.address)}
                    >
                      {copiedAddress === doc.address ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DoctorLayout({ children }: DoctorLayoutProps) {
  const router = useRouter()
  const { approvalStatus, loading, isDoctorAuthenticated, identityVerified, licenseVerified } = useDoctorAuth()

  useEffect(() => {
    if (!loading && isDoctorAuthenticated && (approvalStatus !== 'approved' || !identityVerified || !licenseVerified)) {
      router.push('/verificando')
    }
  }, [approvalStatus, identityVerified, licenseVerified, loading, isDoctorAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AppLayoutBase 
      SidebarComponent={DoctorSidebar}
      NavbarComponent={DoctorNavbar}
    >
      {isDoctorAuthenticated ? children : <RestrictedAccess />}
    </AppLayoutBase>
  )
}
