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

async function checkProfiles() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, wallet_address');
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  console.log('--- Database Profiles ---');
  profiles.forEach(p => {
    console.log(`Name: ${p.full_name} | Role: ${p.role} | Wallet: ${p.wallet_address}`);
  });
}

checkProfiles();
