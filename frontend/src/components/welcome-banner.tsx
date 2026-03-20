'use client'

import { Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/wallet-context'

export function WelcomeBanner() {
  const { isConnected, userName, connect } = useWallet()

  if (!isConnected) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground lg:p-8">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold lg:text-3xl text-balance">
            Bienvenido a Bolivia Health ID
          </h1>
          <p className="mt-2 max-w-xl text-sm text-primary-foreground/90 lg:text-base">
            Tu identidad de salud descentralizada. Conecta tu cuenta para gestionar 
            tus registros médicos de forma segura con tecnología blockchain.
          </p>
          <Button
            onClick={connect}
            className="mt-4 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <svg className="mr-2 size-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Conectar con Google
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-primary-foreground/10" />
        <div className="absolute -bottom-12 -right-12 size-60 rounded-full bg-primary-foreground/5" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground lg:p-8">
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl text-balance">
            Hola, {userName?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/90 lg:text-base">
            Tu salud está protegida. Tienes el control total de tus datos médicos.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/20">
            <Shield className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">Datos Cifrados</p>
            <p className="text-xs text-primary-foreground/80">Almacenamiento IPFS</p>
          </div>
        </div>
      </div>
      <div className="absolute -right-8 -top-8 size-40 rounded-full bg-primary-foreground/10" />
      <div className="absolute -bottom-12 -right-12 size-60 rounded-full bg-primary-foreground/5" />
    </div>
  )
}
