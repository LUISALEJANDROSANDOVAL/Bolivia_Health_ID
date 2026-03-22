'use client'

import { Calendar, Clock, MapPin, Video, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const appointments = [
  {
    id: 1,
    doctor: 'Dra. Ana María López',
    specialty: 'Cardiología',
    date: '25 Marzo, 2026',
    time: '10:30 AM',
    location: 'Clínica del Sur',
    type: 'presencial',
    avatar: 'AL'
  },
  {
    id: 2,
    doctor: 'Dr. Carlos Mendoza',
    specialty: 'Medicina General',
    date: '28 Marzo, 2026',
    time: '3:00 PM',
    location: 'Virtual',
    type: 'virtual',
    avatar: 'CM'
  }
]

export function UpcomingAppointments() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Próximas Citas</h2>
          <p className="text-sm text-foreground/50 font-medium">Tus consultas programadas</p>
        </div>
        <Button variant="outline" size="sm" className="btn-outline-premium text-sm py-1">
          <Plus className="size-4 mr-1" />
          Agendar
        </Button>
      </div>
      
      <div className="space-y-4">
        {appointments.map((apt) => (
          <div key={apt.id} className="relative overflow-hidden bg-foreground/[0.03] backdrop-blur-xl p-5 rounded-3xl border border-border hover:border-cyan-500/20 transition-all hover:shadow-2xl hover:shadow-cyan-500/5 group shadow-lg shadow-black/5">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start gap-4 relative z-10">
              {/* Avatar */}
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-electric text-azul-profundo font-black shadow-lg shadow-cyan-500/10">
                {apt.avatar}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-foreground group-hover:text-cyan-500 transition-colors uppercase tracking-tight">{apt.doctor}</h3>
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
                    <span>{apt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 group-hover:text-foreground/60 transition-colors">
                    <Clock className="size-3.5 text-cyan-500" />
                    <span>{apt.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 group-hover:text-foreground/60 transition-colors">
                    {apt.type === 'presencial' ? (
                      <MapPin className="size-3.5 text-cyan-500" />
                    ) : (
                      <Video className="size-3.5 text-cyan-500" />
                    )}
                    <span>{apt.location}</span>
                  </div>
                </div>
              </div>
              
              <button className="text-foreground/20 hover:text-cyan-500 transition-colors mt-1">
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        ))}
        
        {appointments.length === 0 && (
          <div className="card-premium p-8 text-center border-dashed">
            <Calendar className="size-12 text-foreground/10 mx-auto mb-4" />
            <p className="text-foreground/40 font-bold">No tienes citas programadas</p>
            <Button variant="link" className="mt-4 text-cyan-500 font-black uppercase tracking-widest text-[10px]">
              Agendar una cita →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}