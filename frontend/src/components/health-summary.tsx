'use client'

import { useState, useEffect } from 'react'
import { Droplet, AlertTriangle, Calendar, Activity, TrendingUp, TrendingDown, Weight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'

export function HealthSummary() {
  const { isDbConnected, walletAddress } = useWallet()
  const [vitals, setVitals] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchVitals() {
      if (!walletAddress) return
      setLoading(true)
      try {
        // First get profile id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()

        if (profile) {
          const { data: vitalsData } = await supabase
            .from('patient_vitals')
            .select('*')
            .eq('patient_id', profile.id)
            .single()
          
          setVitals(vitalsData)
        }
      } catch (err) {
        console.error('Error fetching vitals:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isDbConnected) {
      fetchVitals()
    }
  }, [isDbConnected, walletAddress])

  const metrics = [
    { 
      label: 'Tipo de Sangre', 
      value: vitals?.blood_type || '--', 
      icon: Droplet, 
      color: 'text-rose-500',
      bgColor: 'bg-rose-50'
    },
    { 
      label: 'Alergias', 
      value: vitals?.allergies?.length?.toString() || '0', 
      icon: AlertTriangle, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    { 
      label: 'Presión Arterial', 
      value: vitals?.blood_pressure || '--/--', 
      icon: Activity, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    { 
      label: 'Peso', 
      value: vitals?.weight ? `${vitals.weight} kg` : '-- kg', 
      icon: Weight, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
  ]

  return (
    <div className="animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Resumen de Salud</h2>
          <p className="text-sm text-foreground/50 font-bold uppercase tracking-widest">Métricas en tiempo real</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="relative overflow-hidden bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-3xl border border-border hover:border-cyan-500/20 transition-all hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1 shadow-lg shadow-black/5 group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 rounded-xl bg-foreground/5 group-hover:bg-cyan-500/10 transition-colors border border-border`}>
                <metric.icon className={`size-6 text-cyan-500`} />
              </div>
              <div className="size-2 rounded-full bg-cyan-500/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all" />
            </div>
            <div>
              <p className="text-3xl font-black text-foreground group-hover:text-cyan-400 transition-colors">
                {loading ? <span className="animate-pulse">...</span> : metric.value}
              </p>
              <p className="text-xs font-black uppercase tracking-widest text-foreground/30 mt-2 group-hover:text-foreground/50 transition-colors">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}