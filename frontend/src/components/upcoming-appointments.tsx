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
          <h2 className="text-xl font-semibold text-azul-profundo">Próximas Citas</h2>
          <p className="text-sm text-gris-grafito">Tus consultas programadas</p>
        </div>
        <Button variant="outline" size="sm" className="btn-outline-premium text-sm py-1">
          <Plus className="size-4 mr-1" />
          Agendar
        </Button>
      </div>
      
      <div className="space-y-4">
        {appointments.map((apt) => (
          <div key={apt.id} className="card-premium p-5 hover:border-azul-electrico/30 transition-all">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-electric text-white font-semibold">
                {apt.avatar}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-azul-profundo">{apt.doctor}</h3>
                    <p className="text-sm text-gris-grafito">{apt.specialty}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    apt.type === 'presencial' 
                      ? 'bg-azul-hielo text-azul-electrico' 
                      : 'bg-turquesa/10 text-turquesa'
                  }`}>
                    {apt.type === 'presencial' ? 'Presencial' : 'Virtual'}
                  </span>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gris-grafito">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4 text-azul-electrico" />
                    <span>{apt.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-4 text-azul-electrico" />
                    <span>{apt.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {apt.type === 'presencial' ? (
                      <MapPin className="size-4 text-azul-electrico" />
                    ) : (
                      <Video className="size-4 text-azul-electrico" />
                    )}
                    <span>{apt.location}</span>
                  </div>
                </div>
              </div>
              
              <button className="text-gris-grafito/40 hover:text-azul-electrico transition-colors">
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        ))}
        
        {appointments.length === 0 && (
          <div className="card-premium p-8 text-center">
            <Calendar className="size-12 text-gris-grafito/30 mx-auto mb-3" />
            <p className="text-gris-grafito">No tienes citas programadas</p>
            <Button variant="link" className="mt-2 text-azul-electrico">
              Agendar una cita
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}