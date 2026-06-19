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
  const { data, error } = await supabase
    .from('access_permissions')
    .select('*, patient:profiles!patient_id(full_name), doctor:profiles!doctor_id(full_name)');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found permissions total:', data?.length);
    data?.forEach(row => {
      console.log(`ID=${row.id} status=${row.status} patient="${row.patient?.full_name}" doctor="${row.doctor?.full_name}" created_at=${row.created_at} expires_at=${row.expires_at}`);
    });
  }
}

checkQuery();
