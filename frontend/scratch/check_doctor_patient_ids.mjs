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

async function checkIdsAndInsert() {
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
  
  const doctor = profiles.find(p => p.full_name.includes('Angel Sandoval'));
  const patient = profiles.find(p => p.full_name.includes('Luis Alejandro Sandoval Rodriguez'));
  
  console.log('Doctor found:', doctor);
  console.log('Patient found:', patient);
  
  if (!doctor || !patient) {
    console.error('Doctor or patient not found in database');
    return;
  }
  
  console.log('\n--- Testing Insert into medical_background ---');
  const bgData = {
    patient_id: patient.id,
    doctor_id: doctor.id,
    title: 'E10.9 - Diabetes mellitus tipo 1 sin complicaciones',
    description: 'Motivo: xd | IPFS: mock_ipfs_hash | Tx: 0xmocktxhash',
    category: 'consulta',
    status_detail: 'Completa'
  };
  
  const { data: bgResult, error: bgError } = await supabase
    .from('medical_background')
    .insert([bgData])
    .select();
    
  if (bgError) {
    console.error('medical_background Insert failed:', bgError);
  } else {
    console.log('medical_background Insert successful:', bgResult);
    
    console.log('\n--- Testing Insert into medications ---');
    const medData = {
      patient_id: patient.id,
      doctor_id: doctor.id,
      name: 'Diclofenaco Sódico',
      dosage: '50mg',
      frequency: 'Cada 12 horas (2 veces al día)',
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      diagnosis_id: null
    };
    
    const { data: medResult, error: medError } = await supabase
      .from('medications')
      .insert([medData])
      .select();
      
    if (medError) {
      console.error('medications Insert failed:', medError);
    } else {
      console.log('medications Insert successful:', medResult);
      
      // Clean up test data
      console.log('\nCleaning up test data...');
      await supabase.from('medications').delete().eq('id', medResult[0].id);
      await supabase.from('medical_background').delete().eq('id', bgResult[0].id);
      console.log('Cleanup complete.');
    }
  }
}

checkIdsAndInsert();
