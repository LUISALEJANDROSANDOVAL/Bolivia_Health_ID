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

async function checkUser(wallet) {
  const emailAuth = `${wallet}@boliviahealth.com`;
  const passwordAuth = `${wallet}_boliviahealth_secure_2026!`;

  console.log(`\nAuthenticating as user: ${emailAuth}`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: emailAuth,
    password: passwordAuth
  });

  if (authError) {
    console.error(`Authentication failed for ${wallet}:`, authError.message);
    return;
  }

  const { data, error } = await supabase
    .from('access_permissions')
    .select('*, patient:profiles!patient_id(full_name), doctor:profiles!doctor_id(full_name)');

  if (error) {
    console.error('Error querying permissions:', error);
  } else {
    console.log(`Permissions found (${data?.length}):`);
    data?.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`  Patient: ${row.patient?.full_name}`);
      console.log(`  Doctor:  ${row.doctor?.full_name}`);
      console.log(`  Status:  ${row.status}`);
      console.log(`  Created: ${row.created_at}`);
      console.log(`  Expires: ${row.expires_at}`);
    });
  }
}

async function run() {
  const wallets = [
    '0x4e475c495f2b76624321480a7ecec6946168e865',
    '0x4d2cc5f346b5cba7998e5243f026d48dd2469c39',
    '0x88e93cbe9461fab60939dd6eb534d85254e6af39' // Doctor
  ];
  for (const wallet of wallets) {
    await checkUser(wallet);
  }
}

run();
