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
  const doctorId = 'c67e297b-ff2c-4366-b646-b38e1a9cb4cd'; // Doctor Angel Sandoval
  const { data, error } = await supabase
    .from('access_permissions')
    .select(`
      id,
      status,
      created_at,
      profiles!patient_id (
        id,
        full_name,
        cedula_identidad,
        wallet_address
      )
    `)
    .eq('doctor_id', doctorId)
    .eq('status', 'active');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Result data:', JSON.stringify(data, null, 2));
    
    const mapped = (data || []).map((p) => ({
      id: p.profiles?.id || '',
      name: p.profiles?.full_name || 'Paciente Desconocido',
      ci: p.profiles?.cedula_identidad || 'N/A',
      healthId: p.profiles?.wallet_address || 'N/A',
      status: 'Activo'
    }));
    console.log('Mapped Patient IDs:', mapped);
  }
}

checkQuery();
