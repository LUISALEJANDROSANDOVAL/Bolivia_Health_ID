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

async function cleanMockData() {
  const wallet = '0x4e475c495f2b76624321480a7ecec6946168e865';
  const emailAuth = `${wallet}@boliviahealth.com`;
  const passwordAuth = `${wallet}_boliviahealth_secure_2026!`;

  const { error: authErr } = await supabase.auth.signInWithPassword({ email: emailAuth, password: passwordAuth });
  if (authErr) {
    console.error('Auth error:', authErr.message);
    return;
  }
  console.log('Autenticado como paciente');

  const patientId = '043522e1-c068-4d1a-b398-7ef20d3224c3';

  // 1. Delete mock medical_background (no doctor_id AND no diagnosis_id)
  const mockBgIds = [
    '321361c9-8338-4148-90c8-c340b8d8f6c7',  // Vacunación - Influenza (mock)
    'bcdb3f80-603e-41b7-85cb-c2f6daa611b1',  // Consulta General - Evaluación Anual (mock)
  ];

  for (const id of mockBgIds) {
    const { error } = await supabase
      .from('medical_background')
      .delete()
      .eq('id', id)
      .eq('patient_id', patientId);
    console.log(`Delete medical_background ${id}: ${error ? error.message : 'OK'}`);
  }

  // 2. Delete mock health_records (mock_ipfs_hash_*)
  const { data: mockHr, error: hrQueryErr } = await supabase
    .from('health_records')
    .select('id, title, file_url')
    .eq('patient_id', patientId)
    .like('file_url', 'mock_%');

  console.log(`\nFound ${mockHr?.length || 0} mock health records to delete`);
  for (const hr of (mockHr || [])) {
    const { error } = await supabase
      .from('health_records')
      .delete()
      .eq('id', hr.id);
    console.log(`Delete health_record "${hr.title}" (${hr.file_url}): ${error ? error.message : 'OK'}`);
  }

  // 3. Verify what's left
  const { data: remainingBg } = await supabase
    .from('medical_background')
    .select('id, title')
    .eq('patient_id', patientId);
  console.log(`\n=== Remaining medical_background: ${remainingBg?.length || 0} ===`);
  remainingBg?.forEach(r => console.log(`  - ${r.title}`));

  const { data: remainingHr } = await supabase
    .from('health_records')
    .select('id, title, file_url')
    .eq('patient_id', patientId);
  console.log(`\n=== Remaining health_records: ${remainingHr?.length || 0} ===`);
  remainingHr?.forEach(r => console.log(`  - ${r.title} (${r.file_url?.substring(0,20)})`));
}

cleanMockData();
