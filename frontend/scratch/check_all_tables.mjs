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
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

console.log('Using service role key?', !!supabaseServiceKey);

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: { persistSession: false }
});

// Check ALL data across all patients
async function checkAllTables() {
  console.log('=== CHECKING ALL TABLES (bypassing RLS with service key) ===\n');
  
  const tables = ['health_records', 'medical_background', 'medications', 'patient_vitals'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(10);
    
    console.log(`\n--- ${table} ---`);
    if (error) console.error('Error:', error.message);
    else console.log(`Count: ${data?.length}`, data?.length > 0 ? data.map(r => ({ id: r.id, patient_id: r.patient_id, created_at: r.created_at })) : '(EMPTY)');
  }
}

checkAllTables().catch(console.error);
