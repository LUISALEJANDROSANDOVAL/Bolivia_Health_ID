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

async function checkLatest() {
  const wallet = '0x4e475c495f2b76624321480a7ecec6946168e865'; // Patient Luis Alejandro
  const emailAuth = `${wallet}@boliviahealth.com`;
  const passwordAuth = `${wallet}_boliviahealth_secure_2026!`;

  const { data: authData } = await supabase.auth.signInWithPassword({
    email: emailAuth,
    password: passwordAuth
  });

  const patientProfileId = '043522e1-c068-4d1a-b398-7ef20d3224c3';

  const { data: bgData } = await supabase
    .from('medical_background')
    .select('*')
    .eq('patient_id', patientProfileId)
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: medsData } = await supabase
    .from('medications')
    .select('*')
    .eq('patient_id', patientProfileId)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n--- Latest 3 Medical Background Records ---');
  bgData?.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`  Title:        ${row.title}`);
    console.log(`  Diagnosis ID: ${row.diagnosis_id}`);
    console.log(`  Created At:   ${row.created_at}`);
    console.log(`  Date Rec:     ${row.date_recorded}`);
  });

  console.log('\n--- Latest 5 Medications ---');
  medsData?.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`  Name:         ${row.name}`);
    console.log(`  Diagnosis ID: ${row.diagnosis_id}`);
    console.log(`  Created At:   ${row.created_at}`);
    console.log(`  Start Date:   ${row.start_date}`);
  });
}

checkLatest();
