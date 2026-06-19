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
  const wallet = '0x4e475c495f2b76624321480a7ecec6946168e865'; // Luis Alejandro Sandoval Rodriguez (Paciente)
  const emailAuth = `${wallet}@boliviahealth.com`;
  const passwordAuth = `${wallet}_boliviahealth_secure_2026!`;

  console.log('Authenticating as patient:', emailAuth);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: emailAuth,
    password: passwordAuth
  });

  if (authError) {
    console.error('Authentication failed:', authError);
    return;
  }

  console.log('Authentication success! Patient ID:', authData.user.id);

  // Now query
  const { data, error } = await supabase
    .from('medical_background')
    .select(`
      *,
      doctor:profiles!medical_background_doctor_id_fkey (
        id,
        full_name,
        specialty,
        wallet_address
      )
    `);

  if (error) {
    console.error('Query Error:', error);
  } else {
    console.log('Query Success! Found records:', data?.length);
    data?.forEach((row, idx) => {
      console.log(`[${idx}] rowId=${row.id} title="${row.title}" doctor_id=${row.doctor_id} doctor_name="${row.doctor?.full_name}" doctor_wallet=${row.doctor?.wallet_address}`);
    });
  }
}

checkQuery();
