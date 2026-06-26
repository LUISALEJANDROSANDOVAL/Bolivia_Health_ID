import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing URL or Key');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('secretaria_sucursal')
    .select('*');
  
  if (error) {
    console.error('Error fetching secretaria_sucursal:', error);
  } else {
    console.log('secretaria_sucursal:', data);
  }

  const { data: sucursalData, error: sucursalError } = await supabase
    .from('sucursales')
    .select('*');
  
  if (sucursalError) {
    console.error('Error fetching sucursales:', sucursalError);
  } else {
    console.log('sucursales:', sucursalData);
  }
}

run();
