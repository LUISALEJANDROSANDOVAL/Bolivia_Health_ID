import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkRLS() {
  const email = `0x4e475c495f2b76624321480a7ecec6946168e865@boliviahealth.com`;
  const password = `0x4e475c495f2b76624321480a7ecec6946168e865_boliviahealth_secure_2026!`;

  await supabase.auth.signInWithPassword({ email, password });

  const { data: profile } = await supabase.from('profiles').select('id').eq('wallet_address', '0x7a25c09c279375323f6f77e8334f50160519282e').single(); // David
  
  if (profile) {
    console.log("David profile:", profile.id);
    const { error: insertError } = await supabase
      .from('patient_vitals')
      .insert([{ patient_id: profile.id, blood_type: 'A+', allergies: 'Pollen' }]);
    
    console.log("Insert Error:", insertError);
  }
}

checkRLS();
