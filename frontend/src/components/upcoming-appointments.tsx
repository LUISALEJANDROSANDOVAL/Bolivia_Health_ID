'use client'

import { useState } from 'react'
import { Calendar, Clock, MapPin, Video, ChevronRight, ExternalLink, FileText, User, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppointments, AppointmentData } from '@/hooks/useAppointments'
import { useWallet } from '@/contexts/wallet-context'
import Link from 'next/link'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function UpcomingAppointments() {
  const { walletAddress } = useWallet()
  const { appointments, loading } = useAppointments(walletAddress)
  const [selectedApt, setSelectedApt] = useState<AppointmentData | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Próximas Citas</h2>
          <p className="text-sm text-foreground/50 font-medium">Tus consultas programadas</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="card-premium p-8 text-center border-dashed">
            <p className="text-foreground/40 font-bold animate-pulse">Cargando citas...</p>
          </div>
        ) : !walletAddress ? (
          <div className="card-premium p-8 text-center border-dashed">
            <Calendar className="size-12 text-foreground/10 mx-auto mb-4" />
            <p className="text-foreground/40 font-bold">Conecta tu wallet para ver tus citas</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="card-premium p-8 text-center border-dashed">
            <Calendar className="size-12 text-foreground/10 mx-auto mb-4" />
            <p className="text-foreground/40 font-bold">No tienes citas programadas</p>
            <Link href="/citas">
              <Button variant="link" className="mt-4 text-cyan-500 font-black uppercase tracking-widest text-[10px]">
                Agendar una cita →
              </Button>
            </Link>
          </div>
        ) : (
          appointments.map((apt) => (
            <div 
              key={apt.id} 
              onClick={() => setSelectedApt(apt)}
              className="relative overflow-hidden bg-foreground/[0.03] backdrop-blur-xl p-5 rounded-3xl border border-border hover:border-cyan-500/20 transition-all hover:shadow-2xl hover:shadow-cyan-500/5 group shadow-lg shadow-black/5 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start gap-4 relative z-10">
                {/* Avatar */}
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-electric text-azul-profundo font-black shadow-lg shadow-cyan-500/10">
                  {apt.doctor_name ? apt.doctor_name.substring(0, 2).toUpperCase() : 'DR'}
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-foreground group-hover:text-cyan-500 transition-colors uppercase tracking-tight">{apt.doctor_name || 'Médico'}</h3>
                      <p className="text-sm text-foreground/50 font-bold">{apt.specialty}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      apt.type === 'presencial' 
                         ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' 
                         : 'bg-turquesa/10 text-turquesa'
                    }`}>
                      {apt.type === 'presencial' ? 'Presencial' : 'Virtual'}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-foreground/40">
                    <div className="flex items-center gap-1.5 group-hover:text-foreground/60 transition-colors">
                      <Calendar className="size-3.5 text-cyan-500" />
                      <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 group-hover:text-foreground/60 transition-colors">
                      <Clock className="size-3.5 text-cyan-500" />
                      <span>{apt.appointment_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 group-hover:text-foreground/60 transition-colors overflow-hidden max-w-full">
                      {apt.type === 'presencial' ? (
                        <MapPin className="size-3.5 text-cyan-500 shrink-0" />
                      ) : (
                        <Video className="size-3.5 text-cyan-500 shrink-0" />
                      )}
                      <span className="truncate">
                        {apt.type === 'virtual' && apt.location && (apt.location.startsWith('http') || apt.location.startsWith('www')) ? (
                          <a 
                            href={apt.location.startsWith('http') ? apt.location : `https://${apt.location}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyan-500 hover:underline"
                          >
                            {apt.location.length > 30 ? apt.location.substring(0, 30) + '...' : apt.location}
                          </a>
                        ) : (
                          apt.location
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <button className="text-foreground/20 hover:text-cyan-500 transition-colors mt-1">
                    <ChevronRight className="size-5" />
                  </button>
                  {apt.type === 'virtual' && apt.location && (apt.location.startsWith('http') || apt.location.startsWith('www')) && (
                    <a 
                      href={apt.location.startsWith('http') ? apt.location : `https://${apt.location}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="size-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center hover:bg-cyan-500 hover:text-azul-profundo transition-all shadow-lg shadow-cyan-500/10 animate-pulse"
                      title="Unirse a la consulta"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalles de Cita */}
      <Dialog open={!!selectedApt} onOpenChange={(open) => !open && setSelectedApt(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none bg-background/95 backdrop-blur-3xl shadow-2xl overflow-hidden p-0">
          {selectedApt && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              {/* Header con gradiente */}
              <div className="bg-gradient-to-br from-azul-profundo to-azul-profundo/80 p-8 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Calendar className="size-24 text-cyan-500" />
                </div>
                
                <div className="relative z-10">
                  <Badge variant="outline" className="mb-4 bg-white/10 border-white/20 text-white font-black uppercase tracking-[0.2em] text-[8px]">
                    Detalles de la Consulta
                  </Badge>
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-2xl bg-gradient-electric flex items-center justify-center text-azul-profundo text-2xl font-black shadow-xl">
                      {selectedApt.doctor_name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">{selectedApt.doctor_name || 'Médico'}</h2>
                      <p className="text-cyan-400 font-bold uppercase tracking-widest text-[10px]">{selectedApt.specialty}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Fecha</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Calendar className="size-4 text-cyan-500" />
                      {new Date(selectedApt.appointment_date).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Horario</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Clock className="size-4 text-cyan-500" />
                      {selectedApt.appointment_time} {selectedApt.end_time ? `- ${selectedApt.end_time}` : ''}
                    </div>
                  </div>
                </div>

                <Separator className="bg-foreground/5" />

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Ubicación y Tipo</p>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/[0.03] border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl flex items-center justify-center ${selectedApt.type === 'virtual' ? 'bg-turquesa/10 text-turquesa' : 'bg-cyan-500/10 text-cyan-500'}`}>
                        {selectedApt.type === 'virtual' ? <Video className="size-5" /> : <MapPin className="size-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground uppercase tracking-tight">
                          {selectedApt.type === 'virtual' ? 'Consulta Virtual' : 'Consulta Presencial'}
                        </p>
                        <p className="text-[11px] font-bold text-foreground/50 truncate max-w-[200px]">
                          {selectedApt.location}
                        </p>
                      </div>
                    </div>
                    {selectedApt.type === 'virtual' && selectedApt.location?.startsWith('http') && (
                      <a 
                        href={selectedApt.location} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-cyan-500 hover:bg-cyan-400 text-azul-profundo font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                      >
                        Unirse
                      </a>
                    )}
                  </div>
                </div>

                {selectedApt.reason && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Motivo de la Cita</p>
                    <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border/50 flex gap-3">
                      <AlertCircle className="size-4 text-cyan-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-foreground/80 leading-relaxed">{selectedApt.reason}</p>
                    </div>
                  </div>
                )}

                {selectedApt.notes && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Notas e Instrucciones</p>
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                      <FileText className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-amber-600/80 leading-relaxed italic">"{selectedApt.notes}"</p>
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-4">
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-foreground/5"
                    onClick={() => setSelectedApt(null)}
                  >
                    Cerrar Detalles
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}