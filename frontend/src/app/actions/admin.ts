'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Helper to create an authenticated client from a token
function getAuthenticatedClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )
}

// ---------------------------
// SUCURSALES
// ---------------------------

export async function createSucursal(token: string, data: { name: string; address: string; coordinates: string }) {
  const supabase = getAuthenticatedClient(token)
  
  const { data: sucursal, error } = await supabase
    .from('sucursales')
    .insert([data])
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/sucursales')
  return sucursal
}

export async function updateSucursal(token: string, id: string, data: { name: string; address: string; coordinates: string }) {
  const supabase = getAuthenticatedClient(token)
  
  const { error } = await supabase
    .from('sucursales')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/sucursales')
  return true
}

export async function deleteSucursal(token: string, id: string) {
  const supabase = getAuthenticatedClient(token)
  
  const { error } = await supabase
    .from('sucursales')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/sucursales')
  return true
}

// ---------------------------
// ESPECIALIDADES Y DOCTORES
// ---------------------------

export async function assignSpecialty(token: string, doctorId: string, specialtyName: string) {
  const supabase = getAuthenticatedClient(token)
  
  const { error } = await supabase
    .from('profiles')
    .update({ specialty: specialtyName })
    .eq('id', doctorId)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/doctores')
  return true
}

// ---------------------------
// HORARIOS (DOCTOR_SCHEDULES)
// ---------------------------

export async function assignSchedule(
  token: string, 
  data: {
    doctor_id: string;
    sucursal_id: string;
    days_of_week: number[];
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }
) {
  const supabase = getAuthenticatedClient(token)
  
  const insertData = data.days_of_week.map(day => ({
    doctor_id: data.doctor_id,
    sucursal_id: data.sucursal_id,
    day_of_week: day,
    start_time: data.start_time,
    end_time: data.end_time,
    slot_duration_minutes: data.slot_duration_minutes
  }))

  const { error } = await supabase
    .from('doctor_schedules')
    .insert(insertData)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/doctores')
  return true
}

export async function removeSchedule(token: string, scheduleId: string) {
  const supabase = getAuthenticatedClient(token)
  
  const { error } = await supabase
    .from('doctor_schedules')
    .delete()
    .eq('id', scheduleId)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/doctores')
  return true
}
