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
  const wallet = '0x4e475c495f2b76624321480a7ecec6946168e865'; // Patient Luis Alejandro
  const emailAuth = `${wallet}@boliviahealth.com`;
  const passwordAuth = `${wallet}_boliviahealth_secure_2026!`;

  const { data: authData } = await supabase.auth.signInWithPassword({
    email: emailAuth,
    password: passwordAuth
  });

  const patientProfileId = '043522e1-c068-4d1a-b398-7ef20d3224c3';
  console.log('Querying medical_background for patient profile ID:', patientProfileId);

  const { data, error } = await supabase
    .from('medical_background')
    .select('*')
    .eq('patient_id', patientProfileId);

  if (error) {
    console.error('Error fetching medical_background:', error);
  } else {
    console.log('Found records:', data?.length);
    data?.forEach((row, idx) => {
      console.log(`[${idx}] id=${row.id} title="${row.title}" diagnosis_id=${row.diagnosis_id} created_at=${row.created_at} date_recorded=${row.date_recorded}`);
    });
  }
}

checkQuery();
