'use client'

import { useState } from 'react'
import { DoctorLayout } from '@/components/doctor-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Eye } from 'lucide-react'
import Link from 'next/link'

const mockPatients = [
  {
    id: '1',
    name: 'Carlos Mendoza',
    ci: '4567890',
    healthId: '0xA1B2...C3D4',
    status: 'Activo',
    lastVisit: '2024-03-20',
  },
  {
    id: '2',
    name: 'María García',
    ci: '5678901',
    healthId: '0xE5F6...G7H8',
    status: 'Activo',
    lastVisit: '2024-03-19',
  },
  {
    id: '3',
    name: 'Juan Pérez',
    ci: '6789012',
    healthId: '0xI9J0...K1L2',
    status: 'Inactivo',
    lastVisit: '2024-02-15',
  },
  {
    id: '4',
    name: 'Ana López',
    ci: '7890123',
    healthId: '0xM3N4...O5P6',
    status: 'Activo',
    lastVisit: '2024-03-21',
  },
]

export default function DoctorPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.ci.includes(searchTerm) ||
      patient.healthId.includes(searchTerm)
  )

  return (
    <DoctorLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Pacientes</h1>
          <p className="text-muted-foreground">Directorio de pacientes con acceso autorizado</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, CI o Health ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Patients Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">CI: {patient.ci}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Health ID</p>
                      <p className="font-mono text-foreground">{patient.healthId}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Última visita:</span>
                      <span className="text-foreground">{patient.lastVisit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={patient.status === 'Activo' ? 'default' : 'secondary'}
                    >
                      {patient.status}
                    </Badge>
                  </div>

                  <Link href={`/doctor/patients/${patient.id}`}>
                    <Button className="w-full" variant="default">
                      <Eye className="mr-2 size-4" />
                      Ver Historia 360
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No se encontraron pacientes</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DoctorLayout>
  )
}
