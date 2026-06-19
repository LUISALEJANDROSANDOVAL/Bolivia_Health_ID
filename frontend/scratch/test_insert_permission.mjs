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

async function testInsert() {
  // 1. Get Doctor and Patient profiles
  const docWallet = '0x88e93cbe9461fab60939dd6eb534d85254e6af39'.toLowerCase();
  const patWallet = '0x4e475c495f2b76624321480a7ecec6946168e865'.toLowerCase();

  const { data: docProfile, error: docErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('wallet_address', docWallet)
    .single();

  const { data: patProfile, error: patErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('wallet_address', patWallet)
    .single();

  if (docErr || patErr) {
    console.error('Error fetching profiles:', { docErr, patErr });
    return;
  }

  console.log('Doctor ID:', docProfile.id);
  console.log('Patient ID:', patProfile.id);

  // 2. Sign in as the doctor
  const emailAuth = `${docWallet}@boliviahealth.com`;
  const passwordAuth = `${docWallet}_boliviahealth_secure_2026!`;

  console.log('Signing in as doctor...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: emailAuth,
    password: passwordAuth
  });

  if (authErr) {
    console.error('Authentication error:', authErr);
    return;
  }

  console.log('Authentication successful! Token loaded.');

  // 3. Attempt insert to access_permissions
  console.log('Attempting insert into access_permissions...');
  const { data: insertData, error: insertErr } = await supabase
    .from('access_permissions')
    .insert([{
      patient_id: patProfile.id,
      doctor_id: docProfile.id,
      status: 'pending'
    }]);

  if (insertErr) {
    console.error('Insert Error details:', {
      message: insertErr.message,
      details: insertErr.details,
      hint: insertErr.hint,
      code: insertErr.code
    });
  } else {
    console.log('Insert successful!', insertData);
  }
}

testInsert();
