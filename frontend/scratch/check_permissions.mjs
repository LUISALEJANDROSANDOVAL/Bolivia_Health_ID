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

async function checkPermissions() {
  const { data: perms, error } = await supabase
    .from('access_permissions')
    .select('*');
  
  if (error) {
    console.error('Error fetching permissions:', error);
    return;
  }
  
  console.log('--- Database Permissions ---');
  console.log(JSON.stringify(perms, null, 2));
}

checkPermissions();
