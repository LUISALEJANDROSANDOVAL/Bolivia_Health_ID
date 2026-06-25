import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function listSucursales() {
  const { data } = await supabase.from('sucursales').select('id, name');
  console.log(data);
}

listSucursales();
