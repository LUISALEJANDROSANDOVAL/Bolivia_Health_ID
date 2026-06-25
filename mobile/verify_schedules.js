import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchedules() {
  const wallet = '0x4e475c495f2b76624321480a7ecec6946168e865';
  const email = `${wallet}@boliviahealth.com`;
  const password = `${wallet}_boliviahealth_secure_2026!`;
  
  await supabase.auth.signInWithPassword({ email, password });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', '%Jorge%Ayala%')
    .single();

  if (profile) {
      const { data: schedules } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', profile.id);
      
      console.log('Jorge Schedules:', JSON.stringify(schedules, null, 2));
  }
}

checkSchedules();
