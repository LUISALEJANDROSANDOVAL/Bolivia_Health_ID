'use client'

import { Shield, ArrowRight, Sparkles, Activity, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/wallet-context'

export function WelcomeBanner() {
  const { isConnected, userName, connect } = useWallet()

  if (!isConnected) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-electric p-8 lg:p-10 animate-slide-in">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Blockchain Health Platform
            </span>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Bienvenido a{' '}
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Bolivia Health ID
            </span>
          </h1>
          
          <p className="mt-2 max-w-xl text-white/80 text-base lg:text-lg leading-relaxed">
            Tu identidad de salud descentralizada. Gestiona tus registros médicos de forma segura 
            con tecnología blockchain y control total de tus datos.
          </p>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              onClick={connect}
              className="bg-white text-azul-electrico hover:bg-white/90 px-8 py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="mr-2 size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Conectar con Google
              <ArrowRight className="ml-2 size-5" />
            </Button>
            
            <Button variant="ghost" className="text-white hover:bg-white/20 px-6 py-6">
              <Shield className="mr-2 size-5" />
              Saber más
            </Button>
          </div>
          
          <div className="mt-8 flex gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white/60" />
              <span className="text-xs text-white/60">Datos cifrados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white/60" />
              <span className="text-xs text-white/60">Blockchain security</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white/60" />
              <span className="text-xs text-white/60">IPFS Storage</span>
            </div>
          </div>
        </div>
        
        <div className="absolute -right-10 -top-10 animate-float">
          <div className="w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-electric p-8 lg:p-10 animate-slide-in">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-white/80" />
            <span className="text-xs font-semibold text-white/80">Estado: Saludable</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            ¡Hola, <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{userName?.split(' ')[0]}</span>!
          </h1>
          <p className="mt-2 text-white/80">
            Tu salud está protegida. Tienes el control total de tus datos médicos.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="glass-dark rounded-xl p-4 min-w-[160px]">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-turquesa" />
              <span className="text-xs text-white/60">Tasa de cumplimiento</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">98%</p>
          </div>
          
          <div className="glass-dark rounded-xl p-4 min-w-[160px]">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-turquesa" />
              <span className="text-xs text-white/60">Seguridad</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">Nivel 3</p>
          </div>
        </div>
      </div>
      
      <div className="absolute -right-10 -top-10 animate-float">
        <div className="w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      </div>
      <div className="absolute -left-10 -bottom-10 animate-float" style={{ animationDelay: '1s' }}>
        <div className="w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>
    </div>
  )
}