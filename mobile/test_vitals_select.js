import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testSelect() {
  const email = `0x4e475c495f2b76624321480a7ecec6946168e865@boliviahealth.com`;
  const password = `0x4e475c495f2b76624321480a7ecec6946168e865_boliviahealth_secure_2026!`;

  await supabase.auth.signInWithPassword({ email, password });

  const { data: profile } = await supabase.from('profiles').select('id').eq('wallet_address', '0x4e475c495f2b76624321480a7ecec6946168e865').single();
  
  if (profile) {
    const { data: vitals, error: selectError } = await supabase
      .from('patient_vitals')
      .select('*')
      .eq('patient_id', profile.id);
    
    console.log("Vitals:", vitals);
    console.log("Select Error:", selectError);
  }
}

testSelect();
