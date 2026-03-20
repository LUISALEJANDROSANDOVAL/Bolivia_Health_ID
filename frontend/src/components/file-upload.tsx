'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Image, X, CheckCircle2, Lock, Cloud } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface UploadedFile {
  id: string
  name: string
  size: string
  type: 'pdf' | 'image'
  progress: number
  status: 'uploading' | 'encrypting' | 'complete'
}

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const simulateUpload = useCallback((file: File) => {
    const newFile: UploadedFile = {
      id: Math.random().toString(36).slice(2, 11),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type.includes('pdf') ? 'pdf' : 'image',
      progress: 0,
      status: 'uploading',
    }

    setUploadedFiles((prev) => [...prev, newFile])

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadedFiles((prev) =>
        prev.map((f) => {
          if (f.id !== newFile.id) return f
          if (f.progress >= 100) {
            clearInterval(interval)
            return { ...f, status: 'encrypting' as const }
          }
          return { ...f, progress: Math.min(f.progress + 10, 100) }
        })
      )
    }, 200)

    // Simulate encryption phase
    setTimeout(() => {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === newFile.id ? { ...f, status: 'complete' as const } : f))
      )
    }, 3000)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      files.forEach((file) => {
        if (
          file.type === 'application/pdf' ||
          file.type.startsWith('image/')
        ) {
          simulateUpload(file)
        }
      })
    },
    [simulateUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      files.forEach((file) => simulateUpload(file))
      e.target.value = ''
    },
    [simulateUpload]
  )

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Subiendo...'
      case 'encrypting':
        return 'Cifrando...'
      case 'complete':
        return 'Subido a IPFS'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Upload className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle>Subir Archivos Médicos</CardTitle>
            <CardDescription>
              Almacena tus documentos de forma segura y descentralizada
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <input
            type="file"
            accept=".pdf,image/*"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Cloud className="size-8 text-primary" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-base font-medium text-foreground">
              Arrastra y suelta tus archivos aquí
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              o haz clic para seleccionar archivos
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2">
            <Lock className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              Tus archivos serán cifrados y subidos a IPFS
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Formatos aceptados: PDF, JPG, PNG (Máx. 50MB)
          </p>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Archivos subidos</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    {file.type === 'pdf' ? (
                      <FileText className="size-5 text-destructive" />
                    ) : (
                      <Image className="size-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      {file.status === 'complete' && (
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{file.size}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span
                        className={cn(
                          'text-xs',
                          file.status === 'complete' ? 'text-success' : 'text-primary'
                        )}
                      >
                        {getStatusText(file.status)}
                      </span>
                    </div>
                    {file.status !== 'complete' && (
                      <Progress value={file.progress} className="mt-2 h-1" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 size-8"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Eliminar archivo</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
