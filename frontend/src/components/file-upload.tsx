'use client'

import { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle2, 
  Lock, 
  Cloud,
  AlertCircle,
  Loader2,
  File,
  Eye,
  Trash2,
  ChevronRight,
  Calendar,
  HardDrive,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface UploadedFile {
  id: string
  name: string
  size: string
  sizeBytes: number
  type: 'pdf' | 'image'
  progress: number
  status: 'uploading' | 'encrypting' | 'complete' | 'error'
  error?: string
  fileHash?: string
  timestamp: Date
}

interface FileUploadProps {
  onUploadComplete?: () => void
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploadingAll, setIsUploadingAll] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return { valid: false, error: 'El archivo no puede exceder los 50MB' }
    }
    if (!file.type.includes('pdf') && !file.type.startsWith('image/')) {
      return { valid: false, error: 'Solo se permiten archivos PDF o imágenes' }
    }
    return { valid: true }
  }

  const simulateUpload = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      toast({
        title: 'Error de validación',
        description: validation.error,
        variant: 'destructive',
      })
      return
    }

    const newFile: UploadedFile = {
      id: Math.random().toString(36).slice(2, 11),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      sizeBytes: file.size,
      type: file.type.includes('pdf') ? 'pdf' : 'image',
      progress: 0,
      status: 'uploading',
      timestamp: new Date(),
    }

    setUploadedFiles((prev) => [...prev, newFile])
    setIsUploadingAll(true)

    // Simulate upload progress
    return new Promise<void>((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15
        if (progress >= 100) {
          clearInterval(interval)
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id
                ? { ...f, progress: 100, status: 'encrypting' as const }
                : f
            )
          )
          
          // Simulate encryption phase
          setTimeout(() => {
            const hash = `Qm${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === newFile.id
                  ? { ...f, status: 'complete' as const, fileHash: hash }
                  : f
              )
            )
            toast({
              title: 'Archivo subido correctamente',
              description: `${file.name} ha sido cifrado y almacenado en IPFS`,
            })
            resolve()
            onUploadComplete?.()
          }, 1500)
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id ? { ...f, progress: Math.min(progress, 100) } : f
            )
          )
        }
      }, 200)
    })
  }, [toast, onUploadComplete])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const uploadPromises = files.map(file => simulateUpload(file))
      await Promise.all(uploadPromises)
      setIsUploadingAll(false)
    },
    [simulateUpload]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const uploadPromises = files.map(file => simulateUpload(file))
      await Promise.all(uploadPromises)
      setIsUploadingAll(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [simulateUpload]
  )

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
    toast({
      title: 'Archivo eliminado',
      description: 'El archivo ha sido removido de la lista',
    })
  }, [toast])

  const retryUpload = useCallback((file: UploadedFile) => {
    // Recreate the file from name and size (in a real app, you'd need the actual File object)
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === file.id
          ? { ...f, status: 'uploading', progress: 0, error: undefined }
          : f
      )
    )
    // Simulate upload again
    setTimeout(() => {
      simulateUpload(new File([], file.name))
    }, 100)
  }, [simulateUpload])

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Subiendo...'
      case 'encrypting':
        return 'Cifrando...'
      case 'complete':
        return 'Subido a IPFS'
      case 'error':
        return 'Error'
    }
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-500'
      case 'encrypting':
        return 'text-purple-500'
      case 'complete':
        return 'text-emerald-500'
      case 'error':
        return 'text-red-500'
    }
  }

  const getFileIcon = (type: string) => {
    if (type === 'pdf') {
      return { icon: FileText, bg: 'bg-red-50', color: 'text-red-500' }
    }
    return { icon: Image, bg: 'bg-blue-50', color: 'text-blue-500' }
  }

  const totalSize = uploadedFiles.reduce((acc, file) => acc + file.sizeBytes, 0)
  const completedFiles = uploadedFiles.filter(f => f.status === 'complete').length

  return (
    <Card className="card-premium overflow-hidden">
      <CardHeader className="border-b border-border bg-gradient-to-r from-gray-50/50 to-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
            <Upload className="size-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-black text-foreground tracking-tight">
              Subir Archivos Médicos
            </CardTitle>
            <p className="text-sm text-gris-grafito mt-0.5">
              Almacena tus documentos de forma segura y descentralizada
            </p>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-gris-grafito">Progreso total</p>
              <p className="text-sm font-black text-cyan-500">
                {completedFiles}/{uploadedFiles.length} archivos
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer',
            isDragging
              ? 'border-azul-electrico bg-azul-electrico/5'
              : 'border-gray-200 hover:border-azul-electrico/50 hover:bg-gray-50/50'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex size-16 items-center justify-center rounded-full bg-cyan-500/10 transition-transform group-hover:scale-110">
            <Cloud className="size-8 text-cyan-500" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-base font-black text-foreground uppercase tracking-tight">
              Arrastra y suelta tus archivos aquí
            </p>
            <p className="mt-1 text-sm text-gris-grafito">
              o haz clic para seleccionar archivos
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1">
              <Lock className="size-3 text-azul-electrico" />
              <span className="text-xs text-azul-electrico">Cifrado AES-256</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1">
              <Cloud className="size-3 text-purple-500" />
              <span className="text-xs text-purple-500">Almacenamiento IPFS</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1">
              <HardDrive className="size-3 text-gray-500" />
              <span className="text-xs text-gray-500">Máx. 50MB</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-gris-grafito">
            Formatos aceptados: PDF, JPG, PNG, GIF (Máx. 50MB por archivo)
          </p>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                <HardDrive className="size-4 text-cyan-500" />
                Archivos subidos ({uploadedFiles.length})
                <span className="text-xs text-gris-grafito font-normal">
                  • {(totalSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </h4>
              {isUploadingAll && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-azul-electrico" />
                  <span className="text-xs text-gris-grafito">Subiendo archivos...</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {uploadedFiles.map((file) => {
                const FileIconConfig = getFileIcon(file.type)
                const FileIcon = FileIconConfig.icon
                const statusColor = getStatusColor(file.status)

                return (
                  <div
                    key={file.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all group"
                  >
                    <div className={`flex size-12 items-center justify-center rounded-xl ${FileIconConfig.bg} shrink-0`}>
                      <FileIcon className={`size-6 ${FileIconConfig.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-foreground truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gris-grafito">{file.size}</span>
                            <span className="text-xs text-gris-grafito">•</span>
                            <span className={`text-xs ${statusColor} flex items-center gap-1`}>
                              {file.status === 'complete' && <CheckCircle2 className="size-3" />}
                              {file.status === 'uploading' && <Loader2 className="size-3 animate-spin" />}
                              {file.status === 'encrypting' && <Shield className="size-3" />}
                              {getStatusText(file.status)}
                            </span>
                            {file.fileHash && (
                              <>
                                <span className="text-xs text-gris-grafito">•</span>
                                <span className="text-xs font-mono text-gris-grafito/60 truncate max-w-[200px]">
                                  Hash: {file.fileHash.slice(0, 12)}...
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {file.status === 'complete' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gris-grafito hover:text-azul-electrico"
                              onClick={() => {
                                toast({
                                  title: 'Ver archivo',
                                  description: `Visualizando ${file.name}`,
                                })
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                          )}
                          {file.status === 'error' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gris-grafito hover:text-azul-electrico"
                              onClick={() => retryUpload(file)}
                            >
                              <Loader2 className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gris-grafito hover:text-red-500"
                            onClick={() => removeFile(file.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                          <ChevronRight className="size-4 text-gris-grafito/40 group-hover:text-azul-electrico transition-colors" />
                        </div>
                      </div>
                      
                      {file.status !== 'complete' && file.status !== 'error' && (
                        <div className="mt-2">
                          <Progress value={file.progress} className="h-1.5" />
                        </div>
                      )}
                      
                      {file.error && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="size-3" />
                          <span>{file.error}</span>
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center gap-3 text-xs text-gris-grafito/60">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          <span>{file.timestamp.toLocaleTimeString()}</span>
                        </div>
                        {file.status === 'complete' && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            <span>Verificado en blockchain</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}