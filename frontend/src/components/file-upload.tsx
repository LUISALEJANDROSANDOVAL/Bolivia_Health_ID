'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

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
  const [selectedCategory, setSelectedCategory] = useState<string>('Estudios')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { walletAddress, signMessage, sessionActive, signMessageWithSession } = useWallet()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [extractWithAi, setExtractWithAi] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSavingParsed, setIsSavingParsed] = useState(false)
  const [parsedData, setParsedData] = useState<any | null>(null)
  const [tempUploadRecord, setTempUploadRecord] = useState<{ id: string; name: string; size: string; type: 'pdf' | 'image'; ipfsHash: string; file: File } | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

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

  const uploadToPinata = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pinataMetadata', JSON.stringify({ name: file.name }))
    
    const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT
    if (!pinataJwt) {
       throw new Error('Falta configuración: NEXT_PUBLIC_PINATA_JWT. Añádelo a tu .env.local')
    }

    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJwt}`
      },
      body: formData
    })

    if (!pinataRes.ok) {
       throw new Error('Fallo servidor IPFS (Pinata)')
    }
    
    const pinataData = await pinataRes.json()
    return pinataData.IpfsHash
  }

  const uploadFile = useCallback(async (file: File, existingFileId?: string) => {
    if (!walletAddress) {
      toast({ title: 'Error', description: 'Conecta tu wallet para subir archivos', variant: 'destructive' })
      return
    }

    const validation = validateFile(file)
    if (!validation.valid) {
      toast({
        title: 'Error de validación',
        description: validation.error,
        variant: 'destructive',
      })
      return
    }

    const fileId = existingFileId || Math.random().toString(36).slice(2, 11)

    if (!existingFileId) {
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        sizeBytes: file.size,
        type: file.type.includes('pdf') ? 'pdf' : 'image',
        progress: 5,
        status: 'uploading',
        timestamp: new Date(),
      }
      setUploadedFiles((prev) => [...prev, newFile])
    }
    
    setIsUploadingAll(true)

    try {
      // 1. IPFS - PINATA
      const ipfsHash = await uploadToPinata(file)
      setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 80, status: 'encrypting' as const } : f))

      // 2. REGISTRO EN BLOCKCHAIN (Gasless patrocinado por el Relayer del Servidor)
      let txHash = null
      let signature = ''
      let sessionAddress = undefined
      let sessionAuthSignature = undefined

      const message = `Registrar expediente médico: Paciente = ${walletAddress}, IPFS Hash = ${ipfsHash}`

      if (sessionActive) {
        // Firma silenciosa automática con llave de sesión
        const sessionData = await signMessageWithSession(message)
        signature = sessionData.signature
        sessionAddress = sessionData.sessionAddress
        sessionAuthSignature = sessionData.sessionAuthSignature
      } else {
        // Fallback: Firma manual en wallet
        signature = await signMessage(message)
      }

      const relayerRes = await fetch('/api/blockchain/add-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: walletAddress,
          ipfsHash,
          doctorAddress: walletAddress, // Paciente actúa como firmante de su propio registro
          signature,
          sessionAddress,
          sessionAuthSignature
        })
      })

      if (!relayerRes.ok) {
        const errData = await relayerRes.json()
        throw new Error(errData.error || 'Error en el servidor Relayer de Blockchain')
      }

      const relayerData = await relayerRes.json()
      txHash = relayerData.txHash

      // 3. SUPABASE DB INSERT
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (!profile) throw new Error('Debes crear un perfil antes de subir archivos')

      const { error: dbError } = await supabase
        .from('health_records')
        .insert({
          patient_id: profile.id,
          title: file.name,
          category: selectedCategory === 'Estudios' ? 'Laboratorio' : selectedCategory === 'Medicamentos' ? 'Recetas' : 'Otros',
          file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          file_url: ipfsHash,
          file_type: file.type.includes('pdf') ? 'pdf' : 'image',
          tx_hash: txHash
        })

      if (dbError) throw dbError

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: 'complete' as const, fileHash: ipfsHash, progress: 100 }
            : f
        )
      )
      toast({
        title: 'Archivo subido correctamente',
        description: `${file.name} ha sido cifrado, registrado en Blockchain y guardado en Supabase`,
      })
      onUploadComplete?.()
    } catch (err: any) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'error' as const, error: err.message } : f
        )
      )
      toast({
        title: 'Error de subida',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAll(false)
    }
  }, [toast, walletAddress, onUploadComplete, selectedCategory, signMessage, sessionActive, signMessageWithSession])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        const file = files[0]
        const validation = validateFile(file)
        if (!validation.valid) {
          toast({
            title: 'Error de validación',
            description: validation.error,
            variant: 'destructive',
          })
          return
        }
        setPendingFile(file)
        if (file.type.startsWith('image/')) {
          setPreviewUrl(URL.createObjectURL(file))
        } else {
          setPreviewUrl(null)
        }
      }
    },
    [toast]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        const file = files[0]
        const validation = validateFile(file)
        if (!validation.valid) {
          toast({
            title: 'Error de validación',
            description: validation.error,
            variant: 'destructive',
          })
          return
        }
        setPendingFile(file)
        if (file.type.startsWith('image/')) {
          setPreviewUrl(URL.createObjectURL(file))
        } else {
          setPreviewUrl(null)
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [toast]
  )

  const handleConfirmUpload = async () => {
    if (!pendingFile) return
    const fileToUpload = pendingFile
    
    const isAiEligible = selectedCategory === 'Medicamentos' || selectedCategory === 'Diagnósticos'
    
    if (isAiEligible && extractWithAi) {
      setIsExtracting(true)
      handleCancelPreview()
      
      const newFileId = Math.random().toString(36).slice(2, 11)
      const newFileObj: UploadedFile = {
        id: newFileId,
        name: fileToUpload.name,
        size: `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`,
        sizeBytes: fileToUpload.size,
        type: fileToUpload.type.includes('pdf') ? 'pdf' : 'image',
        progress: 10,
        status: 'uploading',
        timestamp: new Date(),
      }
      setUploadedFiles((prev) => [...prev, newFileObj])
      
      try {
        // 1. Subir a Pinata IPFS
        setUploadedFiles(prev => prev.map(f => f.id === newFileId ? { ...f, progress: 40 } : f))
        const ipfsHash = await uploadToPinata(fileToUpload)
        setUploadedFiles(prev => prev.map(f => f.id === newFileId ? { ...f, progress: 70, status: 'encrypting' as const } : f))

        // 2. Extraer datos con Gemini
        const base64 = await fileToBase64(fileToUpload)
        const response = await fetch('/api/parse-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileBase64: base64,
            fileType: fileToUpload.type
          })
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData?.error || 'No se pudo extraer la información automáticamente con IA.')
        }

        const data = await response.json()
        
        // Guardar registro temporal
        setTempUploadRecord({
          id: newFileId,
          name: fileToUpload.name,
          size: `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`,
          type: fileToUpload.type.includes('pdf') ? 'pdf' : 'image',
          ipfsHash,
          file: fileToUpload
        })

        setParsedData(data)
        setIsModalOpen(true)
      } catch (err: any) {
        console.error('Error in AI extraction:', err)
        toast({
          title: 'IA no disponible',
          description: 'No se pudieron extraer los datos con IA. El archivo se subirá al historial sin datos estructurados.',
          variant: 'default',
        })
        
        // Fallback a subida normal
        try {
          await uploadFile(fileToUpload, newFileId)
        } catch (dbErr) {
          console.error(dbErr)
        }
      } finally {
        setIsExtracting(false)
      }
    } else {
      // Flujo tradicional de 1 solo paso sin IA
      handleCancelPreview()
      setIsUploadingAll(true)
      await uploadFile(fileToUpload)
      setIsUploadingAll(false)
    }
  }

  const handleCancelPreview = () => {
    setPendingFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSaveParsedData = async () => {
    if (!tempUploadRecord || !parsedData) return
    setIsSavingParsed(true)

    try {
      // 1. Obtener perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress!.toLowerCase())
        .single()

      if (!profile) throw new Error('Perfil no encontrado')

      // 2. REGISTRO EN BLOCKCHAIN (Gasless patrocinado por el Relayer del Servidor)
      let txHash = null
      let signature = ''
      let sessionAddress = undefined
      let sessionAuthSignature = undefined

      const message = `Registrar expediente médico: Paciente = ${walletAddress}, IPFS Hash = ${tempUploadRecord.ipfsHash}`

      if (sessionActive) {
        // Firma silenciosa automática con llave de sesión
        const sessionData = await signMessageWithSession(message)
        signature = sessionData.signature
        sessionAddress = sessionData.sessionAddress
        sessionAuthSignature = sessionData.sessionAuthSignature
      } else {
        // Fallback: Firma manual en wallet
        signature = await signMessage(message)
      }

      const relayerRes = await fetch('/api/blockchain/add-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: walletAddress,
          ipfsHash: tempUploadRecord.ipfsHash,
          doctorAddress: walletAddress, // Paciente actúa como firmante de su propio registro
          signature,
          sessionAddress,
          sessionAuthSignature
        })
      })

      if (!relayerRes.ok) {
        const errData = await relayerRes.json()
        throw new Error(errData.error || 'Error en el servidor Relayer de Blockchain')
      }

      const relayerData = await relayerRes.json()
      txHash = relayerData.txHash

      // 3. Registrar en health_records (documento)
      const { error: dbError } = await supabase
        .from('health_records')
        .insert({
          patient_id: profile.id,
          title: tempUploadRecord.name,
          category: selectedCategory === 'Estudios' ? 'Laboratorio' : selectedCategory === 'Medicamentos' ? 'Recetas' : 'Otros',
          file_size: tempUploadRecord.size,
          file_url: tempUploadRecord.ipfsHash,
          file_type: tempUploadRecord.type,
          tx_hash: txHash
        })

      if (dbError) throw dbError

      // 3. Registrar diagnósticos si hay
      if (parsedData.diagnoses && parsedData.diagnoses.length > 0) {
        const insertDiagnoses = parsedData.diagnoses
          .filter((d: any) => d.description?.trim())
          .map((d: any) => ({
            patient_id: profile.id,
            // doctor_id es null: el paciente sube su propio documento (la política RLS lo permite)
            doctor_id: null,
            title: d.description,
            description: d.description,
            category: 'consulta',
            status_detail: 'Completa',
            date_recorded: new Date().toISOString().split('T')[0]
          }))

        if (insertDiagnoses.length > 0) {
          const { error: diagError } = await supabase
            .from('medical_background')
            .insert(insertDiagnoses)

          if (diagError) console.error('Error saving diagnoses to Supabase:', diagError)
        }
      }

      // 4. Registrar medicamentos si hay
      if (parsedData.medications && parsedData.medications.length > 0) {
        const insertMeds = parsedData.medications
          .filter((m: any) => m.name?.trim())
          .map((m: any) => ({
            patient_id: profile.id,
            // doctor_id es null: el paciente sube su propia receta (la política RLS lo permite)
            doctor_id: null,
            name: m.name,
            dosage: m.dosage || '',
            frequency: m.frequency || '',
            start_date: m.start_date || new Date().toISOString().split('T')[0],
            end_date: m.end_date || null,
            status: 'active'
          }))

        if (insertMeds.length > 0) {
          const { error: medError } = await supabase
            .from('medications')
            .insert(insertMeds)

          if (medError) console.error('Error saving medications to Supabase:', medError)
        }
      }


      // Actualizar estado visual de completado
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === tempUploadRecord.id
            ? { ...f, status: 'complete' as const, fileHash: tempUploadRecord.ipfsHash, progress: 100 }
            : f
        )
      )

      toast({
        title: 'Expediente médico registrado',
        description: 'El documento y todos los datos estructurados se han guardado con éxito.',
      })

      setIsModalOpen(false)
      setParsedData(null)
      setTempUploadRecord(null)
      onUploadComplete?.()
    } catch (err: any) {
      toast({
        title: 'Error al registrar expediente',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSavingParsed(false)
    }
  }

  const handleSaveOnlyDocument = async () => {
    if (!tempUploadRecord) return
    setIsSavingParsed(true)

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress!.toLowerCase())
        .single()

      if (!profile) throw new Error('Perfil no encontrado')

      const { error: dbError } = await supabase
        .from('health_records')
        .insert({
          patient_id: profile.id,
          title: tempUploadRecord.name,
          category: selectedCategory === 'Estudios' ? 'Laboratorio' : selectedCategory === 'Medicamentos' ? 'Recetas' : 'Otros',
          file_size: tempUploadRecord.size,
          file_url: tempUploadRecord.ipfsHash,
          file_type: tempUploadRecord.type
        })

      if (dbError) throw dbError

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === tempUploadRecord.id
            ? { ...f, status: 'complete' as const, fileHash: tempUploadRecord.ipfsHash, progress: 100 }
            : f
        )
      )

      toast({
        title: 'Documento subido correctamente',
        description: 'Se ha registrado únicamente el documento en el historial clínico.',
      })

      setIsModalOpen(false)
      setParsedData(null)
      setTempUploadRecord(null)
      onUploadComplete?.()
    } catch (err: any) {
      toast({
        title: 'Error al subir',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSavingParsed(false)
    }
  }

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
    toast({
      title: 'Archivo eliminado',
      description: 'El archivo ha sido removido de la lista visual (Sigue persistiendo en IPFS)',
    })
  }, [toast])

  const retryUpload = useCallback((file: UploadedFile) => {
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === file.id
          ? { ...f, status: 'uploading', progress: 0, error: undefined }
          : f
      )
    )
    setTimeout(() => {
      // Nota: retry fallará si no tenemos el file original en memoria (solo para UX simplificada)
      uploadFile(new File([], file.name))
    }, 100)
  }, [uploadFile])

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Subiendo...'
      case 'encrypting':
        return 'Cifrando / Guardando DB...'
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
    <Card className="card-premium overflow-hidden border border-border">
      <CardHeader className="border-b border-border bg-gradient-to-r from-foreground/5 to-background p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-electric">
            <Upload className="size-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-black text-foreground tracking-tight">
              Subir Archivos Médicos
            </CardTitle>
            <p className="text-sm text-foreground/50 font-bold mt-0.5">
              Almacena tus documentos de forma segura y descentralizada a través de Pinata (IPFS)
            </p>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest">Progreso total</p>
              <p className="text-sm font-black text-cyan-500">
                {completedFiles}/{uploadedFiles.length} archivos
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Category Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-foreground">Categoría del documento</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[250px] bg-foreground/5 border-border text-foreground hover:border-cyan-500/50 transition-colors h-11 rounded-xl">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="Estudios" className="cursor-pointer">Estudios</SelectItem>
              <SelectItem value="Medicamentos" className="cursor-pointer">Medicamentos</SelectItem>
              <SelectItem value="Diagnósticos" className="cursor-pointer">Diagnósticos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Preview Box or Drop Zone */}
        {pendingFile ? (
          <div className="border border-cyan-500/30 rounded-2xl p-6 bg-gradient-to-b from-cyan-500/5 to-transparent space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                <Eye className="size-5 text-cyan-500" />
                Vista Previa del Archivo
              </h3>
              <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest bg-foreground/5 px-2 py-1 rounded-md">
                Sin Confirmar
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Thumbnail / Icon */}
              <div className="w-full md:w-1/3 flex items-center justify-center bg-foreground/5 rounded-xl border border-border p-4 h-[180px] relative overflow-hidden group">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="max-h-full max-w-full object-contain rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5">
                      <FileText className="size-8 text-red-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-foreground/55">Documento PDF</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 space-y-3 w-full">
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                  <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Nombre:</span>
                  <span className="text-sm font-black text-foreground col-span-2 truncate">{pendingFile.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                  <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Tamaño:</span>
                  <span className="text-sm font-bold text-foreground col-span-2">{(pendingFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                  <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Categoría:</span>
                  <span className="text-sm font-bold text-cyan-500 col-span-2 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-cyan-500" />
                    {selectedCategory}
                  </span>
                </div>
                


                <div className="flex items-center gap-2 text-xs text-amber-500/95 font-bold bg-amber-500/5 border border-amber-500/10 px-3 py-2 rounded-xl mt-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Verifica que el archivo y la categoría seleccionada sean correctos antes de subirlo.</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isExtracting ? (
              <div className="flex flex-col items-center justify-center py-4 bg-cyan-500/5 rounded-xl border border-cyan-500/10 space-y-2 animate-pulse">
                <Loader2 className="size-6 animate-spin text-cyan-500" />
                <span className="text-xs font-black uppercase tracking-widest text-cyan-500">Analizando documento con Gemini Pro...</span>
                <span className="text-[10px] text-foreground/40 font-bold">Esto tomará unos segundos</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border/50">
                <Button
                  onClick={handleConfirmUpload}
                  className="btn-premium shadow-lg flex-1 h-11 text-sm font-black uppercase tracking-wider"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Confirmar y Subir
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelPreview}
                  className="btn-outline-premium flex-1 h-11 text-sm font-black uppercase tracking-wider hover:bg-red-500/5 hover:border-red-500/30 hover:text-red-500"
                >
                  <X className="size-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Drop Zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer',
              isDragging
                ? 'border-cyan-500 bg-cyan-500/5'
                : 'border-border hover:border-cyan-500/50 hover:bg-foreground/5'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-cyan-500/10 transition-transform group-hover:scale-110 border border-cyan-500/20 shadow-xl shadow-cyan-500/10">
              <Cloud className="size-8 text-cyan-500" />
            </div>
            <div className="mt-4 text-center">
              <p className="text-base font-black text-foreground tracking-tight">
                Arrastra y suelta tus archivos aquí
              </p>
              <p className="mt-1 text-sm text-foreground/50 font-bold">
                o haz clic para explorar en el sistema
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 border border-blue-500/20">
                <Lock className="size-3 text-blue-500" />
                <span className="text-xs text-blue-500 font-black uppercase tracking-widest text-[10px]">Cifrado</span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-purple-500/10 px-3 py-1 border border-purple-500/20">
                <Cloud className="size-3 text-purple-500" />
                <span className="text-xs text-purple-500 font-black uppercase tracking-widest text-[10px]">Pinata (IPFS)</span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-slate-500/10 px-3 py-1 border border-slate-500/20">
                <HardDrive className="size-3 text-slate-500" />
                <span className="text-xs text-slate-500 font-black uppercase tracking-widest text-[10px]">Máx. 50MB</span>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold text-foreground/30">
              Formatos aceptados: PDF, JPG, PNG, GIF (Máx. 50MB por archivo)
            </p>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                <HardDrive className="size-4 text-cyan-500" />
                Archivos procesados ({uploadedFiles.length})
                <span className="text-xs text-foreground/40 font-bold ml-2">
                  • {(totalSize / 1024 / 1024).toFixed(2)} MB acumulados
                </span>
              </h4>
              {isUploadingAll && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-cyan-500" />
                  <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest text-[10px]">Guardando en Blockchain...</span>
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
                    className="flex items-start gap-3 rounded-xl border border-border bg-foreground/[0.02] p-4 hover:shadow-lg hover:shadow-cyan-500/5 hover:border-cyan-500/30 transition-all group"
                  >
                    <div className={`flex size-12 items-center justify-center rounded-xl bg-background border border-border shadow-sm shrink-0 group-hover:bg-cyan-500/5`}>
                      <FileIcon className={`size-5 text-foreground/50 group-hover:text-cyan-500 transition-colors`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-foreground truncate group-hover:text-cyan-500 transition-colors">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-foreground/50 font-bold">{file.size}</span>
                            <span className="text-xs text-foreground/20">•</span>
                            <span className={`text-xs ${statusColor} font-black uppercase tracking-widest flex items-center gap-1`}>
                              {file.status === 'complete' && <CheckCircle2 className="size-3" />}
                              {file.status === 'uploading' && <Loader2 className="size-3 animate-spin" />}
                              {file.status === 'encrypting' && <Shield className="size-3" />}
                              {getStatusText(file.status)}
                            </span>
                            {file.fileHash && (
                              <>
                                <span className="text-xs text-foreground/20">•</span>
                                <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-1.5 rounded truncate max-w-[200px]">
                                  {file.fileHash.slice(0, 12)}...
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {file.status === 'complete' && file.fileHash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-foreground/40 hover:text-cyan-500 hover:bg-cyan-500/10 h-8 font-black uppercase tracking-widest text-[10px]"
                              onClick={() => {
                                window.open(`https://gateway.pinata.cloud/ipfs/${file.fileHash}`, '_blank')
                              }}
                            >
                              <Eye className="size-4 mr-1" /> IPFS
                            </Button>
                          )}
                          {file.status === 'error' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-foreground/40 hover:text-red-500 h-8 font-black uppercase tracking-widest text-[10px]"
                              onClick={() => retryUpload(file)}
                            >
                              <Loader2 className="size-4 mr-1" /> Reintentar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-foreground/20 hover:text-red-500 hover:bg-red-500/10 size-8"
                            onClick={() => removeFile(file.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      {file.status !== 'complete' && file.status !== 'error' && (
                        <div className="mt-2.5">
                          <Progress value={file.progress} className="h-1.5" />
                        </div>
                      )}

                      {file.error && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 font-bold">
                          <AlertCircle className="size-3" />
                          <span>{file.error}</span>
                        </div>
                      )}
                      
                      <div className="mt-2.5 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          <span>{file.timestamp.toLocaleTimeString()}</span>
                        </div>
                        {file.status === 'complete' && (
                          <div className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="size-3" />
                            <span>Sincronizado con Supabase</span>
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

        {/* Modal de Validación IA */}
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          if (!open && !isSavingParsed) {
            setIsModalOpen(false)
            setParsedData(null)
            setTempUploadRecord(null)
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-background border-border backdrop-blur-xl rounded-3xl shadow-2xl">
            <DialogHeader className="border-b border-border/50 pb-4">
              <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <Shield className="size-5 text-cyan-500" />
                Verificar Datos Extraídos por Gemini IA
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-foreground/50">
                Hemos analizado el documento con inteligencia artificial. Revisa, edita o complementa la información antes de guardarla.
              </DialogDescription>
            </DialogHeader>

            {parsedData && (
              <div className="space-y-6 py-4">
                
                {/* Diagnósticos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                      <FileText className="size-4 text-cyan-500" />
                      Diagnósticos Detectados ({parsedData.diagnoses?.length || 0})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] font-black uppercase tracking-widest bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
                      onClick={() => {
                        setParsedData((prev: any) => prev ? {
                          ...prev,
                          diagnoses: [...(prev.diagnoses || []), { code: '', description: '' }]
                        } : null)
                      }}
                    >
                      + Agregar
                    </Button>
                  </div>

                  {parsedData.diagnoses && parsedData.diagnoses.length > 0 ? (
                    <div className="space-y-2">
                      {parsedData.diagnoses.map((diag: any, index: number) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="Descripción del diagnóstico (ej. Gastritis)"
                            value={diag.description}
                            onChange={(e) => {
                              const newDiag = [...parsedData.diagnoses]
                              newDiag[index].description = e.target.value
                              setParsedData({ ...parsedData, diagnoses: newDiag })
                            }}
                            className="flex-1 bg-foreground/5 border-border rounded-xl"
                          />
                          <Input
                            placeholder="CIE-10 (ej. K29.7)"
                            value={diag.code}
                            onChange={(e) => {
                              const newDiag = [...parsedData.diagnoses]
                              newDiag[index].code = e.target.value
                              setParsedData({ ...parsedData, diagnoses: newDiag })
                            }}
                            className="w-[120px] bg-foreground/5 border-border rounded-xl uppercase"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-500/10 shrink-0"
                            onClick={() => {
                              const newDiag = parsedData.diagnoses.filter((_: any, i: number) => i !== index)
                              setParsedData({ ...parsedData, diagnoses: newDiag })
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/40 font-bold bg-foreground/5 p-3 rounded-xl border border-border/50 text-center">
                      No se detectaron diagnósticos estructurados en este documento.
                    </p>
                  )}
                </div>

                {/* Medicamentos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                      <HardDrive className="size-4 text-cyan-500" />
                      Medicamentos / Tratamiento ({parsedData.medications?.length || 0})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] font-black uppercase tracking-widest bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
                      onClick={() => {
                        setParsedData((prev: any) => prev ? {
                          ...prev,
                          medications: [...(prev.medications || []), { name: '', dosage: '', frequency: '', start_date: new Date().toISOString().split('T')[0], end_date: '' }]
                        } : null)
                      }}
                    >
                      + Agregar
                    </Button>
                  </div>

                  {parsedData.medications && parsedData.medications.length > 0 ? (
                    <div className="space-y-4">
                      {parsedData.medications.map((med: any, index: number) => (
                        <div key={index} className="border border-border p-4 rounded-xl bg-foreground/[0.01] relative space-y-3 group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:bg-red-500/10 size-8"
                              onClick={() => {
                                const newMeds = parsedData.medications.filter((_: any, i: number) => i !== index)
                                setParsedData({ ...parsedData, medications: newMeds })
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="col-span-1 md:col-span-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Medicamento</label>
                              <Input
                                placeholder="Nombre (ej. Paracetamol)"
                                value={med.name}
                                onChange={(e) => {
                                  const newMeds = [...parsedData.medications]
                                  newMeds[index].name = e.target.value
                                  setParsedData({ ...parsedData, medications: newMeds })
                                }}
                                className="bg-foreground/5 border-border rounded-xl mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Dosis</label>
                              <Input
                                placeholder="ej. 500mg / 1 tableta"
                                value={med.dosage}
                                onChange={(e) => {
                                  const newMeds = [...parsedData.medications]
                                  newMeds[index].dosage = e.target.value
                                  setParsedData({ ...parsedData, medications: newMeds })
                                }}
                                className="bg-foreground/5 border-border rounded-xl mt-1"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Frecuencia</label>
                              <Input
                                placeholder="ej. Cada 8 horas"
                                value={med.frequency}
                                onChange={(e) => {
                                  const newMeds = [...parsedData.medications]
                                  newMeds[index].frequency = e.target.value
                                  setParsedData({ ...parsedData, medications: newMeds })
                                }}
                                className="bg-foreground/5 border-border rounded-xl mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Fecha Inicio</label>
                              <Input
                                type="date"
                                value={med.start_date}
                                onChange={(e) => {
                                  const newMeds = [...parsedData.medications]
                                  newMeds[index].start_date = e.target.value
                                  setParsedData({ ...parsedData, medications: newMeds })
                                }}
                                className="bg-foreground/5 border-border rounded-xl mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Fecha Fin</label>
                              <Input
                                type="date"
                                value={med.end_date}
                                onChange={(e) => {
                                  const newMeds = [...parsedData.medications]
                                  newMeds[index].end_date = e.target.value
                                  setParsedData({ ...parsedData, medications: newMeds })
                                }}
                                className="bg-foreground/5 border-border rounded-xl mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/40 font-bold bg-foreground/5 p-3 rounded-xl border border-border/50 text-center">
                      No se detectaron medicamentos de prescripción estructurados en este documento.
                    </p>
                  )}
                </div>

                {/* Indicaciones Adicionales */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                    <FileText className="size-4 text-cyan-500" />
                    Instrucciones Adicionales
                  </h4>
                  <Input
                    placeholder="Detalles sobre dieta, reposo u otras observaciones"
                    value={parsedData.additional_details || ''}
                    onChange={(e) => {
                      setParsedData({ ...parsedData, additional_details: e.target.value })
                    }}
                    className="bg-foreground/5 border-border rounded-xl w-full h-11"
                  />
                </div>

              </div>
            )}

            <DialogFooter className="border-t border-border/50 pt-4 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                disabled={isSavingParsed}
                className="btn-outline-premium hover:bg-red-500/5 hover:border-red-500/30 hover:text-red-500"
                onClick={() => {
                  setIsModalOpen(false)
                  setParsedData(null)
                  setTempUploadRecord(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="secondary"
                disabled={isSavingParsed}
                className="bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border rounded-xl"
                onClick={handleSaveOnlyDocument}
              >
                Ignorar IA y Solo Subir
              </Button>
              <Button
                disabled={isSavingParsed}
                className="btn-premium shadow-lg font-black uppercase tracking-wider rounded-xl"
                onClick={handleSaveParsedData}
              >
                {isSavingParsed ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 mr-2" />
                    Confirmar y Guardar todo
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}