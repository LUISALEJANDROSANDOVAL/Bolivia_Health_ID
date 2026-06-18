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

async function checkDoctorWallet() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'medico');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Doctors registered:', JSON.stringify(data, null, 2));
  }
}

checkDoctorWallet();
