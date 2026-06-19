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

  // Fetch all medical background
  const { data: bgData } = await supabase
    .from('medical_background')
    .select('*')
    .eq('patient_id', patientProfileId);

  // Fetch all medications
  const { data: medsData } = await supabase
    .from('medications')
    .select('*')
    .eq('patient_id', patientProfileId);

  console.log(`Checking match for ${bgData.length} records and ${medsData.length} medications:`);

  bgData.forEach((record) => {
    const dateFromCreatedAt = record.created_at ? record.created_at.split('T')[0] : '';
    const dateFromDateRecorded = record.date_recorded || '';

    // Find meds matching diagnosis_id
    const medsByDiagId = medsData.filter(m => m.diagnosis_id === record.diagnosis_id);

    // Find meds matching diagnosis_id AND start_date = dateFromCreatedAt
    const medsByDiagIdAndCreatedAt = medsData.filter(m => m.diagnosis_id === record.diagnosis_id && m.start_date === dateFromCreatedAt);

    // Find meds matching diagnosis_id AND start_date = dateFromDateRecorded
    const medsByDiagIdAndDateRecorded = medsData.filter(m => m.diagnosis_id === record.diagnosis_id && m.start_date === dateFromDateRecorded);

    console.log(`\nRecord: "${record.title}"`);
    console.log(`  created_at split: ${dateFromCreatedAt}`);
    console.log(`  date_recorded:    ${dateFromDateRecorded}`);
    console.log(`  Meds matching only diagnosis_id:        ${medsByDiagId.map(m => `${m.name} (${m.start_date})`).join(', ') || 'None'}`);
    console.log(`  Meds matching diag_id + created_at:     ${medsByDiagIdAndCreatedAt.map(m => m.name).join(', ') || 'None'}`);
    console.log(`  Meds matching diag_id + date_recorded:   ${medsByDiagIdAndDateRecorded.map(m => m.name).join(', ') || 'None'}`);
  });
}

checkQuery();
