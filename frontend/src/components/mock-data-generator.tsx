'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Database, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/contexts/wallet-context'
import { useToast } from '@/hooks/use-toast'

export function MockDataGenerator({ onGenerate }: { onGenerate: () => void }) {
  const { walletAddress } = useWallet()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const generateData = async () => {
    if (!walletAddress) {
      toast({ title: 'Error', description: 'Conecta tu wallet primero', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (!profile) {
        toast({ title: 'Perfil no encontrado', description: 'Crea tu identidad médica primero', variant: 'destructive' })
        setLoading(false)
        return
      }

      // Insertar en medical_background
      await supabase.from('medical_background').insert([
        {
          patient_id: profile.id,
          title: 'Consulta General - Evaluación Anual',
          description: 'El paciente presenta signos vitales estables. Se recomienda mantener dieta baja en sodio.',
          category: 'consulta',
          status_detail: 'Completa',
          date_recorded: new Date().toISOString()
        },
        {
          patient_id: profile.id,
          title: 'Vacunación - Influenza',
          description: 'Aplicación de dosis anual contra la influenza estacional. Sin reacciones adversas inmediatas.',
          category: 'vaccine',
          status_detail: 'Completa',
          date_recorded: new Date(Date.now() - 86400000 * 5).toISOString() // hace 5 días
        }
      ])

      // Insertar en health_records
      await supabase.from('health_records').insert([
        {
          patient_id: profile.id,
          title: 'Resultados Hemograma Completo',
          category: 'Laboratorio',
          file_size: '1.2 MB',
          file_url: 'mock_ipfs_hash_1',
          file_type: 'pdf',
        },
        {
          patient_id: profile.id,
          title: 'Receta Médica - Ibuprofeno',
          category: 'Recetas',
          file_size: '0.5 MB',
          file_url: 'mock_ipfs_hash_2',
          file_type: 'image',
        }
      ])

      toast({ title: 'Éxito', description: 'Datos de prueba generados correctamente' })
      onGenerate()
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={generateData} 
      disabled={loading || !walletAddress}
      variant="outline"
      className="border-dashed border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10 shrink-0 h-10"
    >
      {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Database className="size-4 mr-2" />}
      Generar Datos de Prueba
    </Button>
  )
}
