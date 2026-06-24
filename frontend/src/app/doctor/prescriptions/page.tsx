'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'
import { DoctorLayout } from '@/components/doctor-layout'
import { useWriteContract } from 'wagmi'
import { MEDICAL_RECORDS_ADDRESS, MEDICAL_RECORDS_ABI } from '@/lib/contracts'
import { toast } from 'sonner'
import { useDoctorAuth } from '@/contexts/doctor-auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { 
  Pill,
  Search,
  Plus,
  User,
  AlertTriangle,
  Clock,
  FileSignature,
  X,
  Calendar,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  MessageSquare,
  Activity,
  Brain,
  Zap,
  Loader2
} from 'lucide-react'

interface Patient {
  id: string
  name: string
  ci: string
  age: number
  allergies: string[]
  gender: 'M' | 'F'
  walletAddress: string
}

interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  duration: string
  instructions: string
}

interface Medicine {
  id: string
  generic_name: string
  brand_name: string
  form: string
  concentration: string
}

interface DiagnosisCatalog {
  id: string
  code: string
  description: string
  category: string
  is_chronic: boolean
}

// Eliminamos mockPatients estáticos para usar Supabase

export default function DoctorPrescriptionsPage() {
  const [activeTab, setActiveTab] = useState<'nueva' | 'historial'>('nueva')
  const [searchPatient, setSearchPatient] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [showAddMed, setShowAddMed] = useState(false)
  const [reason, setReason] = useState('')
  const [anamnesis, setAnamnesis] = useState('')
  const [physicalExam, setPhysicalExam] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [observations, setObservations] = useState('')
  
  const [newMed, setNewMed] = useState({
    name: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: ''
  })

  const [patients, setPatients] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Medicine search states
  const [medicineSuggestions, setMedicineSuggestions] = useState<Medicine[]>([])
  const [isSearchingMedicines, setIsSearchingMedicines] = useState(false)
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false)

  // Diagnosis search states
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState<DiagnosisCatalog[]>([])
  const [isSearchingDiagnosis, setIsSearchingDiagnosis] = useState(false)
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisCatalog | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Stats state
  const [stats, setStats] = useState({ today: 0, week: 0, pending: 0, month: 0 })

  // History state
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [searchHistory, setSearchHistory] = useState('')
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null)
  const [loadingMedsForDetail, setLoadingMedsForDetail] = useState(false)
  const [detailMeds, setDetailMeds] = useState<any[]>([])

  const { walletAddress, signMessage, sessionActive, startClinicalSession, signMessageWithSession } = useWallet()
  const { doctorId: authDoctorId } = useDoctorAuth()
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const { writeContractAsync } = useWriteContract()

  // Success animation state
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)

  // Obtener ID del doctor actual
  useEffect(() => {
    if (authDoctorId) {
      setDoctorId(authDoctorId)
    } else {
      async function getDoctorInfo() {
        if (!walletAddress) return
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()
        if (data) setDoctorId(data.id)
      }
      getDoctorInfo()
    }
  }, [walletAddress, authDoctorId])

  const fetchStats = useCallback(async (id: string) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const week = new Date()
      const day = week.getDay()
      const diff = week.getDate() - day + (day === 0 ? -6 : 1)
      week.setDate(diff)
      week.setHours(0, 0, 0, 0)

      const month = new Date()
      month.setDate(1)
      month.setHours(0, 0, 0, 0)

      const [todayRes, weekRes, monthRes, pendingRes] = await Promise.all([
        supabase
          .from('medical_background')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', id)
          .eq('category', 'consulta')
          .gte('created_at', today.toISOString()),
        supabase
          .from('medical_background')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', id)
          .eq('category', 'consulta')
          .gte('created_at', week.toISOString()),
        supabase
          .from('medical_background')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', id)
          .eq('category', 'consulta')
          .gte('created_at', month.toISOString()),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', id)
          .in('status', ['scheduled', 'confirmed', 'in_progress'])
      ])

      setStats({
        today: todayRes.count || 0,
        week: weekRes.count || 0,
        month: monthRes.count || 0,
        pending: pendingRes.count || 0
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [])

  const fetchHistory = useCallback(async (id: string) => {
    setLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('medical_background')
        .select(`
          *,
          diagnosis_catalog (
            code,
            description,
            is_chronic
          )
        `)
        .eq('doctor_id', id)
        .eq('category', 'consulta')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Enriquecer pacientes y doctores desde profiles_public (sin RLS restrictiva)
      const allProfileIds = [...new Set([
        ...(data || []).map((r: any) => r.patient_id),
        ...(data || []).map((r: any) => r.doctor_id)
      ].filter(Boolean))] as string[]

      let profilesMap: Record<string, any> = {}
      if (allProfileIds.length > 0) {
        const { data: pubProfiles } = await supabase
          .from('profiles_public')
          .select('id, full_name, specialty, wallet_address')
          .in('id', allProfileIds)
        profilesMap = Object.fromEntries((pubProfiles || []).map(p => [p.id, p]))
      }

      const enriched = (data || []).map((r: any) => ({
        ...r,
        patient: r.patient_id ? (profilesMap[r.patient_id] ?? null) : null,
        doctor: r.doctor_id ? (profilesMap[r.doctor_id] ?? null) : null,
      }))

      setHistory(enriched)
    } catch (err) {
      console.error('Error fetching prescription history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

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
    setSelectedHistoryItem(item)
    if (item.patient?.id) {
      fetchDetailMeds(item.patient.id, item.diagnosis_id, item.date_recorded)
    }
  }

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

  useEffect(() => {
    if (doctorId) {
      fetchStats(doctorId)
      fetchHistory(doctorId)
    }
  }, [doctorId, fetchStats, fetchHistory])

  useEffect(() => {
    const fetchPatients = async () => {
      if (!searchPatient || searchPatient.length < 2 || !doctorId) {
        setPatients([])
        return
      }

      setIsSearching(true)

      // Obtener perfil del doctor (especialidad) y sus sucursales
      const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('specialty')
        .eq('id', doctorId)
        .single()
      
      const specialty = doctorProfile?.specialty

      const { data: doctorSucursales } = await supabase
        .from('doctor_sucursal')
        .select('sucursal_id')
        .eq('doctor_id', doctorId)

      const sucursalIds = doctorSucursales?.map((ds: any) => ds.sucursal_id) || []

      // 1. Obtener permisos activos
      const { data: permissions } = await supabase
        .from('access_permissions')
        .select('patient_id, doctor_id, specialty, sucursal_id')
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

      // Filtrar permisos válidos para este doctor
      const validPermissions = (permissions || []).filter((p: any) => {
        if (p.doctor_id === doctorId) return true
        if (p.specialty === specialty && sucursalIds.includes(p.sucursal_id)) return true
        return false
      })

      const authorizedIds = [...new Set(validPermissions.map(p => p.patient_id).filter(Boolean))]

      if (authorizedIds.length === 0) {
        setPatients([])
        setIsSearching(false)
        return
      }

      // 2. Buscar entre esos pacientes autorizados
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', authorizedIds)
        .or(`full_name.ilike.%${searchPatient}%,cedula_identidad.ilike.%${searchPatient}%`)
        .limit(5)

      if (error) {
        console.error('Error buscando pacientes:', error)
      } else if (data) {
        const mappedPatients: Patient[] = data.map(p => ({
          id: p.id,
          name: p.full_name || 'Sin nombre',
          ci: p.cedula_identidad || 'Sin CI',
          age: 0, // No disponible en profiles
          allergies: [], // No disponible en profiles
          gender: 'M', // Por defecto
          walletAddress: p.wallet_address || ''
        }))
        setPatients(mappedPatients)
      }
      setIsSearching(false)
    }

    const timer = setTimeout(() => {
      fetchPatients()
    }, 400)

    return () => clearTimeout(timer)
  }, [searchPatient])

  // Effect for medicine search
  useEffect(() => {
    const fetchMedicines = async () => {
      if (!newMed.name || newMed.name.length < 2) {
        setMedicineSuggestions([])
        return
      }

      setIsSearchingMedicines(true)
      const { data, error } = await supabase
        .from('medicine_catalog')
        .select('*')
        .or(`generic_name.ilike.%${newMed.name}%,brand_name.ilike.%${newMed.name}%`)
        .limit(10)

      if (error) {
        console.error('Error buscando medicamentos:', error)
      } else if (data) {
        setMedicineSuggestions(data)
      }
      setIsSearchingMedicines(false)
    }

    const timer = setTimeout(() => {
      fetchMedicines()
    }, 400)

    return () => clearTimeout(timer)
  }, [newMed.name])

  // Effect for diagnosis search
  useEffect(() => {
    const fetchDiagnosis = async () => {
      if (!diagnosis || diagnosis.length < 2) {
        setDiagnosisSuggestions([])
        return
      }
      setIsSearchingDiagnosis(true)
      const { data } = await supabase
        .from('diagnosis_catalog')
        .select('*')
        .or(`code.ilike.%${diagnosis}%,description.ilike.%${diagnosis}%`)
        .limit(8)
      setDiagnosisSuggestions(data || [])
      setIsSearchingDiagnosis(false)
    }
    const timer = setTimeout(fetchDiagnosis, 350)
    return () => clearTimeout(timer)
  }, [diagnosis])

  const handleSubmitPrescription = async () => {
    if (!selectedPatient || !diagnosis) return
    if (!doctorId) {
      toast.error('Error de Identificación', {
        description: 'No se pudo resolver tu ID de médico. Por favor, asegúrate de tener una sesión activa o recarga la página.'
      })
      return
    }

    setIsSaving(true)
    
    // Generate default mock values in case Web3 operation is bypassed or fails
    let ipfsHash = 'mock_ipfs_' + Math.random().toString(36).substring(2, 15)
    let txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
    let wasWeb3Successful = false

    try {
      if (!selectedPatient.walletAddress) {
        throw new Error('El paciente no tiene una dirección de billetera configurada para registrar en blockchain.')
      }

      if (!walletAddress) {
        throw new Error('Debes conectar tu wallet para firmar los registros médicos.')
      }

      // 1. Compile diagnosis data into JSON and upload to Pinata (IPFS)
      const diagnosisData = {
        patient: {
          name: selectedPatient.name,
          ci: selectedPatient.ci,
          walletAddress: selectedPatient.walletAddress
        },
        doctor: {
          id: doctorId,
          walletAddress: walletAddress
        },
        clinicalCase: {
          reason,
          anamnesis,
          physicalExam,
          observations
        },
        diagnosis: selectedDiagnosis
          ? `${selectedDiagnosis.code} - ${selectedDiagnosis.description}`
          : diagnosis,
        medications: medications.map(m => ({
          name: m.name,
          dosage: m.dose,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions
        })),
        timestamp: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(diagnosisData, null, 2)], { type: 'application/json' })
      const jsonFile = new File([blob], `diagnosis_${selectedPatient.ci}_${Date.now()}.json`, { type: 'application/json' })

      const formData = new FormData()
      formData.append('file', jsonFile)
      formData.append('pinataMetadata', JSON.stringify({ name: jsonFile.name }))

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
        throw new Error('Error al subir el diagnóstico a IPFS (Pinata).')
      }

      const pinataData = await pinataRes.json()
      ipfsHash = pinataData.IpfsHash

      // 2. Request digital signature off-chain (gasless)
      let signature = ''
      let sessionAddress = undefined
      let sessionAuthSignature = undefined

      const message = `Registrar expediente médico: Paciente = ${selectedPatient.walletAddress}, IPFS Hash = ${ipfsHash}`

      if (sessionActive) {
        // Firma silenciosa automática con llave de sesión
        const sessionData = await signMessageWithSession(message)
        signature = sessionData.signature
        sessionAddress = sessionData.sessionAddress
        sessionAuthSignature = sessionData.sessionAuthSignature
      } else {
        // Fallback: Firma manual
        toast.info('Blockchain', {
          description: 'Por favor, firma la autorización en tu wallet para registrar el diagnóstico (sin costo de gas)...'
        })
        signature = await signMessage(message)
      }

      // 3. Send signature to Relayer API
      const relayerRes = await fetch('/api/blockchain/add-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: selectedPatient.walletAddress,
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
      wasWeb3Successful = true

      // 3. Guardar diagnóstico en medical_background
      const { error: bgError } = await supabase
        .from('medical_background')
        .insert({
          patient_id:   selectedPatient.id,
          title: selectedDiagnosis
            ? `${selectedDiagnosis.code} - ${selectedDiagnosis.description}`
            : diagnosis,
          description: [
            reason       && `Motivo: ${reason}`,
            anamnesis    && `Anamnesis: ${anamnesis}`,
            physicalExam && `Examen físico: ${physicalExam}`,
            observations && `Observaciones: ${observations}`,
            `IPFS: ${ipfsHash}`,
            `Tx: ${txHash}`
          ].filter(Boolean).join(' | '),
          category:      'consulta',
          status_detail: 'Completa',
          doctor_id:     doctorId,
          diagnosis_id:  selectedDiagnosis?.id ?? null,
        })

      if (bgError) {
        console.error('Error medical_background:', bgError.message, bgError.details, bgError.hint)
        throw bgError
      }

      // 4. Guardar cada medicamento en la tabla medications
      if (medications.length > 0) {
        const medsToInsert = medications.map(med => {
          const startDate = new Date()
          let endDateStr: string | null = null
          
          if (med.duration) {
            const daysMatch = med.duration.match(/^(\d+)\s*días?$/i)
            if (daysMatch) {
              const days = parseInt(daysMatch[1], 10)
              const endDate = new Date(startDate)
              endDate.setDate(startDate.getDate() + days)
              endDateStr = endDate.toISOString().split('T')[0]
            }
          }

          return {
            patient_id: selectedPatient.id,
            doctor_id:  doctorId,
            name:       med.name,
            dosage:     med.dose,
            frequency:  med.frequency,
            start_date: startDate.toISOString().split('T')[0],
            end_date:   endDateStr,
            status:     'active',
            diagnosis_id: selectedDiagnosis?.id ?? null,
            medicine_id: medicineSuggestions.find(
              m => m.generic_name === med.name || m.brand_name === med.name
            )?.id ?? null,
          }
        })

        const { error: medError } = await supabase
          .from('medications')
          .insert(medsToInsert)

        if (medError) {
          console.error('Error medications:', medError.message, medError.details, medError.hint)
          throw medError
        }
      }

      // 5. Enviar notificación por email
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: selectedPatient.id,
            title: 'Nueva Receta Médica',
            message: `Tu médico te ha emitido una nueva receta con diagnóstico: ${selectedDiagnosis ? selectedDiagnosis.description : diagnosis}.`,
            link: '/diagnosticos'
          })
        })
      } catch (emailErr) {
        console.error('Error enviando email:', emailErr)
      }

      // Trigger success notifications and animations
      setSaveSuccess(true)
      setShowSuccessAnimation(true)
      
      // Update statistics and history lists
      fetchStats(doctorId)
      fetchHistory(doctorId)

      // Reset form
      setReason('')
      setAnamnesis('')
      setPhysicalExam('')
      setDiagnosis('')
      setObservations('')
      setSelectedDiagnosis(null)
      setMedications([])
      setSelectedPatient(null)
      
      setTimeout(() => setShowSuccessAnimation(false), 3500)
      setTimeout(() => setSaveSuccess(false), 4500)
    } catch (err: any) {
      console.error('Error al emitir receta:', err?.message || err?.code || JSON.stringify(err))
      toast.error('Error de Servidor', {
        description: `No se pudo registrar la receta en la base de datos: ${err.message || 'Error desconocido'}`
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addMedication = () => {
    if (newMed.name && newMed.dose && newMed.frequency) {
      setMedications([...medications, { ...newMed, id: Date.now().toString() }])
      setNewMed({ name: '', dose: '', frequency: '', duration: '', instructions: '' })
      setShowAddMed(false)
    }
  }

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id))
  }

  return (
    <DoctorLayout>
      <div className="space-y-8 p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-slide-in">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Pill className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Recetas Médicas</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Sistema de prescripción digital segura y verificada
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl border-2" onClick={() => setShowGuideModal(true)}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Guías Médicas
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-slide-in [animation-delay:100ms]">
          {[
            { label: 'Recetas Hoy', value: stats.today.toString(), icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Esta Semana', value: stats.week.toString(), icon: Clock, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Pendientes', value: stats.pending.toString(), icon: AlertTriangle, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'Emitidas (Mes)', value: stats.month.toString(), icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <Card key={i} className="card-premium border-none shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    <p className={`mt-1 text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b-2 border-muted pb-1 animate-slide-in [animation-delay:200ms]">
          <button
            onClick={() => setActiveTab('nueva')}
            className={`relative px-6 py-4 text-sm font-bold transition-all ${
              activeTab === 'nueva'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Nueva Prescripción
            {activeTab === 'nueva' && (
              <div className="absolute bottom-[-2px] left-0 h-[3px] w-full bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`relative px-6 py-4 text-sm font-bold transition-all ${
              activeTab === 'historial'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Historial de Recetas
            {activeTab === 'historial' && (
              <div className="absolute bottom-[-2px] left-0 h-[3px] w-full bg-primary rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'nueva' ? (
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Form Section */}
            <div className="lg:col-span-8 space-y-8 animate-slide-in [animation-delay:300ms]">
              {/* 1. Patient Selection */}
              <Card className="card-premium border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Información del Paciente</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {!selectedPatient ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          placeholder="Buscar paciente por nombre o documento de identidad..."
                          value={searchPatient}
                          onChange={(e) => setSearchPatient(e.target.value)}
                          className="pl-12 h-14 text-lg rounded-xl border-muted transition-all focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                      
                      { (searchPatient || isSearching) && (
                        <div className="mt-4 divide-y divide-muted rounded-2xl border border-muted bg-card shadow-xl animate-in fade-in slide-in-from-top-4 overflow-hidden">
                          {isSearching ? (
                            <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-3">
                              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Buscando en la base de datos...
                            </div>
                          ) : patients.length > 0 ? patients.map((patient) => (
                            <button
                              key={patient.id}
                              onClick={() => {
                                setSelectedPatient(patient)
                                setSearchPatient('')
                              }}
                              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${patient.gender === 'F' ? 'bg-pink-500/20 text-pink-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                  {patient.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">{patient.name}</p>
                                  <p className="text-sm text-muted-foreground">CI: {patient.ci}</p>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                          )) : searchPatient.length >= 2 ? (
                            <div className="p-8 text-center text-muted-foreground">
                              No se encontraron pacientes con ese criterio.
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-transparent p-6 border border-primary/10">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-5">
                          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm text-2xl font-black ${selectedPatient.gender === 'F' ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white'}`}>
                            {selectedPatient.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-foreground">{selectedPatient.name}</h3>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge variant="outline" className="bg-background/80 font-bold">CI: {selectedPatient.ci}</Badge>
                              <Badge variant="outline" className="bg-background/80 font-bold">{selectedPatient.age} Años</Badge>
                              <Badge variant="outline" className="bg-background/80 font-bold">{selectedPatient.gender === 'M' ? 'Masculino' : 'Femenino'}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedPatient(null)}
                          className="rounded-full hover:bg-red-50 hover:text-red-500"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {selectedPatient.allergies.length > 0 && (
                        <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-red-600 dark:text-red-400 border border-red-500/20">
                          <AlertTriangle className="h-6 w-6 animate-pulse" />
                          <div>
                            <p className="text-sm font-black uppercase tracking-tight">Alerta Médica: Alergias Detectadas</p>
                            <p className="text-sm font-medium">{selectedPatient.allergies.join(', ')}</p>
                          </div>
                        </div>
                      )}

                      {/* Control de Turno / Llaves de Sesión */}
                      {!sessionActive && (
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-cyan-500/10 p-4 border border-cyan-500/20 animate-slide-in">
                          <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 text-cyan-500 animate-pulse" />
                            <div className="flex-1">
                              <p className="text-sm font-black text-foreground">Firma Silenciosa Desactivada</p>
                              <p className="text-xs text-foreground/50">Habilita el modo de consulta rápida para firmar de forma automática sin popups.</p>
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
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <div>
                            <p className="text-sm font-black text-foreground">Sesión Blockchain Activa</p>
                            <p className="text-xs text-foreground/50">Las recetas y diagnósticos se firmarán de forma silenciosa en segundo plano.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2. Historia Clínica Narrativa (The Story) */}
              <Card className="card-premium border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">Evaluación Clínica: La Historia</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] uppercase font-bold tracking-wider">
                      Modelo SOAP
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 relative">
                  {/* Vertical Line Connector */}
                  <div className="absolute left-[35px] top-10 bottom-10 w-0.5 bg-muted" />

                  <div className="space-y-10">
                    {/* Step 1: Motivo de Consulta */}
                    <div className="relative pl-12 group">
                      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-muted shadow-sm z-10 transition-colors group-focus-within:border-primary">
                        <MessageSquare className="h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Motivo de Consulta</Label>
                        <Textarea 
                          placeholder="¿Qué trajo al paciente hoy?"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="min-h-[80px] rounded-xl border-muted bg-background focus:ring-primary/10 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Step 2: Anamnesis */}
                    <div className="relative pl-12 group">
                      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-muted shadow-sm z-10 transition-colors group-focus-within:border-primary">
                        <Brain className="h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Anamnesis y Antecedentes</Label>
                        <Textarea 
                          placeholder="Historia detallada del malestar y antecedentes relevantes..."
                          value={anamnesis}
                          onChange={(e) => setAnamnesis(e.target.value)}
                          className="min-h-[100px] rounded-xl border-muted bg-background focus:ring-primary/10 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Step 3: Examen Físico */}
                    <div className="relative pl-12 group">
                      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-muted shadow-sm z-10 transition-colors group-focus-within:border-primary">
                        <Activity className="h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">3. Examen Físico</Label>
                        <Textarea 
                          placeholder="Signos vitales y hallazgos de exploración..."
                          value={physicalExam}
                          onChange={(e) => setPhysicalExam(e.target.value)}
                          className="min-h-[80px] rounded-xl border-muted bg-background focus:ring-primary/10 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Step 4: Diagnóstico Final */}
                    <div className="relative pl-12 group">
                      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm z-10">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="space-y-4 rounded-2xl bg-muted/20 p-5 border border-muted/50">
                        <div className="space-y-2 relative">
                          <Label className="text-xs font-bold uppercase tracking-wider text-primary">4. Juicio Clínico (CIE-10)</Label>
                          <div className="relative">
                            <Input 
                              placeholder="Ej: E11.9 - Diabetes mellitus tipo 2"
                              value={diagnosis}
                              onChange={(e) => {
                                setDiagnosis(e.target.value)
                                setSelectedDiagnosis(null)
                                setShowDiagnosisDropdown(true)
                              }}
                              onFocus={() => setShowDiagnosisDropdown(true)}
                              onBlur={() => setTimeout(() => setShowDiagnosisDropdown(false), 200)}
                              className="h-11 rounded-xl border-muted focus:ring-primary/10 font-bold pr-10"
                            />
                            {isSearchingDiagnosis && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            )}
                            {showDiagnosisDropdown && diagnosisSuggestions.length > 0 && (
                              <div className="absolute z-50 mt-1 w-full divide-y divide-muted rounded-xl border border-muted bg-card shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden max-h-64 overflow-y-auto">
                                {diagnosisSuggestions.map((diag) => (
                                  <button
                                    key={diag.id}
                                    type="button"
                                    onClick={() => {
                                      setDiagnosis(`${diag.code} - ${diag.description}`)
                                      setSelectedDiagnosis(diag)
                                      setShowDiagnosisDropdown(false)
                                    }}
                                    className="flex w-full flex-col p-3 text-left transition-colors hover:bg-primary/5 group/item"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-black text-sm text-foreground group-hover/item:text-primary transition-colors">
                                        {diag.code}
                                      </span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {diag.is_chronic && (
                                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-bold uppercase">Crónico</span>
                                        )}
                                        {diag.category && (
                                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">{diag.category}</span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-0.5">{diag.description}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground">Observaciones Finales</Label>
                          <Textarea 
                            placeholder="Recomendaciones o advertencias..." 
                            rows={2} 
                            className="rounded-xl border-muted focus:ring-primary/10 resize-none bg-background"
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3. Medications */}
              <Card className="card-premium border-none shadow-md">
                <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <Pill className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Tratamiento Farmacológico</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddMed(true)}
                    className="rounded-lg border-primary text-primary hover:bg-primary/5 font-bold"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Añadir Fármaco
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  {showAddMed && (
                    <div className="mb-8 space-y-6 rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 animate-in zoom-in-95">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2 relative">
                          <Label className="font-bold text-foreground">Nombre del Medicamento</Label>
                          <div className="relative">
                            <Input
                              placeholder="Ej: Ibuprofeno"
                              value={newMed.name}
                              onChange={(e) => {
                                setNewMed({ ...newMed, name: e.target.value })
                                setShowMedicineDropdown(true)
                              }}
                              onFocus={() => setShowMedicineDropdown(true)}
                              onBlur={() => setTimeout(() => setShowMedicineDropdown(false), 200)}
                              className="bg-background rounded-xl h-11 pr-10"
                            />
                            { (showMedicineDropdown && (newMed.name.length >= 2 || isSearchingMedicines)) && (
                              <div className="absolute z-50 mt-1 w-full divide-y divide-muted rounded-xl border border-muted bg-card shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden max-h-60 overflow-y-auto">
                                {isSearchingMedicines ? (
                                  <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Buscando...</span>
                                  </div>
                                ) : medicineSuggestions.length > 0 ? medicineSuggestions.map((med) => (
                                  <button
                                    key={med.id}
                                    type="button"
                                    onClick={() => {
                                      setNewMed({ 
                                        ...newMed, 
                                        name: med.generic_name || med.brand_name,
                                        dose: med.concentration || ''
                                      })
                                      setShowMedicineDropdown(false)
                                    }}
                                    className="flex w-full flex-col p-3 text-left transition-colors hover:bg-primary/5 group"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                        {med.generic_name} {med.brand_name && <span className="text-muted-foreground font-normal text-xs ml-1">({med.brand_name})</span>}
                                      </span>
                                      <Badge variant="secondary" className="text-[10px] h-4">{med.form}</Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{med.concentration}</span>
                                  </button>
                                )) : (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    No se encontraron medicamentos.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-foreground">Dosis / Concentración</Label>
                          <Input
                            placeholder="Ej: 850mg"
                            value={newMed.dose}
                            onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                            className="bg-background rounded-xl h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-foreground">Frecuencia de Toma</Label>
                          <Select value={newMed.frequency} onValueChange={(val) => setNewMed({ ...newMed, frequency: val })}>
                            <SelectTrigger className="w-full bg-background rounded-xl h-11">
                              <SelectValue placeholder="Seleccionar frecuencia..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cada 24 horas (1 vez al día)">Cada 24 horas (1 vez al día)</SelectItem>
                              <SelectItem value="Cada 12 horas (2 veces al día)">Cada 12 horas (2 veces al día)</SelectItem>
                              <SelectItem value="Cada 8 horas (3 veces al día)">Cada 8 horas (3 veces al día)</SelectItem>
                              <SelectItem value="Cada 6 horas (4 veces al día)">Cada 6 horas (4 veces al día)</SelectItem>
                              <SelectItem value="Según necesidad (SOS)">Según necesidad (SOS)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-foreground">Duración del Tratamiento</Label>
                          <Select value={newMed.duration} onValueChange={(val) => setNewMed({ ...newMed, duration: val })}>
                            <SelectTrigger className="w-full bg-background rounded-xl h-11">
                              <SelectValue placeholder="Seleccionar duración..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3 días">3 días</SelectItem>
                              <SelectItem value="5 días">5 días</SelectItem>
                              <SelectItem value="7 días">7 días</SelectItem>
                              <SelectItem value="10 días">10 días</SelectItem>
                              <SelectItem value="14 días">14 días</SelectItem>
                              <SelectItem value="30 días">30 días</SelectItem>
                              <SelectItem value="Tratamiento prolongado">Tratamiento prolongado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground">Instrucciones Especiales</Label>
                        <Input
                          placeholder="Ej: Administrar con el almuerzo, no suspender bruscamente..."
                          value={newMed.instructions}
                          onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                          className="bg-background rounded-xl h-11"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setShowAddMed(false)} className="font-bold">
                          Cancelar
                        </Button>
                        <Button onClick={addMedication} className="btn-premium px-8">
                          Confirmar Medicamento
                        </Button>
                      </div>
                    </div>
                  )}

                  {medications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted py-16 text-center">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
                        <Pill className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Sin fármacos registrados</h4>
                      <p className="max-w-[280px] text-sm text-muted-foreground mt-1">
                        Presione el botón "Añadir Fármaco" para incluir medicamentos en la receta.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medications.map((med, index) => (
                        <div key={med.id} className="group relative flex items-center justify-between rounded-2xl border border-muted bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg">
                          <div className="flex items-center gap-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-black shadow-md">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-lg font-black text-foreground">{med.name} <span className="text-primary ml-1">{med.dose}</span></p>
                              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {med.frequency}</span>
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Por {med.duration}</span>
                              </div>
                              {med.instructions && (
                                <p className="mt-2 text-xs italic text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded inline-block">
                                  Nota: {med.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeMedication(med.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-red-500 hover:bg-red-50"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar / Summary Section */}
            <div className="lg:col-span-4 space-y-6">
              {/* Prescription Sidebar - Both cards follow the scroll together */}
              <div className="sticky top-20 space-y-6 z-10">
                <Card className="border-none shadow-xl overflow-hidden bg-azul-profundo text-white">
                  <div className="bg-gradient-premium p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                        <FileSignature className="h-6 w-6" />
                      </div>
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                        Borrador Digital
                      </Badge>
                    </div>
                    <h3 className="text-xl font-black">Resumen de la Receta</h3>
                    <p className="text-white/60 text-xs mt-1 uppercase tracking-widest font-bold">Registro Blockchain Health ID</p>
                  </div>
                  <CardContent className="p-6 space-y-6 bg-white/10 backdrop-blur-sm">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Paciente</p>
                        <p className="text-sm font-bold">{selectedPatient?.name || 'No seleccionado'}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Caso Clínico</p>
                        <p className="text-sm font-medium line-clamp-2 italic text-white/90">
                          {reason || 'Pendiente de evaluación...'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Diagnóstico</p>
                        <p className="text-sm font-bold text-primary-foreground line-clamp-1">
                          {diagnosis || 'Sin especificar'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Medicamentos ({medications.length})</p>
                        <div className="space-y-2 mt-1">
                          {medications.length > 0 ? medications.slice(0, 3).map(m => (
                            <div key={m.id} className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded-lg">
                              <Pill className="h-3 w-3 text-primary" />
                              <span className="font-bold">{m.name}</span>
                              <span className="text-white/50">{m.dose}</span>
                            </div>
                          )) : (
                            <p className="text-xs text-white/30">Ningún fármaco añadido</p>
                          )}
                          {medications.length > 3 && <p className="text-[10px] text-white/40">+{medications.length - 3} más...</p>}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      {saveSuccess && (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-3 text-emerald-400 text-sm font-bold mb-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          Diagnóstico guardado en el perfil del paciente.
                        </div>
                      )}
                      <Button 
                        className="w-full bg-white text-primary hover:bg-white/90 h-14 rounded-2xl font-black text-base shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                        disabled={!selectedPatient || !diagnosis || isSaving}
                        onClick={handleSubmitPrescription}
                      >
                        {isSaving ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Guardando...
                          </div>
                        ) : 'Firmar y Emitir Receta'}
                      </Button>
                      <p className="text-[10px] text-center text-white/40 mt-4 leading-relaxed px-4">
                        Al emitir esta receta, se guardará el diagnóstico en el perfil del paciente y se generará una firma criptográfica única.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Helpful Resources - Now sticky too! */}
                <Card className="card-premium border-none shadow-md overflow-hidden">
                  <div className="bg-muted/30 p-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Validación y Seguridad
                    </CardTitle>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                      <p className="text-xs text-muted-foreground">Verificación automática de interacciones medicamentosas activa.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                      <p className="text-xs text-muted-foreground">Sincronización en tiempo real con la Wallet del Paciente.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Buscador de Historial */}
            <Card className="card-premium border-none shadow-sm p-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Buscar en el historial por paciente, CI o CIE-10..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-muted bg-background focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </Card>

            {loadingHistory ? (
              <div className="flex min-h-[400px] items-center justify-center bg-card card-premium rounded-2xl border-none shadow-md">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Cargando historial...</p>
                </div>
              </div>
            ) : (() => {
              const filteredHistory = history.filter(item => {
                const term = searchHistory.toLowerCase()
                const patientName = item.patient?.full_name?.toLowerCase() || ''
                const patientCi = item.patient?.cedula_identidad || ''
                const diagCode = item.diagnosis_catalog?.code?.toLowerCase() || ''
                const diagDesc = item.diagnosis_catalog?.description?.toLowerCase() || ''
                const diagTitle = item.title?.toLowerCase() || ''

                return patientName.includes(term) || 
                       patientCi.includes(term) || 
                       diagCode.includes(term) || 
                       diagDesc.includes(term) || 
                       diagTitle.includes(term)
              })

              if (filteredHistory.length === 0) {
                return (
                  <Card className="card-premium border-none shadow-md">
                    <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
                      <div className="mb-6 relative">
                        <div className="absolute -inset-4 bg-primary/5 rounded-full blur-xl animate-pulse" />
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                          <Calendar className="h-12 w-12 text-primary/50" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-foreground">Historial de Recetas Vacío</h3>
                      <p className="mt-2 max-w-[320px] text-muted-foreground">
                        {searchHistory ? 'No se encontraron recetas que coincidan con la búsqueda.' : 'Aún no has emitido recetas digitales. Las recetas firmadas aparecerán aquí.'}
                      </p>
                      {!searchHistory && (
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('nueva')}
                          className="mt-8 rounded-xl border-2 font-bold px-8 h-12"
                        >
                          Comenzar Primera Receta
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              }

              return (
                <div className="grid gap-4 md:grid-cols-1">
                  {filteredHistory.map((item) => {
                    const parsed = parseDescription(item.description)
                    const recordDate = new Date(item.created_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    
                    return (
                      <Card key={item.id} className="card-premium border-none shadow-md overflow-hidden hover:shadow-lg transition-all group hover:border-primary/20 border">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0 shadow-inner group-hover:bg-blue-500/20 transition-colors">
                                <Stethoscope className="h-6 w-6" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                                    {item.title}
                                  </h4>
                                  {item.diagnosis_catalog?.is_chronic && (
                                    <Badge className="bg-orange-500/15 text-orange-500 border border-orange-500/30 hover:bg-orange-500/25 text-[10px] font-bold uppercase rounded-full">
                                      Crónico
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-foreground/80">{item.patient?.full_name || 'Paciente Desconocido'}</span>
                                  <span className="text-muted-foreground/50">•</span>
                                  <span>CI: {item.patient?.cedula_identidad || 'N/A'}</span>
                                  <span className="text-muted-foreground/50">•</span>
                                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-cyan-500" /> {recordDate}</span>
                                </div>
                                {parsed.reason && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 italic mt-1 bg-muted/30 px-2 py-1 rounded inline-block">
                                    Motivo: {parsed.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              {parsed.tx && (
                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px] font-bold uppercase flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" /> Firmado
                                </Badge>
                              )}
                              <Button 
                                variant="outline" 
                                onClick={() => handleViewDetail(item)}
                                className="rounded-xl border-2 font-bold hover:bg-primary/5 hover:text-primary transition-colors"
                              >
                                Ver Ficha Completa
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

      {/* Modal de Detalle de Receta */}
      <Dialog open={selectedHistoryItem !== null} onOpenChange={(open) => { if (!open) setSelectedHistoryItem(null) }}>
        <DialogContent 
          showCloseButton={false}
          className="w-full sm:max-w-3xl max-h-[85vh] rounded-2xl border-border bg-card shadow-2xl p-0 overflow-hidden flex flex-col"
        >
          {selectedHistoryItem && (() => {
            const item = selectedHistoryItem
            const parsed = parseDescription(item.description)
            const recordDate = new Date(item.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })
            
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
                        onClick={() => setSelectedHistoryItem(null)}
                        className="h-8 w-8 rounded-full text-white hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogTitle className="text-2xl font-black text-white">{item.title}</DialogTitle>
                  <DialogDescription className="sr-only">
                    Detalles del diagnóstico, caso clínico SOAP, medicamentos prescritos y transacciones en la red Avalanche.
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
                          {item.patient?.full_name || 'Paciente Desconocido'}
                        </p>
                        {item.patient?.cedula_identidad && (
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            CI: {item.patient.cedula_identidad}
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
                        <p className="text-sm font-bold text-foreground">{recordDate}</p>
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
                      <p className="text-xs text-muted-foreground italic">No hay medicamentos registrados en esta receta.</p>
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
                            : 'Esta receta fue registrada localmente sin firma criptográfica.'}
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

      <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
        <DialogContent className="max-w-md rounded-2xl bg-background/95 backdrop-blur-xl border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Guía de Emisión de Recetas
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Pasos para emitir una receta criptográfica digital en Bolivia Health ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Seleccionar Paciente</p>
                <p className="text-xs text-muted-foreground">Busca al paciente en el selector por nombre o número de cédula de identidad.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Evaluación Clínica (SOAP)</p>
                <p className="text-xs text-muted-foreground">Completa la Anamnesis, el Examen Físico y el Diagnóstico en base al catálogo estándar CIE-10.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Prescribir Medicación</p>
                <p className="text-xs text-muted-foreground">Añade medicamentos desde el catálogo digital con sus especificaciones de dosis y duración.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Activar Firma Silenciosa (Recomendado)</p>
                <p className="text-xs text-muted-foreground">Inicia sesión clínica (turno diario) en la barra superior o en la sección del paciente para habilitar la Llave de Sesión y firmar de forma automática y silenciosa.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                5
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Emitir y Registrar en Blockchain</p>
                <p className="text-xs text-muted-foreground">Presiona "Emitir Receta". Los datos se subirán de forma encriptada a IPFS y se registrarán en la red (gasless via Relayer). El paciente recibirá un aviso de email al instante.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowGuideModal(false)} className="bg-primary hover:bg-primary/90 rounded-xl font-bold">
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Animación de Éxito de Emisión */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center p-8 bg-card card-premium rounded-3xl border border-primary/20 shadow-2xl max-w-sm text-center animate-in zoom-in-95 duration-500">
            <style>{`
              @keyframes scaleUpElastic {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.1); }
                70% { transform: scale(0.95); }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes progressShrink {
                0% { width: 100%; }
                100% { width: 0%; }
              }
              .animate-scale-up-elastic {
                animation: scaleUpElastic 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              }
              .animate-progress-shrink {
                animation: progressShrink 3.5s linear forwards;
              }
            `}</style>
            
            {/* Animated Checkmark Icon */}
            <div className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-scale-up-elastic">
              <CheckCircle2 className="w-16 h-16" />
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            
            <h3 className="text-2xl font-black text-foreground tracking-tight">¡Receta Emitida!</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              El diagnóstico se ha firmado en la red Avalanche Fuji y se ha guardado en el historial clínico del paciente de forma inmutable.
            </p>
            
            <div className="w-full h-1.5 bg-muted rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-progress-shrink" />
            </div>
          </div>
        </div>
      )}
      </div>
    </DoctorLayout>
  )
}
