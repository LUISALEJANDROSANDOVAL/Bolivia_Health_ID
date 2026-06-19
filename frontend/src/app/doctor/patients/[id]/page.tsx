'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { DoctorLayout } from '@/components/doctor-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  AlertCircle,
  Heart,
  Pill,
  FileText,
  Loader2,
  UploadCloud,
  Download,
  Edit2,
  Check,
  X,
  Lock,
  Zap,
  FlaskConical,
  ScanLine,
  Dna,
  FileSpreadsheet,
  Stethoscope,
  Syringe,
  HeartPulse,
  Activity,
  Eye,
  File,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Share2,
  Calendar,
  User,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Image
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useWriteContract, useReadContract } from 'wagmi'
import { MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI } from '@/lib/contracts'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { useWallet } from '@/contexts/wallet-context'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAddress } from 'viem'

const studyTypeConfig = {
  laboratorio: {
    icon: FlaskConical,
    bg: 'bg-blue-500/15',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Laboratorio',
  },
  imagen: {
    icon: Image,
    bg: 'bg-violet-500/15',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
    label: 'Imágenes',
  },
  radiologia: {
    icon: ScanLine,
    bg: 'bg-cyan-500/15',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    label: 'Radiología',
  },
  genetico: {
    icon: Dna,
    bg: 'bg-rose-500/15',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    label: 'Genético',
  },
  otro: {
    icon: FileSpreadsheet,
    bg: 'bg-amber-500/15',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'Otro',
  },
}

const categoryConfig: Record<string, { icon: any; bg: string; color: string; border: string; label: string }> = {
  consulta: {
    icon: Stethoscope,
    bg: 'bg-blue-500/15',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Consulta',
  },
  vaccine: {
    icon: Syringe,
    bg: 'bg-purple-500/15',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    label: 'Vacuna',
  },
  surgery: {
    icon: HeartPulse,
    bg: 'bg-rose-500/15',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    label: 'Cirugía',
  },
  chronic: {
    icon: Activity,
    bg: 'bg-orange-500/15',
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    label: 'Crónico',
  },
  default: {
    icon: FileText,
    bg: 'bg-teal-500/15',
    color: 'text-teal-400',
    border: 'border-teal-500/30',
    label: 'Diagnóstico',
  },
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  Completa: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Completado' },
  Pendiente: { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-400/10',   label: 'Pendiente'  },
  default:   { icon: XCircle,      color: 'text-white/40',    bg: 'bg-white/5',         label: 'Registrado' },
}

export default function PatientView360() {
  const params = useParams()
  const patientId = params.id as string
  const { doctorId } = useDoctorAuth()
  const { writeContractAsync } = useWriteContract()
  const { walletAddress, signMessage, sessionActive, startClinicalSession, signMessageWithSession } = useWallet()

  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [vitals, setVitals] = useState<any>(null)
  const [medications, setMedications] = useState<any[]>([])
  const [background, setBackground] = useState<any[]>([])
  const [studies, setStudies] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  // Vitals Edit State
  const [isEditingVitals, setIsEditingVitals] = useState(false)
  const [isSavingVitals, setIsSavingVitals] = useState(false)
  const [editVitalsForm, setEditVitalsForm] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    weight: '',
    height: ''
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('Estudios')

  // File Preview & Drag/Drop states
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [detailMeds, setDetailMeds] = useState<any[]>([])
  const [loadingMedsForDetail, setLoadingMedsForDetail] = useState(false)

  const parseDescription = (descStr: string) => {
    if (!descStr) return {}
    const parts = descStr.split(' | ')
    const result: {
      reason?: string
      anamnesis?: string
      physicalExam?: string
      observations?: string
      ipfs?: string
      tx?: string
    } = {}

    parts.forEach(part => {
      if (part.startsWith('Motivo: ')) {
        result.reason = part.replace('Motivo: ', '')
      } else if (part.startsWith('Anamnesis: ')) {
        result.anamnesis = part.replace('Anamnesis: ', '')
      } else if (part.startsWith('Examen físico: ')) {
        result.physicalExam = part.replace('Examen físico: ', '')
      } else if (part.startsWith('Observaciones: ')) {
        result.observations = part.replace('Observaciones: ', '')
      } else if (part.startsWith('IPFS: ')) {
        result.ipfs = part.replace('IPFS: ', '')
      } else if (part.startsWith('Tx: ')) {
        result.tx = part.replace('Tx: ', '')
      }
    })
    return result
  }

  const fetchDetailMeds = async (patientId: string, diagId: string | null, dateRecorded: string) => {
    setLoadingMedsForDetail(true)
    try {
      let query = supabase
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)

      if (diagId) {
        // Si hay diagnosis_id, filtrar ÚNICAMENTE por él (el más preciso)
        query = query.eq('diagnosis_id', diagId)
      } else if (dateRecorded) {
        // Solo si no hay diagnosis_id, filtrar por fecha
        query = query.eq('start_date', dateRecorded)
      }

      const { data, error } = await query
      if (error) throw error
      setDetailMeds(data || [])
    } catch (err) {
      console.error('Error fetching detail meds:', err)
      setDetailMeds([])
    } finally {
      setLoadingMedsForDetail(false)
    }
  }

  const handleViewDetail = (item: any) => {
    setSelectedRecord(item)
    if (item.patient_id) {
      const dateStr = item.date_recorded || (item.created_at ? item.created_at.split('T')[0] : '')
      fetchDetailMeds(item.patient_id, item.diagnosis_id ?? null, dateStr)
    }
  }

  const fetchPatientData = useCallback(async () => {
    try {
      setIsLoading(true)

      // 1. Verificar si hay sesión de doctor
      if (!doctorId) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      // 2. Verificar si el doctor tiene autorización activa
      const { data: permission, error: permErr } = await supabase
        .from('access_permissions')
        .select('status')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .eq('status', 'active')
        .maybeSingle()

      if (permErr || !permission) {
        setHasPermission(false)
        setIsLoading(false)
        return
      }

      setHasPermission(true)

      // 3. Perfil
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single()

      if (profileErr) throw profileErr
      setProfile(profileData)

      // 2. Vitals
      const { data: vitalsData } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('patient_id', patientId)
        .single()

      setVitals(vitalsData || {})
      setEditVitalsForm({
        blood_pressure: vitalsData?.blood_pressure || '',
        heart_rate: vitalsData?.heart_rate || '',
        temperature: vitalsData?.temperature || '',
        weight: vitalsData?.weight || '',
        height: vitalsData?.height || ''
      })

      // 3. Medications
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')

      setMedications(medsData || [])

      // 4. Background (Condiciones crónicas y otras cosas, con relaciones)
      const { data: bgData } = await supabase
        .from('medical_background')
        .select(`
          *,
          diagnosis_catalog (
            code,
            description,
            is_chronic
          )
        `)
        .eq('patient_id', patientId)
        .not('doctor_id', 'is', null)
        .order('created_at', { ascending: false })

      // Enriquecer con nombres de médicos desde profiles_public (sin RLS restrictiva)
      const bgDoctorIds = [...new Set((bgData || []).map((r: any) => r.doctor_id).filter(Boolean))] as string[]
      let bgDoctorMap: Record<string, any> = {}
      if (bgDoctorIds.length > 0) {
        const { data: bgDoctors } = await supabase
          .from('profiles_public')
          .select('id, full_name, specialty')
          .in('id', bgDoctorIds)
        bgDoctorMap = Object.fromEntries((bgDoctors || []).map(d => [d.id, d]))
      }
      const enrichedBgData = (bgData || []).map((r: any) => ({
        ...r,
        doctor: r.doctor_id ? bgDoctorMap[r.doctor_id] ?? null : null
      }))

      setBackground(enrichedBgData)

      // 5. Studies
      const { data: recordsData } = await supabase
        .from('health_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      const realRecordsData = (recordsData || []).filter(h => !h.file_url?.startsWith('mock_'))
      setStudies(realRecordsData)

    } catch (err: any) {
      console.error(err)
      toast.error('No se pudieron cargar los datos del paciente')
    } finally {
      setIsLoading(false)
    }
  }, [patientId, doctorId])

  useEffect(() => {
    if (patientId && doctorId) {
      fetchPatientData()
    } else if (patientId && !doctorId) {
      setIsLoading(false)
      setHasPermission(false)
    }
  }, [fetchPatientData, patientId, doctorId])

  const handleSaveVitals = async () => {
    setIsSavingVitals(true)
    try {
      // 1. Verificar si ya existe un registro de vitales para este paciente
      const { data: existingVitals } = await supabase
        .from('patient_vitals')
        .select('id')
        .eq('patient_id', patientId)
        .maybeSingle()

      let dbError = null;

      if (existingVitals) {
        // Actualizar si ya existe
        const { error } = await supabase
          .from('patient_vitals')
          .update({
            blood_pressure: editVitalsForm.blood_pressure,
            heart_rate: editVitalsForm.heart_rate,
            temperature: editVitalsForm.temperature,
            weight: editVitalsForm.weight,
            height: editVitalsForm.height,
            updated_at: new Date().toISOString()
          })
          .eq('patient_id', patientId)
        dbError = error
      } else {
        // Insertar si no existe
        const { error } = await supabase
          .from('patient_vitals')
          .insert({
            patient_id: patientId,
            blood_pressure: editVitalsForm.blood_pressure,
            heart_rate: editVitalsForm.heart_rate,
            temperature: editVitalsForm.temperature,
            weight: editVitalsForm.weight,
            height: editVitalsForm.height
          })
        dbError = error
      }

      if (dbError) throw dbError

      setVitals({ ...vitals, ...editVitalsForm })
      setIsEditingVitals(false)
      toast.success('Signos vitales actualizados correctamente')
    } catch (err: any) {
      console.error("Error guardando vitales:", err)
      toast.error('Error al guardar: ' + (err.message || 'Revisa la consola para más detalles'))
    } finally {
      setIsSavingVitals(false)
    }
  }

  // 1. Fetch blockchain records
  const checksumWallet = profile?.wallet_address ? (() => { try { return getAddress(profile.wallet_address) } catch { return null } })() : null

  const { data: blockchainRecords } = useReadContract({
    address: MEDICAL_RECORDS_ADDRESS,
    abi: MEDICAL_RECORDS_ABI,
    functionName: 'getRecords',
    args: checksumWallet ? [checksumWallet as `0x${string}`] : undefined,
    query: { enabled: !!checksumWallet }
  })

  // 2. Cross-reference records with blockchain
  const verifiedRecords = useMemo(() => {
    const onChainHashes = blockchainRecords ? (blockchainRecords as any[]).map(r => r.ipfsHash) : []
    return background.map(record => {
      const desc = record.description || ''
      const ipfsMatch = desc.match(/IPFS:\s*([a-zA-Z0-9]+)/)
      const txMatch = desc.match(/Tx:\s*(0x[a-fA-F0-9]+)/)
      const ipfs = ipfsMatch ? ipfsMatch[1] : null
      const tx = txMatch ? txMatch[1] : null

      let verificationStatus: 'verified' | 'unverified' | 'tampered' = 'unverified'
      if (ipfs) {
        const existsOnChain = onChainHashes.includes(ipfs)
        verificationStatus = existsOnChain ? 'verified' : 'tampered'
      }

      return {
        ...record,
        ipfsHash: ipfs,
        txHash: tx,
        verificationStatus
      }
    })
  }, [background, blockchainRecords])

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validar archivo (máx 50MB, PDF/Imagen)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('El archivo no puede exceder los 50MB')
      return
    }
    if (!file.type.includes('pdf') && !file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos PDF o imágenes')
      return
    }

    setPendingFile(file)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Validar archivo
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('El archivo no puede exceder los 50MB')
      return
    }
    if (!file.type.includes('pdf') && !file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos PDF o imágenes')
      return
    }

    setPendingFile(file)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const handleCancelPreview = () => {
    setPendingFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleConfirmUpload = async () => {
    if (!pendingFile) return

    setUploading(true)
    try {
      if (!profile?.wallet_address) {
        throw new Error('El paciente no tiene una dirección de billetera configurada para registrar en blockchain.')
      }

      // 1. Upload to Pinata IPFS
      const formData = new FormData()
      formData.append('file', pendingFile)
      formData.append('pinataMetadata', JSON.stringify({ name: pendingFile.name }))
      
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
        throw new Error('Error al subir el archivo a IPFS (Pinata).')
      }

      const pinataData = await pinataRes.json()
      const ipfsHash = pinataData.IpfsHash

      // 2. Intentar registro on-chain (gasless)
      let txHash: string | null = null
      let signature = ''
      let sessionAddress = undefined
      let sessionAuthSignature = undefined

      const message = `Registrar expediente médico: Paciente = ${profile.wallet_address}, IPFS Hash = ${ipfsHash}`

      if (sessionActive) {
        // Firma silenciosa automática con llave de sesión
        const sessionData = await signMessageWithSession(message)
        signature = sessionData.signature
        sessionAddress = sessionData.sessionAddress
        sessionAuthSignature = sessionData.sessionAuthSignature
      } else {
        // Fallback: Firma manual
        toast.info('Blockchain', {
          description: 'Registrando estudio en la red blockchain...'
        })
        signature = await signMessage(message)
      }

      const relayerRes = await fetch('/api/blockchain/add-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: profile.wallet_address,
          ipfsHash,
          doctorAddress: walletAddress,
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

      // 3. Insert into health_records table
      const fileExt = pendingFile.name.split('.').pop()
      const fileSizeInMB = (pendingFile.size / (1024 * 1024)).toFixed(2)

      const { error: dbError } = await supabase
        .from('health_records')
        .insert({
          patient_id: patientId,
          title: pendingFile.name,
          category: selectedCategory === 'Estudios' ? 'Laboratorio' : selectedCategory === 'Medicamentos' ? 'Recetas' : 'Otros',
          file_size: `${fileSizeInMB} MB`,
          file_url: ipfsHash,
          file_type: fileExt,
          tx_hash: txHash,
          doctor_id: doctorId
        })

      if (dbError) throw dbError

      toast.success('Estudio subido a IPFS y registrado on-chain correctamente')
      handleCancelPreview()
      fetchPatientData() // Recargar estudios

    } catch (err: any) {
      console.error('Error uploading:', err)
      toast.error('Error: ' + (err.message || 'Error al subir el archivo'))
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) {
    return (
      <DoctorLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Cargando historia clínica...</p>
        </div>
      </DoctorLayout>
    )
  }

  if (hasPermission === false) {
    return (
      <DoctorLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-slide-in">
          <div className="size-20 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <Lock className="size-10 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Acceso No Autorizado</h2>
          <p className="text-sm text-foreground/50 mt-2 max-w-md">
            No tienes un permiso de acceso activo de este paciente para ver su historial clínico. Solicita autorización en el portal correspondiente.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/doctor/patients">
              <Button className="bg-foreground/10 hover:bg-foreground/20 text-foreground font-bold rounded-2xl px-6 h-12 border-none">
                Volver a Pacientes
              </Button>
            </Link>
            <Link href="/doctor/authorizations">
              <Button className="bg-gradient-electric hover:scale-105 text-white font-bold rounded-2xl px-6 h-12 border-none transition-all">
                Solicitar Acceso
              </Button>
            </Link>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  if (!profile) {
    return (
      <DoctorLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-destructive font-bold">Paciente no encontrado</p>
        </div>
      </DoctorLayout>
    )
  }

  const age = calculateAge(profile.birth_date)
  const allergiesList = vitals?.allergies ? vitals.allergies.split(',').map((a: string) => a.trim()) : []
  // Mostrar cualquier background como antecedente médico
  const chronicConditions = background

  return (
    <DoctorLayout>
      <div className="space-y-6 p-6 animate-slide-in">
        {/* Patient Header */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-accent/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{profile.full_name}</h1>
              <p className="text-muted-foreground">
                {age} años • {profile.gender === 'M' ? 'Masculino' : profile.gender === 'F' ? 'Femenino' : profile.gender || 'N/A'}
              </p>
              <p className="mt-2 font-mono text-sm text-foreground">CI: {profile.cedula_identidad}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{vitals?.blood_type || 'N/A'}</div>
              <p className="text-sm text-muted-foreground">Grupo Sanguíneo</p>
            </div>
          </div>

          {/* Alerts */}
          {allergiesList.length > 0 && (
            <div className="mt-4 space-y-2">
              {allergiesList.map((allergy: string, idx: number) => (
                <Alert key={idx} className="border-destructive bg-destructive/5">
                  <AlertCircle className="size-4 text-destructive" />
                  <AlertDescription className="text-destructive font-semibold">
                    ⚠️ ALERGIA: {allergy}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>

        {/* Control de Turno / Llaves de Sesión */}
        {!sessionActive && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-cyan-500/10 p-4 border border-cyan-500/20 animate-slide-in">
            <div className="flex items-center gap-3">
              <Zap className="size-5 text-cyan-500 animate-pulse" />
              <div>
                <p className="text-sm font-black text-foreground">Firma Silenciosa Desactivada</p>
                <p className="text-xs text-foreground/50">Habilita el modo de consulta rápida para subir estudios y registrar recetas al instante sin popups.</p>
              </div>
            </div>
            <Button 
              type="button"
              onClick={() => startClinicalSession()} 
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md border-none shrink-0"
            >
              Iniciar Turno
            </Button>
          </div>
        )}
        {sessionActive && (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20 animate-in fade-in duration-300">
            <Check className="size-5 text-emerald-500 animate-bounce" />
            <div>
              <p className="text-sm font-black text-foreground">Sesión Blockchain Activa</p>
              <p className="text-xs text-foreground/50">Los estudios clínicos y recetas se firmarán automáticamente en segundo plano.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="bg-white/50 dark:bg-azul-profundo/30 backdrop-blur-md p-1 rounded-2xl border border-azul-electrico/10 shadow-sm w-full">
            <TabsList className="grid grid-cols-3 bg-transparent h-auto p-0 border-none w-full">
              <TabsTrigger 
                value="overview"
                className="w-full px-4 md:px-6 py-2.5 rounded-xl transition-all duration-300 font-semibold
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="w-full px-4 md:px-6 py-2.5 rounded-xl transition-all duration-300 font-semibold
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Historial
              </TabsTrigger>

              <TabsTrigger 
                value="studies"
                className="w-full px-4 md:px-6 py-2.5 rounded-xl transition-all duration-300 font-semibold
                           text-gris-grafito/70 hover:text-azul-electrico hover:bg-azul-electrico/5
                           data-[state=active]:bg-azul-profundo data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Estudios
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Resumen Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Vital Signs */}
              <Card className="relative overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="size-5 text-primary" />
                    Signos Vitales Recientes
                  </CardTitle>
                  {!isEditingVitals && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingVitals(true)}
                      className="h-8 px-3 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 rounded-full"
                    >
                      <Edit2 className="size-4 mr-1.5" />
                      Editar
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {isEditingVitals ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Presión Arterial</p>
                          <Input
                            placeholder="Ej: 120/80"
                            value={editVitalsForm.blood_pressure}
                            onChange={(e) => setEditVitalsForm({ ...editVitalsForm, blood_pressure: e.target.value })}
                            className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Frec. Cardíaca</p>
                          <div className="relative">
                            <Input
                              placeholder="Ej: 72"
                              value={editVitalsForm.heart_rate}
                              onChange={(e) => setEditVitalsForm({ ...editVitalsForm, heart_rate: e.target.value })}
                              className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">bpm</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Temperatura</p>
                          <div className="relative">
                            <Input
                              placeholder="Ej: 36.5"
                              value={editVitalsForm.temperature}
                              onChange={(e) => setEditVitalsForm({ ...editVitalsForm, temperature: e.target.value })}
                              className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">°C</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Peso</p>
                          <div className="relative">
                            <Input
                              placeholder="Ej: 75"
                              value={editVitalsForm.weight}
                              onChange={(e) => setEditVitalsForm({ ...editVitalsForm, weight: e.target.value })}
                              className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">kg</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                          <p className="text-sm font-semibold text-foreground">Altura</p>
                          <div className="relative">
                            <Input
                              placeholder="Ej: 170"
                              value={editVitalsForm.height}
                              onChange={(e) => setEditVitalsForm({ ...editVitalsForm, height: e.target.value })}
                              className="h-9 bg-foreground/5 border-none focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">cm</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-3 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingVitals(false)
                            setEditVitalsForm({
                              blood_pressure: vitals?.blood_pressure || '',
                              heart_rate: vitals?.heart_rate || '',
                              temperature: vitals?.temperature || '',
                              weight: vitals?.weight || '',
                              height: vitals?.height || ''
                            })
                          }}
                          disabled={isSavingVitals}
                          className="h-8 rounded-full"
                        >
                          <X className="size-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveVitals}
                          disabled={isSavingVitals}
                          className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm"
                        >
                          {isSavingVitals ? (
                            <Loader2 className="size-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="size-4 mr-1" />
                          )}
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="flex justify-between items-center border-b border-border/50 pb-2 group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Presión Arterial</p>
                        <p className="text-lg font-bold text-foreground">{vitals?.blood_pressure || 'N/A'}</p>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/50 pb-2 group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Frecuencia Cardíaca</p>
                        <p className="text-lg font-bold text-foreground">
                          {vitals?.heart_rate ? `${vitals.heart_rate} bpm` : 'N/A'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/50 pb-2 group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Temperatura</p>
                        <p className="text-lg font-bold text-foreground">
                          {vitals?.temperature ? `${vitals.temperature} °C` : 'N/A'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/50 pb-2 group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Peso</p>
                        <p className="text-lg font-bold text-foreground">
                          {vitals?.weight ? `${vitals.weight} kg` : 'N/A'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center group/item transition-colors hover:bg-foreground/5 px-2 -mx-2 rounded-lg">
                        <p className="text-sm text-muted-foreground">Altura</p>
                        <p className="text-lg font-bold text-foreground">
                          {vitals?.height ? `${vitals.height} cm` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="size-5 text-primary" />
                    Medicamentos Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {medications.length > 0 ? (
                      medications.map((med) => (
                        <div key={med.id} className="flex items-center justify-between text-sm p-2 bg-foreground/5 rounded-lg">
                          <div>
                            <span className="text-foreground font-semibold block">{med.name}</span>
                            <span className="text-xs text-muted-foreground">{med.frequency}</span>
                          </div>
                          <Badge variant="secondary">{med.dosage}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay medicamentos activos.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chronic Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Antecedentes Médicos</CardTitle>
              </CardHeader>
              <CardContent>
                {chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {chronicConditions.map((condition) => (
                      <Badge key={condition.id} variant="outline" className="bg-red-50 text-red-800 border-red-300 px-3 py-1">
                        {condition.title}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin antecedentes registrados.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historial Tab */}
          <TabsContent value="history" className="space-y-4 mt-6">

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-azul-electrico/8 border border-azul-electrico/20 p-4 text-center">
                <p className="text-2xl font-black text-azul-profundo">{verifiedRecords.length}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-gris-grafito/60 mt-1">Total Registros</p>
              </div>
              <div className="rounded-2xl bg-emerald-500/8 border border-emerald-500/20 p-4 text-center">
                <p className="text-2xl font-black text-emerald-600">
                  {verifiedRecords.filter((r: any) => r.status_detail === 'Activo' || !r.status_detail || r.status === 'Completa' || r.status_detail === 'Completa').length}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-gris-grafito/60 mt-1">Activos / Completos</p>
              </div>
              <div className="rounded-2xl bg-violet-500/8 border border-violet-500/20 p-4 text-center">
                <p className="text-2xl font-black text-violet-600">
                  {verifiedRecords.length > 0 ? new Date(verifiedRecords[0]?.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '—'}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-gris-grafito/60 mt-1">Último Registro</p>
              </div>
            </div>

            {/* Timeline */}
            <Card className="card-premium overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-foreground/[0.02]">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-azul-profundo">
                    <Lock className="size-5 text-azul-electrico" />
                    Historial Clínico
                  </CardTitle>
                  <Badge className="bg-azul-electrico/10 text-azul-electrico border-azul-electrico/20 text-xs font-bold">
                    🔒 Inmutable · Blockchain
                  </Badge>
                </div>
                <CardDescription>Línea de tiempo clínica del paciente — registros verificados en cadena</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {verifiedRecords.length > 0 ? (
                  <div className="space-y-4">
                    {verifiedRecords.map((record: any) => {
                      const cfg = categoryConfig[record.category] ?? categoryConfig.default
                      const TypeIcon = cfg.icon
                      const scfg = statusConfig[record.status_detail || record.status] ?? statusConfig.default
                      const StatusIcon = scfg.icon

                      const parts = (record.description || '')
                        .split(' | ')
                        .filter((p: string) =>
                          !p.startsWith('IPFS:') &&
                          !p.startsWith('Tx:') &&
                          !p.match(/^0x[a-fA-F0-9]{40,}/)
                        )

                      const fileUrl = record.file_url ? (record.file_url.startsWith('http') ? record.file_url : `https://gateway.pinata.cloud/ipfs/${record.file_url}`) : undefined

                      return (
                        <div
                          key={record.id}
                          onClick={() => handleViewDetail(record)}
                          className={`${cfg.bg} border ${cfg.border} backdrop-blur-sm rounded-2xl p-5 hover:scale-[1.01] transition-all group cursor-pointer`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                            {/* Icon */}
                            <div className={`size-14 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                              <TypeIcon className={`size-7 ${cfg.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                                    {cfg.label}
                                  </span>
                                  {record.diagnosis_catalog?.is_chronic && (
                                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                      Crónico
                                    </span>
                                  )}
                                  <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full ${scfg.bg}`}>
                                    <StatusIcon className={`size-3 ${scfg.color}`} />
                                    <span className={`text-[10px] font-bold uppercase ${scfg.color}`}>{scfg.label}</span>
                                  </div>
                                  
                                  {/* Blockchain Verification Badge */}
                                  {record.verificationStatus === 'verified' && (
                                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                      <ShieldCheck className="size-3 text-emerald-400" />
                                      <span className="text-[10px] font-black uppercase text-[9px]">Verificado Blockchain</span>
                                    </div>
                                  )}
                                  {record.verificationStatus === 'tampered' && (
                                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
                                      <ShieldAlert className="size-3 text-red-400" />
                                      <span className="text-[10px] font-black uppercase text-[9px]">Datos Alterados</span>
                                    </div>
                                  )}
                                  {record.verificationStatus === 'unverified' && record.ipfsHash && (
                                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                      <Shield className="size-3 text-amber-400" />
                                      <span className="text-[10px] font-black uppercase text-[9px]">Falta Firma On-Chain</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-foreground/40">
                                  <Calendar className="size-3.5 text-cyan-500" />
                                  <span>{new Date(record.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                </div>
                              </div>

                              <h3 className={`text-base font-black text-foreground group-hover:${cfg.color} transition-colors tracking-tight`}>
                                {record.title}
                              </h3>

                              {/* CIE-10 badge */}
                              {record.diagnosis_catalog?.code && (
                                <div className="mt-1 inline-flex items-center gap-1.5 text-xs bg-foreground/10 px-2.5 py-1 rounded-lg">
                                  <span className="font-black text-cyan-400">{record.diagnosis_catalog.code}</span>
                                  {record.diagnosis_catalog.description && (
                                    <span className="text-foreground/60">{record.diagnosis_catalog.description}</span>
                                  )}
                                </div>
                              )}

                              {/* Description fields as chips */}
                              {parts.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {parts.map((part: string, i: number) => {
                                    const [label, ...rest] = part.split(': ')
                                    const val = rest.join(': ')
                                    if (!val) return (
                                      <span key={i} className="text-sm text-foreground/70">{label}</span>
                                    )
                                    return (
                                      <div key={i} className="flex items-baseline gap-1 bg-foreground/5 border border-border/30 rounded-lg px-2.5 py-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">{label}:</span>
                                        <span className="text-xs text-foreground font-semibold">{val}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Meta */}
                              <div className="mt-3 flex flex-wrap gap-4 text-xs text-foreground/40">
                                {record.doctor?.full_name && (
                                  <div className="flex items-center gap-1.5">
                                    <User className="size-3.5 text-cyan-500" />
                                    <span>Dr(a). {record.doctor.full_name}{record.doctor.specialty ? ` · ${record.doctor.specialty}` : ''}</span>
                                  </div>
                                )}
                                {fileUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 gap-1.5 ml-auto"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      try {
                                        const res = await fetch(fileUrl)
                                        const blob = await res.blob()
                                        const contentType = res.headers.get('content-type')
                                        let extension = '.pdf'
                                        if (contentType?.includes('image/png')) extension = '.png'
                                        else if (contentType?.includes('image/jpeg')) extension = '.jpg'
                                        else if (contentType?.includes('image/webp')) extension = '.webp'

                                        const url = window.URL.createObjectURL(blob)
                                        const a = document.createElement('a')
                                        a.href = url
                                        a.download = `${record.title.replace(/\s+/g, '_')}${extension}`
                                        document.body.appendChild(a)
                                        a.click()
                                        window.URL.revokeObjectURL(url)
                                        document.body.removeChild(a)
                                      } catch (err) {
                                        window.open(fileUrl, '_blank')
                                      }
                                    }}
                                  >
                                    <Download className="size-3" />
                                    Descargar
                                  </Button>
                                )}
                                {/* IPFS & Tx Links */}
                                {record.ipfsHash && (
                                  <a
                                    href={`https://gateway.pinata.cloud/ipfs/${record.ipfsHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-cyan-500 hover:underline hover:text-cyan-400"
                                  >
                                    <FileText className="size-3.5" />
                                    <span>IPFS</span>
                                  </a>
                                )}
                                {record.txHash && (
                                  <a
                                    href={`https://testnet.snowtrace.io/tx/${record.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-purple-500 hover:underline hover:text-purple-400"
                                  >
                                    <Share2 className="size-3.5" />
                                    <span>Transacción</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            <ChevronRight className={`size-5 text-foreground/20 group-hover:${cfg.color} transition-all shrink-0 self-center`} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 flex flex-col items-center">
                    <div className="size-20 rounded-2xl bg-foreground/5 border border-dashed border-border flex items-center justify-center mb-6">
                      <Lock className="size-9 text-muted-foreground/20" />
                    </div>
                    <h3 className="text-lg font-black text-azul-profundo tracking-tight">Sin registros en el historial</h3>
                    <p className="text-sm text-gris-grafito/50 mt-1 max-w-xs">
                      Los registros clínicos del paciente aparecerán aquí cuando se añadan consultas o antecedentes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estudios Tab */}
          <TabsContent value="studies" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  Estudios y Exámenes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border/50">
                      <Button
                        onClick={handleConfirmUpload}
                        disabled={uploading}
                        className="flex-1 bg-gradient-electric hover:scale-[1.02] text-white font-black rounded-xl h-12 border-none transition-all"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Subiendo y Firmando...
                          </>
                        ) : (
                          <>
                            <Check className="size-4 mr-2" />
                            Confirmar y Subir
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelPreview}
                        disabled={uploading}
                        className="flex-1 bg-transparent border-border text-foreground hover:bg-foreground/5 font-black rounded-xl h-12 transition-all"
                      >
                        <X className="size-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Drop Zone */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative rounded-xl border-2 border-dashed transition-all p-10 text-center group cursor-pointer ${
                      isDragging
                        ? 'border-cyan-500 bg-cyan-500/5'
                        : 'border-border/50 bg-foreground/5 hover:bg-foreground/10'
                    }`}
                  >
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                      <UploadCloud className="size-10 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
                      <p className="text-foreground font-semibold text-lg">
                        Arrastra archivos o haz clic para subir
                      </p>
                      <p className="text-sm text-muted-foreground">Soporta archivos PDF, JPG, PNG (máx. 20MB)</p>
                    </div>
                  </div>
                )}

                {/* List of Studies */}
                <div className="space-y-4 pt-4">
                  <h4 className="font-semibold text-foreground border-b border-border/30 pb-2">Documentos Guardados</h4>
                  {studies.length > 0 ? (
                    <div className="space-y-4">
                      {studies.map((study) => {
                        let studyType: 'laboratorio' | 'imagen' | 'radiologia' | 'genetico' | 'otro' = 'otro'
                        const cat = (study.category || '').toLowerCase()
                        if (cat === 'laboratorio' || cat === 'estudios') studyType = 'laboratorio'
                        else if (cat === 'imágenes' || cat === 'imagenes' || cat === 'imagen') studyType = 'imagen'
                        else if (cat === 'radiología' || cat === 'radiologia') studyType = 'radiologia'
                        else if (cat === 'genético' || cat === 'genetico') studyType = 'genetico'

                        const cfg = studyTypeConfig[studyType] || studyTypeConfig.otro
                        const TypeIcon = cfg.icon
                        const fileUrl = study.file_url
                          ? (study.file_url.startsWith('http') ? study.file_url : `https://gateway.pinata.cloud/ipfs/${study.file_url}`)
                          : '#'

                        return (
                          <div
                            key={study.id}
                            className={`${cfg.bg} border ${cfg.border} backdrop-blur-sm rounded-2xl p-5 hover:scale-[1.01] transition-all group`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                              {/* Icon */}
                              <div className={`size-14 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                                <TypeIcon className={`size-7 ${cfg.color}`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className={`text-lg font-black text-foreground group-hover:${cfg.color} transition-colors tracking-tight`}>
                                        {study.title}
                                      </h3>
                                      <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                                        {cfg.label}
                                      </span>
                                    </div>
                                    <p className="text-sm text-foreground/50 mt-1">
                                      {study.category} · {study.file_size}
                                    </p>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-foreground/40 hover:text-cyan-500 hover:bg-foreground/5 text-xs font-black uppercase tracking-widest"
                                      onClick={() => window.open(fileUrl, '_blank')}
                                    >
                                      <Eye className="size-4 mr-1.5" />
                                      Ver
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-foreground/40 hover:text-emerald-400 hover:bg-foreground/5"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(fileUrl)
                                          const blob = await response.blob()
                                          const contentType = response.headers.get('content-type')
                                          let extension = '.pdf'
                                          if (contentType?.includes('image/png')) extension = '.png'
                                          else if (contentType?.includes('image/jpeg')) extension = '.jpg'
                                          else if (contentType?.includes('image/webp')) extension = '.webp'
                                          
                                          const url = window.URL.createObjectURL(blob)
                                          const a = document.createElement('a')
                                          a.href = url
                                          a.download = study.title.replace(/\s+/g, '_') + extension
                                          document.body.appendChild(a)
                                          a.click()
                                          window.URL.revokeObjectURL(url)
                                          document.body.removeChild(a)
                                        } catch (error) {
                                          console.error('Error downloading file:', error)
                                          window.open(fileUrl, '_blank')
                                        }
                                      }}
                                    >
                                      <Download className="size-4" />
                                    </Button>
                                    <ChevronRight className={`size-5 text-foreground/20 group-hover:${cfg.color} transition-all translate-x-0 group-hover:translate-x-1`} />
                                  </div>
                                </div>

                                {/* Meta */}
                                <div className="mt-3 flex flex-wrap gap-5 text-xs text-foreground/40">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-cyan-500" />
                                    <span>{new Date(study.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <File className="size-3.5 text-amber-400" />
                                    <span>{study.file_size}</span>
                                  </div>
                                  {study.tx_hash && (
                                    <a
                                      href={`https://testnet.snowtrace.io/tx/${study.tx_hash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-purple-500 hover:underline hover:text-purple-400"
                                    >
                                      <Share2 className="size-3.5" />
                                      <span>Transacción Blockchain</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-foreground/5 rounded-xl border border-border/50">
                      <FileText className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-muted-foreground">No hay estudios registrados.</p>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Detalle de Diagnóstico */}
      <Dialog open={selectedRecord !== null} onOpenChange={(open) => { if (!open) setSelectedRecord(null) }}>
        <DialogContent 
          showCloseButton={false}
          className="w-full sm:max-w-3xl max-h-[85vh] rounded-2xl border-border bg-card shadow-2xl p-0 overflow-hidden flex flex-col"
        >
          {selectedRecord && (() => {
            const item = selectedRecord
            const parsed = parseDescription(item.description)
            
            return (
              <div className="flex flex-col max-h-[85vh] overflow-hidden flex-1">
                {/* Header con gradiente premium */}
                <div className="bg-gradient-premium p-6 text-white shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                        Diagnóstico Registrado
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedRecord(null)}
                        className="h-8 w-8 rounded-full text-white hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogTitle className="text-2xl font-black text-white">{item.title}</DialogTitle>
                  <DialogDescription className="sr-only">
                    Detalles del diagnóstico, caso clínico SOAP y medicamentos prescritos.
                  </DialogDescription>
                  <p className="text-white/60 text-xs mt-1 uppercase tracking-widest font-bold">
                    ID Registro: {item.id.slice(0, 8)}...
                  </p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* Datos del Diagnóstico */}
                  <div className="rounded-xl bg-muted/20 p-4 border border-muted/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Información del Registro</h4>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Paciente</p>
                        <p className="text-sm font-bold text-foreground">
                          {profile?.full_name || 'Paciente del Sistema'}
                        </p>
                        {profile?.cedula_identidad && (
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            CI: {profile.cedula_identidad}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Médico Tratante</p>
                        <p className="text-sm font-bold text-foreground">
                          {item.doctor?.full_name ? `Dr(a). ${item.doctor.full_name}` : 'Médico del Sistema'}
                        </p>
                        {item.doctor?.specialty && (
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            {item.doctor.specialty}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Fecha de Registro</p>
                        <p className="text-sm font-bold text-foreground">
                          {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SOAP / Caso Clínico */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Evaluación Clínica (SOAP)</h4>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {parsed.reason && (
                        <div className="bg-muted/10 p-3 rounded-lg border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">1. Motivo de Consulta</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{parsed.reason}</p>
                        </div>
                      )}
                      {parsed.anamnesis && (
                        <div className="bg-muted/10 p-3 rounded-lg border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">2. Anamnesis y Antecedentes</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{parsed.anamnesis}</p>
                        </div>
                      )}
                      {parsed.physicalExam && (
                        <div className="bg-muted/10 p-3 rounded-lg border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">3. Examen Físico</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{parsed.physicalExam}</p>
                        </div>
                      )}
                      {parsed.observations && (
                        <div className="bg-muted/10 p-3 rounded-lg border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Observaciones / Recomendaciones</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{parsed.observations}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medicamentos Prescritos */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Tratamiento Farmacológico</h4>
                    
                    {loadingMedsForDetail ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      </div>
                    ) : detailMeds.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No hay medicamentos registrados en este diagnóstico.</p>
                    ) : (
                      <div className="divide-y rounded-xl border overflow-hidden">
                        {detailMeds.map((med, index) => (
                          <div key={med.id} className="p-3 bg-card hover:bg-muted/20 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-black text-xs">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-black text-foreground">
                                  {med.name} <span className="text-primary font-bold text-xs ml-1">{med.dosage}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Frecuencia: {med.frequency} {med.start_date && `• Desde: ${new Date(med.start_date.replace(/-/g, '/')).toLocaleDateString('es-ES')}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Verificación Blockchain */}
                  <div className="bg-azul-profundo/95 text-white p-4 rounded-xl shadow-xl border border-white/10">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Integridad Digital Blockchain</h4>
                        <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                          {parsed.tx 
                            ? 'Este registro se encuentra firmado digitalmente e integrado de forma segura en la blockchain de Avalanche.' 
                            : 'Este diagnóstico fue registrado localmente sin firma criptográfica.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </DoctorLayout>
  )
}
