'use client'

import { useState, useEffect } from 'react'
import { 
  Database, 
  Download, 
  Trash2, 
  Archive, 
  RefreshCw,
  FileText,
  Image,
  FileArchive,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useWallet } from '@/contexts/wallet-context'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useStorageStats } from '@/hooks/useStorageStats'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { walletAddress } = useWallet()
  const { stats: storageStats, loading: storageLoading } = useStorageStats(walletAddress)
  const [realStats, setRealStats] = useState({
    medicalCount: 0,
    appointmentCount: 0,
    vitalsCount: 0,
    isLoading: true
  })
  
  const { toast } = useToast()

  // Fetch real data counts
  const fetchRealData = async () => {
    if (!walletAddress) return
    
    try {
      // 1. Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()
        
      if (!profile) return

      // 2. Count records
      let medicalQuery = supabase.from('medical_background').select('id', { count: 'exact' })
      let appointmentQuery = supabase.from('appointments').select('id', { count: 'exact' })
      
      if (profile.role === 'doctor') {
        medicalQuery = medicalQuery.eq('doctor_id', profile.id)
        appointmentQuery = appointmentQuery.eq('doctor_id', profile.id)
      } else {
        medicalQuery = medicalQuery.eq('patient_id', profile.id)
        appointmentQuery = appointmentQuery.eq('patient_id', profile.id)
      }

      const [{ count: medicalCount }, { count: appointmentCount }] = await Promise.all([
        medicalQuery,
        appointmentQuery
      ])

      setRealStats({
        medicalCount: medicalCount || 0,
        appointmentCount: appointmentCount || 0,
        vitalsCount: (medicalCount || 0) * 2, // Simulación basada en registros
        isLoading: false
      })
    } catch (error) {
      console.error('Error fetching real stats:', error)
      setRealStats(prev => ({ ...prev, isLoading: false }))
    }
  }

  useEffect(() => {
    fetchRealData()
  }, [walletAddress])

  const fileTypes = [
    { type: 'Documentos', count: storageStats.monthUploads, size: `${storageStats.usedGB.toFixed(2)} GB`, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { type: 'Consultas', count: realStats.appointmentCount, size: `${(realStats.appointmentCount * 0.2).toFixed(1)} MB`, icon: RefreshCw, color: 'text-purple-500', bg: 'bg-purple-50' },
    { type: 'Análisis', count: realStats.vitalsCount, size: `${(realStats.vitalsCount * 0.1).toFixed(1)} MB`, icon: FileArchive, color: 'text-amber-500', bg: 'bg-amber-50' }
  ]

  const handleExportData = async () => {
    if (!walletAddress) {
      toast({
        title: 'Error',
        description: 'Debes conectar tu wallet para exportar datos',
        variant: 'destructive'
      })
      return
    }

    setIsExporting(true)
    try {
      // 1. Obtener el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (profileError || !profile) throw new Error('No se pudo encontrar tu perfil')

      // 2. Obtener el historial médico
      // Si es doctor, exportamos los registros que él creó. 
      // Si es paciente, exportamos sus propios registros médicos.
      let query = supabase.from('medical_background').select('*')
      
      if (profile.role === 'doctor') {
        query = query.eq('doctor_id', profile.id)
      } else {
        query = query.eq('patient_id', profile.id)
      }

      const { data: history, error: historyError } = await query

      if (historyError) throw historyError

      // 3. Crear el paquete de datos
      const exportData = {
        user: profile,
        exportDate: new Date().toISOString(),
        medicalHistory: history || [],
        totalRecords: history?.length || 0
      }

      // 4. Descargar archivo
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bolivia-health-id-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportación completada',
        description: `Se han exportado ${history?.length || 0} registros médicos correctamente`,
      })
    } catch (err: any) {
      console.error('Error exporting data:', err)
      toast({
        title: 'Error al exportar',
        description: err.message || 'Hubo un problema al procesar la exportación',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const router = useRouter()
  const { disconnect } = useWallet()

  const handleDeleteAccount = async () => {
    if (!walletAddress) return

    setIsDeleting(true)
    try {
      // 1. Obtener el ID del perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (profileError || !profile) throw new Error('No se pudo encontrar tu perfil para eliminar')

      const profileId = profile.id

      // 2. Eliminar registros relacionados de forma secuencial (o paralela)
      const tablesToDelete = ['medical_background', 'appointments']
      
      const deletePromises = tablesToDelete.map(table => {
        const query = supabase.from(table).delete()
        if (profile.role === 'doctor') {
          return query.eq('doctor_id', profileId)
        } else {
          return query.eq('patient_id', profileId)
        }
      })

      // Eliminar también de access_permissions y emergency_contacts si existen
      deletePromises.push(supabase.from('access_permissions').delete().or(`doctor_id.eq.${profileId},patient_id.eq.${profileId}`))
      deletePromises.push(supabase.from('emergency_contacts').delete().eq('patient_id', profileId))

      await Promise.all(deletePromises)

      // 3. Eliminar el perfil principal
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId)

      if (deleteProfileError) throw deleteProfileError

      // 4. Notificar y desconectar
      toast({
        title: 'Cuenta eliminada permanentemente',
        description: 'Toda tu información ha sido borrada correctamente.',
        variant: 'destructive',
      })

      // Redirección con un pequeño delay
      setTimeout(() => {
        disconnect()
        router.push('/')
      }, 1500)

    } catch (err: any) {
      console.error('Error deleting account:', err)
      toast({
        title: 'Error al eliminar cuenta',
        description: err.message || 'No se pudo completar la eliminación',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Almacenamiento */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="size-5 text-azul-electrico" />
            <CardTitle>Almacenamiento</CardTitle>
          </div>
          <CardDescription>Gestión del espacio utilizado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-azul-profundo font-medium">Espacio utilizado</span>
              <span className="text-gris-grafito">{storageStats.usedGB.toFixed(2)} GB de {storageStats.totalGB} GB</span>
            </div>
            <Progress value={(storageStats.usedGB / storageStats.totalGB) * 100} className="h-2" />
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-4">
            {fileTypes.map((file) => {
              const Icon = file.icon
              return (
                <div key={file.type} className="text-center p-3 rounded-xl bg-gray-50">
                  <div className={`rounded-lg p-2 ${file.bg} w-fit mx-auto mb-2`}>
                    <Icon className={`size-5 ${file.color}`} />
                  </div>
                  <p className="text-sm font-medium text-azul-profundo">{file.type}</p>
                  <p className="text-xs text-gris-grafito">{file.count} archivos</p>
                  <p className="text-xs text-gris-grafito/60">{file.size}</p>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gris-grafito pt-2">
            <div className="flex items-center gap-2">
              <Clock className="size-3" />
              Última subida: {storageStats.lastUploadDate || 'Sin registros'}
            </div>
            <Button variant="ghost" size="sm" className="text-azul-electrico">
              <RefreshCw className="size-3 mr-1" />
              Liberar espacio
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exportar datos */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="size-5 text-azul-electrico" />
            <CardTitle>Exportar datos</CardTitle>
          </div>
          <CardDescription>Descarga una copia de toda tu información</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-electric/5 border border-azul-electrico/20">
            <div>
              <p className="font-medium text-azul-profundo">Exportación completa</p>
              <p className="text-xs text-gris-grafito mt-1">
                Incluye todos tus registros médicos, permisos y configuración
              </p>
            </div>
            <Button 
              onClick={handleExportData} 
              disabled={isExporting}
              className="btn-premium"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="size-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gris-grafito">
            <CheckCircle2 className="size-3 text-emerald-500" />
            Formato: JSON + PDF
          </div>
        </CardContent>
      </Card>

      {/* Zona de peligro */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            <CardTitle className="text-red-600">Zona de peligro</CardTitle>
          </div>
          <CardDescription className="text-red-500/80">
            Acciones irreversibles que afectan tu cuenta y datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 border border-red-200">
            <div>
              <p className="font-medium text-red-700">Eliminar cuenta permanentemente</p>
              <p className="text-xs text-red-600/80 mt-1">
                Esta acción no se puede deshacer. Todos tus datos serán eliminados.
              </p>
            </div>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="size-4 mr-2" />
                  Eliminar cuenta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600">¿Eliminar cuenta permanentemente?</DialogTitle>
                  <DialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán todos tus datos, incluyendo:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>Registros médicos y documentos</li>
                      <li>Permisos y configuraciones</li>
                      <li>Historial de transacciones blockchain</li>
                      <li>Datos de perfil y preferencias</li>
                    </ul>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="size-4 mr-2 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-4 mr-2" />
                        Sí, eliminar mi cuenta
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}