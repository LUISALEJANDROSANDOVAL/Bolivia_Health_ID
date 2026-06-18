import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gmgilaahgmqagtskkhdz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: 'Test Name' })
    .eq('wallet_address', 'test_address');
    
  console.log('Update Error:', error);

  const { data: d2, error: e2 } = await supabase.from('profiles').select('*').limit(1);
  console.log('Select Error:', e2);
  console.log('Data:', d2);
}

test();
