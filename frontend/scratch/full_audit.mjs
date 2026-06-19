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

async function audit() {
  const wallet = '0x4e475c495f2b76624321480a7ecec6946168e865';
  const emailAuth = `${wallet}@boliviahealth.com`;
  const passwordAuth = `${wallet}_boliviahealth_secure_2026!`;

  await supabase.auth.signInWithPassword({ email: emailAuth, password: passwordAuth });

  const patientId = '043522e1-c068-4d1a-b398-7ef20d3224c3';

  // All background records
  const { data: bg, error: bgErr } = await supabase
    .from('medical_background')
    .select('id, title, category, status_detail, doctor_id, diagnosis_id, created_at, description')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  console.log(`\n=== ALL MEDICAL BACKGROUND (${bg?.length || 0}) ===`);
  bg?.forEach((r, i) => {
    const isMock = !r.doctor_id && !r.diagnosis_id;
    console.log(`${i+1}. [${isMock ? 'MOCK' : 'REAL'}] "${r.title}" | cat=${r.category} | doctor_id=${r.doctor_id || 'null'} | diag_id=${r.diagnosis_id || 'null'}`);
    console.log(`   created=${r.created_at}`);
    if (r.description) console.log(`   desc=${r.description.substring(0, 100)}...`);
  });

  // All health records
  const { data: hr, error: hrErr } = await supabase
    .from('health_records')
    .select('id, title, category, file_url, doctor_id, tx_hash, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  console.log(`\n=== ALL HEALTH RECORDS (${hr?.length || 0}) ===`);
  hr?.forEach((r, i) => {
    const isMock = r.file_url?.startsWith('mock_');
    console.log(`${i+1}. [${isMock ? 'MOCK' : 'REAL'}] "${r.title}" | cat=${r.category} | file_url=${r.file_url?.substring(0,30)} | doctor_id=${r.doctor_id || 'null'} | tx=${r.tx_hash ? 'yes' : 'no'}`);
  });

  // All medications
  const { data: meds } = await supabase
    .from('medications')
    .select('id, name, diagnosis_id, doctor_id, start_date, status')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  console.log(`\n=== ALL MEDICATIONS (${meds?.length || 0}) ===`);
  meds?.forEach((r, i) => {
    console.log(`${i+1}. "${r.name}" | diag_id=${r.diagnosis_id || 'null'} | doctor_id=${r.doctor_id || 'null'} | start=${r.start_date} | status=${r.status}`);
  });
}

audit();
