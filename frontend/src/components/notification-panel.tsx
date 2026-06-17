'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  X,
  MessageSquare,
  ExternalLink,
  Trash2,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'request' | 'approval' | 'prescription' | 'alert' | 'info'
  is_read: boolean
  link: string | null
  created_at: string
}

const typeConfigs = {
  request: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  approval: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  prescription: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  alert: { icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  info: { icon: MessageSquare, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
}

interface NotificationPanelProps {
  userId: string | null
}

export function NotificationPanel({ userId }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()

    // Suscribirse a nuevas notificaciones
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      }
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 text-foreground/60 hover:bg-foreground/10 hover:text-cyan-500 rounded-xl border border-transparent hover:border-border/50 transition-all group"
        >
          <Bell className="size-5 transition-transform group-hover:rotate-12" />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-black text-white shadow-[0_0_8px_rgba(34,211,238,0.5)] border-2 border-background animate-in zoom-in duration-300">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0 rounded-2xl bg-background/95 backdrop-blur-xl border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-foreground/5 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-foreground tracking-tight">Notificaciones</h3>
            {unreadCount > 0 && <Badge className="bg-cyan-500 hover:bg-cyan-600 border-none">{unreadCount} nuevas</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-cyan-500"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Marcar todo leido
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[450px]">
          {loading ? (
            <div className="flex items-center justify-center py-20 animate-pulse">
              <div className="size-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="size-16 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
                <Bell className="size-8 text-foreground/10" />
              </div>
              <p className="text-sm font-black text-foreground/40 uppercase tracking-widest">Sin notificaciones</p>
              <p className="text-xs text-foreground/20 mt-1">Te avisaremos cuando pase algo importante</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((n) => {
                const config = typeConfigs[n.type] || typeConfigs.info
                const Icon = config.icon
                return (
                  <div
                    key={n.id}
                    className={`relative p-4 flex gap-4 transition-all hover:bg-foreground/5 group ${!n.is_read ? 'bg-cyan-500/[0.03]' : ''}`}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />}

                    <div className={`size-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0 border ${config.border}`}>
                      <Icon className={`size-5 ${config.color}`} />
                    </div>

                    <div className="flex-1 space-y-1 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-black tracking-tight leading-none ${!n.is_read ? 'text-foreground' : 'text-foreground/60'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] font-bold text-foreground/20 whitespace-nowrap">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/50 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between pt-2">
                        {n.link ? (
                          <Link href={n.link} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:text-cyan-400">
                            <ExternalLink className="size-3" />
                            Ver detalles
                          </Link>
                        ) : <div />}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-foreground/20 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 bg-foreground/5 border-t border-border">
          <Button variant="ghost" className="w-full h-10 text-xs font-black uppercase tracking-widest text-foreground/40 hover:text-foreground rounded-xl">
            Ver todo el historial
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
