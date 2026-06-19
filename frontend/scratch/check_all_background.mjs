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

async function checkAll() {
  const { data: bgData, error: bgError } = await supabase
    .from('medical_background')
    .select('*, patient:profiles!patient_id(full_name)');

  const { data: medsData, error: medsError } = await supabase
    .from('medications')
    .select('*');

  if (bgError || medsError) {
    console.error('Error fetching data:', bgError || medsError);
    return;
  }

  console.log(`Total background records: ${bgData?.length || 0}`);
  console.log(`Total medications: ${medsData?.length || 0}`);

  bgData?.forEach((record) => {
    const dateFromCreatedAt = record.created_at ? record.created_at.split('T')[0] : '';
    const dateFromDateRecorded = record.date_recorded || '';

    // Meds matching diagnosis_id
    const medsByDiagId = medsData?.filter(m => m.diagnosis_id === record.diagnosis_id && m.patient_id === record.patient_id);

    // Meds matching diag_id AND created_at split
    const medsByDiagIdAndCreatedAt = medsData?.filter(m => 
      m.diagnosis_id === record.diagnosis_id && 
      m.patient_id === record.patient_id && 
      m.start_date === dateFromCreatedAt
    );

    console.log(`Patient: "${record.patient?.full_name}" | Record: "${record.title}"`);
    console.log(`  created_at split: ${dateFromCreatedAt} | date_recorded: ${dateFromDateRecorded}`);
    console.log(`  Meds matching only diagnosis_id:        ${medsByDiagId?.map(m => `${m.name} (${m.start_date})`).join(', ') || 'None'}`);
    console.log(`  Meds matching diag_id + created_at:     ${medsByDiagIdAndCreatedAt?.map(m => m.name).join(', ') || 'None'}`);
  });
}

checkAll();
