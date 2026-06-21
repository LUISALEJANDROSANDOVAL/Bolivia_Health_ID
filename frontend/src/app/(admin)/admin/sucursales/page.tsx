'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from '@/lib/supabase'
import { createSucursal, updateSucursal, deleteSucursal } from '@/app/actions/admin'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'

type Sucursal = {
  id: string;
  name: string;
  address: string;
  coordinates: string;
}

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({ name: '', address: '', coordinates: '' })

  useEffect(() => {
    fetchSucursales()
  }, [])

  async function fetchSucursales() {
    setIsLoading(true)
    const { data, error } = await supabase.from('sucursales').select('*').order('created_at', { ascending: false })
    if (!error && data) {
      setSucursales(data)
    }
    setIsLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No estás autenticado')

      if (editingId) {
        await updateSucursal(session.access_token, editingId, formData)
        toast.success('Sucursal actualizada exitosamente')
      } else {
        await createSucursal(session.access_token, formData)
        toast.success('Sucursal creada exitosamente')
      }
      setIsModalOpen(false)
      fetchSucursales()
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No estás autenticado')
      
      await deleteSucursal(session.access_token, id)
      toast.success('Sucursal eliminada')
      fetchSucursales()
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message)
    }
  }

  function openEdit(s: Sucursal) {
    setEditingId(s.id)
    setFormData({ name: s.name, address: s.address, coordinates: s.coordinates })
    setIsModalOpen(true)
  }

  function openNew() {
    setEditingId(null)
    setFormData({ name: '', address: '', coordinates: '' })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sucursales</h1>
          <p className="text-muted-foreground">Gestiona las clínicas y ubicaciones de la red.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Sucursal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Sucursal' : 'Crear Nueva Sucursal'}</DialogTitle>
                <DialogDescription>
                  Ingresa los datos de la clínica física. Las coordenadas ayudarán a los pacientes a ubicarla.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre de la Sucursal</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                    placeholder="Ej. Clínica Alemana - Centro"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección Física</Label>
                  <Input 
                    id="address" 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    required 
                    placeholder="Ej. Av. Blanco Galindo Km 2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coordinates">Coordenadas (Lat, Lng) Opcional</Label>
                  <Input 
                    id="coordinates" 
                    value={formData.coordinates} 
                    onChange={e => setFormData({...formData, coordinates: e.target.value})} 
                    placeholder="-17.3938, -66.1569"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingId ? 'Guardar Cambios' : 'Crear Sucursal'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">Cargando sucursales...</p>
        ) : sucursales.length === 0 ? (
          <p className="text-muted-foreground col-span-full">No hay sucursales registradas. Crea una para comenzar.</p>
        ) : (
          sucursales.map(sucursal => (
            <Card key={sucursal.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-start justify-between">
                  <span>{sucursal.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
                  <span>{sucursal.address}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(sucursal)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(sucursal.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
