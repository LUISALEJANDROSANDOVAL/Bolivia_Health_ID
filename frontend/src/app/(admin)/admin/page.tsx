'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, UsersRound, CalendarCheck } from "lucide-react"
import { supabase } from '@/lib/supabase'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    sucursales: 0,
    medicos: 0,
    citas: 0
  })

  useEffect(() => {
    async function fetchStats() {
      const [sucursalesRes, medicosRes, citasRes] = await Promise.all([
        supabase.from('sucursales').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'medico'),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
      ])
      
      setStats({
        sucursales: sucursalesRes.count || 0,
        medicos: medicosRes.count || 0,
        citas: citasRes.count || 0
      })
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard General</h1>
      <p className="text-muted-foreground">
        Bienvenido al panel central. Gestiona las clínicas, especialistas y horarios desde aquí.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sucursales Activas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sucursales}</div>
            <p className="text-xs text-muted-foreground">
              Ubicaciones registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Médico</CardTitle>
            <UsersRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.medicos}</div>
            <p className="text-xs text-muted-foreground">
              Especialistas en la red
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Agendadas</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.citas}</div>
            <p className="text-xs text-muted-foreground">
              Volumen global
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
