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
  const wallet = '0x4e475c495f2b76624321480a7ecec6946168e865'; // Luis Alejandro (Paciente)
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

  console.log('Authentication success! Querying access_permissions table...');
  const { data, error } = await supabase
    .from('access_permissions')
    .select('*, doctor:profiles!doctor_id(full_name)');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found permissions:', data?.length);
    data?.forEach(row => {
      console.log(`Permission ID=${row.id} status=${row.status} doctor_name="${row.doctor?.full_name}" expires_at=${row.expires_at}`);
    });
  }
}

checkQuery();
