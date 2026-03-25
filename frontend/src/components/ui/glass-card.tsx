import * as React from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  gradient?: boolean
}

export function GlassCard({ className, hover = true, gradient = false, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-foreground/[0.03] backdrop-blur-xl p-6 rounded-3xl border border-border transition-all shadow-lg shadow-black/5',
        hover && 'hover:border-cyan-500/20 hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
