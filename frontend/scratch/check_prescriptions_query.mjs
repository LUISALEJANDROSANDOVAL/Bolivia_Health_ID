import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'));

async function checkQuery() {
  const wallet = '0x88e93cbe9461fab60939dd6eb534d85254e6af39'; // Angel Sandoval
  const emailAuth = `${wallet}@boliviahealth.com`;
  const passwordAuth = `${wallet}_boliviahealth_secure_2026!`;

  console.log('Authenticating as doctor:', emailAuth);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: emailAuth,
    password: passwordAuth
  });

  if (authError) {
    console.error('Authentication failed:', authError);
    return;
  }

  const doctorProfileId = 'c67e297b-ff2c-4366-b646-b38e1a9cb4cd';
  console.log('Authentication success! Querying history WITHOUT doctor join...');

  const { data, error } = await supabase
    .from('medical_background')
    .select(`
      *,
      diagnosis_catalog (
        code,
        description,
        is_chronic
      ),
      patient:profiles!patient_id (
        id,
        full_name,
        cedula_identidad,
        wallet_address
      )
    `)
    .eq('doctor_id', doctorProfileId)
    .eq('category', 'consulta')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Query Error:', error);
  } else {
    console.log('Query Success! Found records:', data?.length);
  }
}

checkQuery();
