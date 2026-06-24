import { supabase } from './src/services/supabase';

async function test() {
  const { data, error } = await supabase.from('doctor_schedules').select('*');
  console.log('doctor_schedules:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);

  const { data: prof, error: profErr } = await supabase.from('profiles').select('id, full_name, role').eq('role', 'medico');
  console.log('profiles:', JSON.stringify(prof, null, 2));
  if (profErr) console.error('Error prof:', profErr);
}

test();
