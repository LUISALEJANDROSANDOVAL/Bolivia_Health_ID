'use client'

import { useState } from 'react'
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
  const { toast } = useToast()

  const storageStats = {
    used: 2.4,
    total: 10,
    documents: 24,
    images: 8,
    pdfs: 16,
    lastBackup: '2026-03-20'
  }

  const fileTypes = [
    { type: 'Documentos', count: 24, size: '1.8 GB', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { type: 'Imágenes', count: 8, size: '512 MB', icon: Image, color: 'text-purple-500', bg: 'bg-purple-50' },
    { type: 'Archivos', count: 16, size: '112 MB', icon: FileArchive, color: 'text-amber-500', bg: 'bg-amber-50' }
  ]

  const handleExportData = async () => {
    setIsExporting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsExporting(false)
    toast({
      title: 'Exportación completada',
      description: 'Tus datos han sido exportados correctamente',
    })
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsDeleting(false)
    setShowDeleteDialog(false)
    toast({
      title: 'Cuenta eliminada',
      description: 'Tu cuenta ha sido eliminada correctamente',
      variant: 'destructive',
    })
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
              <span className="text-gris-grafito">{storageStats.used} GB de {storageStats.total} GB</span>
            </div>
            <Progress value={(storageStats.used / storageStats.total) * 100} className="h-2" />
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
              Última copia de seguridad: {storageStats.lastBackup}
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
              <p className="font-medium text-red-700">Archivar cuenta</p>
              <p className="text-xs text-red-600/80 mt-1">
                Desactiva temporalmente tu cuenta sin perder datos
              </p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              <Archive className="size-4 mr-2" />
              Archivar
            </Button>
          </div>

          <Separator />

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