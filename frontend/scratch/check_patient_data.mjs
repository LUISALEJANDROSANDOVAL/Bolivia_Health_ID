import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Wallet de Luis Alejandro (paciente que subió datos)
const TARGET_WALLET = '0x4d2cc5f346b5cba7998e5243f026d48dd2469c39';

async function checkAllData() {
  console.log('=== CHECKING DATA FOR PATIENT:', TARGET_WALLET, '===\n');
  
  // 1. Obtener profile ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, wallet_address')
    .eq('wallet_address', TARGET_WALLET.toLowerCase())
    .single();

  if (profileError || !profile) {
    console.error('Profile not found or error:', profileError);
    return;
  }
  console.log('Profile:', profile);
  console.log('Profile ID:', profile.id);

  // 2. health_records
  const { data: records, error: recordsError } = await supabase
    .from('health_records')
    .select('id, title, category, file_url, created_at')
    .eq('patient_id', profile.id);
  
  console.log('\n--- Health Records ---');
  if (recordsError) console.error('Error:', recordsError);
  else console.log(`Count: ${records?.length}`, records);

  // 3. medical_background
  const { data: medBg, error: medBgError } = await supabase
    .from('medical_background')
    .select('id, title, category, created_at')
    .eq('patient_id', profile.id);
  
  console.log('\n--- Medical Background (Diagnoses) ---');
  if (medBgError) console.error('Error:', medBgError);
  else console.log(`Count: ${medBg?.length}`, medBg);

  // 4. medications
  const { data: meds, error: medsError } = await supabase
    .from('medications')
    .select('id, name, status, created_at')
    .eq('patient_id', profile.id);
  
  console.log('\n--- Medications ---');
  if (medsError) console.error('Error:', medsError);
  else console.log(`Count: ${meds?.length}`, meds);

  // 5. patient_vitals
  const { data: vitals, error: vitalsError } = await supabase
    .from('patient_vitals')
    .select('*')
    .eq('patient_id', profile.id);
  
  console.log('\n--- Patient Vitals ---');
  if (vitalsError) console.error('Error:', vitalsError);
  else console.log(`Count: ${vitals?.length}`, vitals);
}

checkAllData().catch(console.error);
