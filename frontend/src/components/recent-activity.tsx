'use client'

import { useState, useEffect } from 'react'
import { FileText, Shield, Upload, Eye, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'

export function RecentActivity() {
  const { isDbConnected, walletAddress } = useWallet()
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchActivity() {
      if (!walletAddress) {
        setActivities([])
        return
      }
      setLoading(true)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()

        if (profile) {
           // Traemos las últimas subidas de archivos como actividad reciente principal
          const { data } = await supabase
            .from('health_records')
            .select('*')
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (data) {
             const mappedActivity = data.map(record => ({
                id: record.id,
                action_title: 'Documento Subido',
                action_detail: record.title,
                icon_type: 'upload',
                created_at: record.created_at
             }))
             setActivities(mappedActivity)
          }
        }
      } catch (err) {
        console.error('Error fetching activity:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isDbConnected) {
      fetchActivity()
    }
  }, [isDbConnected, walletAddress])

  const getIcon = (type: string) => {
    switch (type) {
      case 'access': return Eye
      case 'upload': return Upload
      case 'permission': return Shield
      default: return FileText
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `Hace ${minutes || 1} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Hace ${days} d`
    return date.toLocaleDateString()
  }

  if (!walletAddress) {
     return (
        <div className="animate-slide-in">
           <div className="flex items-center justify-between mb-6">
             <div>
               <h2 className="text-2xl font-black text-foreground tracking-tight">Actividad Reciente</h2>
               <p className="text-sm text-foreground/50 font-bold uppercase tracking-widest">Lo último en tu cuenta</p>
             </div>
           </div>
           <div className="relative overflow-hidden bg-foreground/[0.03] backdrop-blur-xl rounded-3xl border border-border shadow-xl shadow-black/5 mt-2">
             <div className="p-12 text-center">
                 <div className="size-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                   <Clock className="size-6 text-white/10" />
                 </div>
                 <p className="text-sm text-foreground/30 font-black uppercase tracking-widest">Conecta tu wallet para ver actividad</p>
             </div>
           </div>
        </div>
     )
  }

  return (
    <div className="animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Actividad Reciente</h2>
          <p className="text-sm text-foreground/50 font-bold uppercase tracking-widest">Lo último en tu cuenta</p>
        </div>
        <Link href="/historial" className="text-cyan-500 hover:text-turquesa font-black text-sm uppercase tracking-widest flex items-center gap-1 transition-all">
          Ver más <ChevronRight className="size-4" />
        </Link>
      </div>
      
      <div className="relative overflow-hidden bg-foreground/[0.03] backdrop-blur-xl rounded-3xl border border-border shadow-xl shadow-black/5 mt-2">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent pointer-events-none" />
        <div className="divide-y divide-border relative z-10">
          {loading ? (
            <div className="p-8 text-center text-foreground/40 animate-pulse text-sm font-bold uppercase tracking-widest">Cargando actividad...</div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="size-12 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                <Clock className="size-6 text-foreground/20" />
              </div>
              <p className="text-sm text-foreground/30 font-black uppercase tracking-widest">Sin actividad reciente</p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getIcon(activity.icon_type)
              return (
                <div key={activity.id} className="flex gap-4 p-5 hover:bg-foreground/[0.02] transition-colors group">
                  <div className="flex-shrink-0">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-foreground/5 border border-foreground/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all">
                      <Icon className="size-5 text-foreground/70 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground group-hover:text-cyan-400 transition-colors truncate">
                        {activity.action_title}
                      </p>
                      <span className="shrink-0 text-[10px] font-black uppercase tracking-tighter text-foreground/30 bg-foreground/5 px-2 py-0.5 rounded border border-foreground/5">
                        {getTimeAgo(activity.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/50 mt-1 line-clamp-1 group-hover:text-foreground/70 transition-colors font-medium">
                      {activity.action_detail}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}