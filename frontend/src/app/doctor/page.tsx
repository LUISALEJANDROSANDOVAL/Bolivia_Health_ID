'use client'

import { DoctorLayout } from '@/components/doctor-layout'
import { DoctorWelcomeBanner } from '@/components/doctor-welcome-banner'
import { Button } from '@/components/ui/button'
import { Users, Clock, AlertCircle, Share2, TrendingUp, Wallet, Shield } from 'lucide-react'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import Link from 'next/link'
import { StatCard } from '@/components/ui/stat-card'

export default function DoctorDashboard() {
  const { doctorName, doctorWallet } = useDoctorAuth()

  const stats = [
    {
      title: 'Pacientes Citados Hoy',
      value: '8',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Solicitudes Pendientes',
      value: '3',
      icon: AlertCircle,
      color: 'text-orange-500',
    },
    {
      title: 'Accesos Concedidos',
      value: '24',
      icon: Share2,
      color: 'text-green-500',
    },
    {
      title: 'Diagnósticos Firmados',
      value: '5',
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ]

  const actions = [
    { label: 'Ver Pacientes', icon: Users, href: '/doctor/patients' },
    { label: 'Programar Cita', icon: Clock, href: '/doctor/agenda' },
    { label: 'Gestionar Solicitudes', icon: AlertCircle, href: '/doctor/authorizations' },
    { label: 'Firmar Receta', icon: Share2, href: '/doctor/prescriptions' },
  ]

  return (
    <DoctorLayout>
      <div className="space-y-8 animate-slide-in">
        <DoctorWelcomeBanner />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Acciones Rápidas con estilo premium */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-foreground">Panel de Control</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {actions.map((action) => (
                  <Link href={action.href} key={action.label} className="group">
                    <div className="flex items-center gap-4 bg-foreground/[0.03] backdrop-blur-xl p-4 rounded-3xl border border-border group-hover:border-cyan-500/30 transition-all hover:bg-foreground/[0.05] h-full">
                      <div className="p-3 rounded-2xl bg-foreground/5 group-hover:bg-cyan-500/10 transition-colors">
                        <action.icon className="size-6 text-foreground/70 group-hover:text-cyan-500" />
                      </div>
                      <span className="font-black text-foreground/80 group-hover:text-foreground">{action.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Stats Grid con estilo premium */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-black text-foreground">Resumen de Actividad</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <StatCard 
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Wallet Status / Network */}
            <div className="bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-[2rem] border border-border shadow-lg shadow-black/5">
              <h3 className="text-lg font-black text-foreground mb-4">Estado de Red</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-foreground/5 border border-border/50">
                  <div className={`size-3 ${doctorWallet ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'} rounded-full animate-pulse`} />
                  <span className="text-sm font-black text-foreground/80">Polygon m-PoS L2</span>
                </div>
                <div className="p-4 rounded-2xl bg-foreground/5 border border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-2">Connected Wallet</p>
                  <p className="font-mono text-xs text-foreground/70 truncate">{doctorWallet || '0x... no conectado'}</p>
                </div>
                <Button className="w-full bg-foreground/10 hover:bg-foreground/20 text-foreground font-black rounded-2xl border-none h-12">
                   Protocol Health: OK
                </Button>
              </div>
            </div>

            {/* Actividad Reciente */}
            <div className="bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-[2rem] border border-border shadow-lg shadow-black/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-foreground">Eventos</h3>
                <Shield className="size-5 text-cyan-500 opacity-50" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 group p-2 hover:bg-foreground/5 rounded-2xl transition-all">
                    <div className="p-2 rounded-xl bg-foreground/5 group-hover:bg-cyan-500/10">
                       <Clock className="size-4 text-foreground/40 group-hover:text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground/80">Acceso Paciente #{100+i}</p>
                      <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Hace {i}h</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  )
}

