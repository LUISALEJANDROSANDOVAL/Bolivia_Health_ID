import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function getRpc() {
  const wallet = '0x4e475c495f2b76624321480a7ecec6946168e865';
  const email = `${wallet}@boliviahealth.com`;
  const password = `${wallet}_boliviahealth_secure_2026!`;
  await supabase.auth.signInWithPassword({ email, password });

  // Can we run raw SQL via rpc? No, but maybe we can just query the data.
  // Wait, let's try calling get_available_slots directly with the exact parameters the app uses.
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', '%Jorge%Ayala%')
    .single();

  if (profile) {
      console.log('Doctor ID:', profile.id);
      
      const { data: sucursal } = await supabase
        .from('sucursales')
        .select('id')
        .ilike('name', '%Sandoval%')
        .single();
        
      console.log('Sucursal ID:', sucursal?.id);

      // Try for dates: 2026-06-23, 2026-06-24, 2026-06-25
      for (let day of [23, 24, 25, 26, 27, 28, 29]) {
        const dateStr = `2026-06-${day}`;
        const { data: slots, error } = await supabase.rpc('get_available_slots', {
          p_doctor_id: profile.id,
          p_sucursal_id: sucursal?.id,
          p_date: dateStr
        });
        console.log(`Slots for ${dateStr}:`, slots, error?.message || '');
      }
  }
}

getRpc();
