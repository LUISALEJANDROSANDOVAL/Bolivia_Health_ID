import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function debug() {
  // 1. Ver último perfil médico creado
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'medico')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (pError) {
    console.error('Error al obtener perfil:', pError)
    return
  }

  console.log('--- PERFIL ACTUAL ---')
  console.log('ID:', profile.id)
  console.log('Nombre:', profile.full_name)
  console.log('CI:', profile.cedula_identidad)
  console.log('Matrícula:', profile.license_number)
  console.log('Estado Identidad:', profile.identity_verified)
  console.log('Estado Matrícula:', profile.license_verified)
  console.log('Estado Aprobación:', profile.approval_status)

  // 2. Ver datos en Mock SEGIP
  const { data: segip, error: sError } = await supabase
    .from('mock_segip_data')
    .select('*')
    .eq('cedula', profile.cedula_identidad)
  
  console.log('\n--- DATOS EN MOCK SEGIP ---')
  if (segip && segip.length > 0) {
    console.log('Coincidencia encontrada:', segip[0])
  } else {
    console.log('¡ERROR: No hay coincidencia en SEGIP para la CI:', profile.cedula_identidad)
    // Listar todos para ver qué hay
    const { data: allSegip } = await supabase.from('mock_segip_data').select('cedula').limit(5)
    console.log('CIs disponibles en mock:', allSegip?.map(s => s.cedula))
  }
}

debug()
