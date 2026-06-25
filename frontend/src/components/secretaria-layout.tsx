'use client'

import { type ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SecretariaSidebar } from '@/components/secretaria-sidebar'
import { SecretariaNavbar } from '@/components/secretaria-navbar'
import { AppLayoutBase } from '@/components/ui/app-layout-base'
import { useWallet } from '@/contexts/wallet-context'
import { Loader2, Lock, Wallet, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SecretariaLayoutProps {
  children: ReactNode
}

function RestrictedAccess() {
  const { isConnected, connect, disconnect, role } = useWallet()
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-slide-in">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4 py-8">
        <div className="relative flex items-center justify-center size-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2">
          <div className="absolute inset-0 size-full rounded-3xl bg-amber-500/5 animate-ping opacity-75" />
          <Lock className="size-10" />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Acceso Administrativo Restringido</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Para acceder a la recepción de pacientes y gestión de citas en la sede, necesitas iniciar sesión con una cuenta de secretaría certificada por el sistema.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Estado de Billetera / Sesión */}
        <div className="bg-foreground/[0.02] border border-border rounded-[2rem] p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Wallet className="size-5 text-amber-500" />
              Estado de Sesión
            </h2>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-foreground/5 border border-border/50">
                <span className="text-xs font-bold text-foreground/50 uppercase">Conectado</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-black uppercase ${isConnected ? 'bg-green-500/10 text-green-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {isConnected ? 'Sí' : 'No'}
                </span>
              </div>
              {isConnected && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-foreground/5 border border-border/50">
                  <span className="text-xs font-bold text-foreground/50 uppercase">Rol</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-black uppercase bg-rose-500/10 text-rose-500">
                    {role || 'Ninguno / Paciente'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full h-12 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white"
            >
              Ir al Login de Personal
            </Button>
            {isConnected && (
              <Button 
                onClick={() => disconnect()} 
                variant="outline"
                className="w-full h-12 rounded-xl font-bold border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2"
              >
                <LogOut className="size-4" />
                Desconectar Cuenta
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SecretariaLayout({ children }: SecretariaLayoutProps) {
  const { role, isDbConnected } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const isSecretary = role === 'secretaria'

  return (
    <AppLayoutBase 
      SidebarComponent={SecretariaSidebar}
      NavbarComponent={SecretariaNavbar}
    >
      {isSecretary ? children : <RestrictedAccess />}
    </AppLayoutBase>
  )
}
