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
    .from('profiles')
    .select('id, full_name, role, wallet_address');

  if (error) {
    console.error('Error:', error);
  } else {
    data.forEach(p => {
      console.log(`ID=${p.id} Name="${p.full_name}" Role=${p.role} Wallet=${p.wallet_address}`);
    });
  }
}

checkQuery();
