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

const patientId = '043522e1-c068-4d1a-b398-7ef20d3224c3';

async function testFetch() {
  try {
    console.log('1. Querying profiles for patientId:', patientId);
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single();

    if (profileErr) {
      console.error('profiles query failed:', profileErr);
    } else {
      console.log('profiles query success:', profileData.full_name);
    }

    console.log('\n2. Querying patient_vitals...');
    const { data: vitalsData, error: vitalsErr } = await supabase
      .from('patient_vitals')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (vitalsErr) {
      console.log('patient_vitals query returned error (might be expected if empty):', vitalsErr.message);
    } else {
      console.log('patient_vitals query success:', vitalsData);
    }

    console.log('\n3. Querying medications...');
    const { data: medsData, error: medsErr } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active');

    if (medsErr) {
      console.error('medications query failed:', medsErr);
    } else {
      console.log('medications query success, count:', medsData?.length);
    }

    console.log('\n4. Querying medical_background...');
    const { data: bgData, error: bgErr } = await supabase
      .from('medical_background')
      .select('*')
      .eq('patient_id', patientId);

    if (bgErr) {
      console.error('medical_background query failed:', bgErr);
    } else {
      console.log('medical_background query success, count:', bgData?.length);
    }

    console.log('\n5. Querying health_records...');
    const { data: recordsData, error: recordsErr } = await supabase
      .from('health_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (recordsErr) {
      console.error('health_records query failed:', recordsErr);
    } else {
      console.log('health_records query success, count:', recordsData?.length);
    }

  } catch (err) {
    console.error('Caught error:', err);
  }
}

testFetch();
