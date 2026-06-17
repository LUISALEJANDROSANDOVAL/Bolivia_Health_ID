'use client'

import { LucideIcon, Sparkles, Wallet, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Stat {
  label: string
  value: string
  icon: LucideIcon
  onClick?: () => void
  buttonText?: string
}

interface WelcomeAction {
  label: string
  onClick: () => void
  icon: LucideIcon
  variant?: 'primary' | 'secondary'
}

interface WelcomeBannerBaseProps {
  title: React.ReactNode
  subtitle?: string
  description: string
  tagline: string
  stats?: Stat[]
  actions: WelcomeAction[]
  isAuthenticated: boolean
}

export function WelcomeBannerBase({
  title,
  subtitle,
  description,
  tagline,
  stats,
  actions,
  isAuthenticated
}: WelcomeBannerBaseProps) {
  if (!isAuthenticated) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-electric p-8 lg:p-12 animate-slide-in shadow-xl shadow-cyan-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-azul-profundo/10 p-2 rounded-lg backdrop-blur-md">
              <Sparkles className="h-5 w-5 text-azul-profundo animate-pulse" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-azul-profundo/60">
              {tagline}
            </span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black text-azul-profundo mb-6 leading-tight">
            {title}
          </h1>
          
          <p className="max-w-xl text-azul-profundo/80 text-lg font-bold leading-relaxed mb-10">
            {description}
          </p>
          
          <div className="flex flex-wrap gap-5">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                className={cn(
                  "hover:scale-105 px-10 py-7 text-lg font-black rounded-2xl shadow-2xl transition-all border-none flex items-center group",
                  action.variant === 'secondary' 
                    ? "bg-white/10 text-white backdrop-blur-xl border border-white/20 hover:bg-white/20" 
                    : "bg-foreground text-background"
                )}
              >
                <action.icon className="mr-3 size-6 group-hover:rotate-12 transition-transform" />
                {action.label}
                <ArrowRight className="ml-3 size-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            ))}
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
            <span className="text-xs font-black uppercase tracking-widest text-azul-profundo/60">Sesión Activa</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-azul-profundo leading-tight">
             {title}
          </h1>
          {subtitle && (
            <p className="mt-6 text-azul-profundo/80 text-lg font-bold max-w-md">
              {subtitle}
            </p>
          )}
          
          {/* Botones de acción alineados con el estilo del paciente */}
          <div className="mt-8 flex flex-wrap gap-4">
            {actions.filter(a => a.variant === 'secondary').map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                className="bg-foreground text-background hover:scale-105 px-10 py-7 text-lg font-black rounded-2xl shadow-2xl transition-all border-none flex items-center group"
              >
                <action.icon className="mr-3 size-6 group-hover:rotate-12 transition-transform" />
                {action.label}
                <ArrowRight className="ml-3 size-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            ))}
          </div>
        </div>
        
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-4 shrink-0">
            {stats.map((stat, index) => {
              const CardElement = stat.onClick ? 'button' : 'div'
              return (
                <CardElement 
                  key={index} 
                  onClick={stat.onClick}
                  type={stat.onClick ? 'button' : undefined}
                  className={cn(
                    "text-left rounded-2xl p-6 min-w-[200px] border border-white/10 transition-all duration-200 select-none",
                    stat.onClick ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:border-white/30 hover:shadow-lg hover:shadow-cyan-500/5 focus:outline-none" : "",
                    index % 2 === 0 ? "glass-dark" : "bg-white/10 backdrop-blur-xl border-white/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <stat.icon className="size-5 text-turquesa" />
                    </div>
                    <span className="text-xs font-black uppercase text-white/40 tracking-tighter">{stat.label}</span>
                  </div>
                  <p className="text-4xl font-black text-white mt-3">{stat.value}</p>
                  {stat.onClick && stat.buttonText && (
                    <div className="mt-3 text-[10px] font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                      <span>{stat.buttonText}</span>
                      <ArrowRight className="size-3" />
                    </div>
                  )}
                </CardElement>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
