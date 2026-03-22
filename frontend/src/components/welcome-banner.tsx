'use client'

import { Shield, ArrowRight, Sparkles, Activity, TrendingUp, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/wallet-context'

export function WelcomeBanner() {
  const { isConnected, userName, connect } = useWallet()

  if (!isConnected) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-electric p-8 lg:p-12 animate-slide-in shadow-xl shadow-cyan-500/10">
        {/* Luces de fondo decorativas */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-azul-profundo/10 p-2 rounded-lg backdrop-blur-md">
              <Sparkles className="h-5 w-5 text-azul-profundo animate-pulse" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-azul-profundo/60">
              Blockchain Health Identity
            </span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black text-azul-profundo mb-6 leading-tight">
            Bienvenido a <br />
            <span className="opacity-90">Bolivia Health ID</span>
          </h1>
          
          <p className="max-w-xl text-azul-profundo/80 text-lg font-bold leading-relaxed mb-10">
            Tu identidad de salud descentralizada gestionada por tu propia Wallet. 
            Seguridad inquebrantable para tus registros médicos.
          </p>
          
          <div className="flex flex-wrap gap-5">
            <Button
              onClick={connect}
              className="bg-foreground text-background hover:scale-105 px-10 py-7 text-lg font-black rounded-2xl shadow-2xl transition-all border-none"
            >
              <Wallet className="mr-3 size-6" />
              Conectar Wallet
              <ArrowRight className="ml-3 size-6" />
            </Button>
            
            <Button variant="ghost" className="text-foreground font-black hover:bg-foreground/10 px-8 py-7 text-lg border-2 border-foreground/30 rounded-2xl">
              <Shield className="mr-3 size-6" />
              Saber más
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-electric p-8 lg:p-10 animate-slide-in shadow-xl shadow-cyan-500/10">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-2 rounded-full bg-azul-profundo animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-azul-profundo/60">Identidad Activa</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-azul-profundo leading-tight">
             Hola, <br />
             <span className="opacity-90">{userName?.split(' ')[0] || 'Usuario'}</span>
          </h1>
          <p className="mt-6 text-azul-profundo/80 text-lg font-bold max-w-md">
            Tu historial médico está sincronizado y protegido en la red Avalanche Fuji.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 shrink-0">
          <div className="glass-dark rounded-2xl p-6 min-w-[200px] group border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <TrendingUp className="size-5 text-turquesa" />
              </div>
              <span className="text-xs font-black uppercase text-white/40 tracking-tighter">Cumplimiento</span>
            </div>
            <p className="text-4xl font-black text-white mt-3">98%</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 min-w-[200px] group border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Shield className="size-5 text-turquesa" />
              </div>
              <span className="text-xs font-black uppercase text-white/40 tracking-tighter">Seguridad</span>
            </div>
            <p className="text-4xl font-black text-white mt-3">Máxima</p>
          </div>
        </div>
      </div>
    </div>
  )
}