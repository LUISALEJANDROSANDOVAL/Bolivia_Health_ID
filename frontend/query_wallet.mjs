import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getHealthData(walletAddress = '0xF0fc123456789abcdef123456789abcdef1265bc') {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('wallet_address', walletAddress)
    .single();

  if (profileError) {
    console.log(JSON.stringify({ error: `Perfil no encontrado: ${profileError.message}` }));
    return;
  }
  
  const { id } = profile;

  const [
    { data: vitals },
    { data: medications },
    { data: medical_background },
    { data: health_records },
    { data: activity_log },
    { data: access_permissions }
  ] = await Promise.all([
    supabase.from('patient_vitals').select('*').eq('patient_id', id).single(),
    supabase.from('medications').select('*').eq('patient_id', id),
    supabase.from('medical_background').select('*').eq('patient_id', id),
    supabase.from('health_records').select('*').eq('patient_id', id),
    supabase.from('activity_log').select('*').eq('patient_id', id),
    supabase.from('access_permissions').select('*').eq('patient_id', id)
  ]);

  const result = {
    profile: profile,
    vitals: vitals || null,
    medications: medications || [],
    medical_background: medical_background || [],
    health_records: health_records || [],
    activity_log: activity_log || [],
    access_permissions: access_permissions || []
  };

  const fs = await import('fs');
  fs.writeFileSync('output.json', JSON.stringify(result, null, 2));
}

getHealthData(process.argv[2]);
