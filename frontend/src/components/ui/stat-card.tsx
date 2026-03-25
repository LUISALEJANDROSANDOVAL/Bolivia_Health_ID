import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './glass-card'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  color?: string
  className?: string
}

export function StatCard({ title, value, icon: Icon, color = 'text-cyan-500', className }: StatCardProps) {
  return (
    <GlassCard className={cn('group', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-foreground/5 group-hover:bg-cyan-500/10 transition-colors border border-border">
          <Icon className={cn('size-6 transition-colors group-hover:text-cyan-400', color)} />
        </div>
        <div className="size-2 rounded-full bg-cyan-500/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all" />
      </div>
      <div>
        <p className="text-3xl font-black text-foreground group-hover:text-cyan-400 transition-colors">{value}</p>
        <p className="text-xs font-black uppercase tracking-widest text-foreground/30 mt-2">{title}</p>
      </div>
    </GlassCard>
  )
}
