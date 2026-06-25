import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// We don't have the service role key, but wait, the anon key might be able to read if RLS allows it?
// Or we can just read using Jorge Luis Ayala (doctor) who might be able to see all his appointments?
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkAllAppointments() {
  const email = `doctor1@boliviahealth.com`; // Let's use a doctor to bypass patient-only RLS
  const password = `doctor1_boliviahealth_secure_2026!`;

  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  
  if(loginError) {
      console.log("Login Error:", loginError);
      return;
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('id, patient_id, doctor_name, appointment_date, appointment_time, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log("Latest Appts:", data);
  console.log("Error:", error);
}

checkAllAppointments();
