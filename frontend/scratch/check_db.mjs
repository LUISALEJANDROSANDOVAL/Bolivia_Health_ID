import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gmgilaahgmqagtskkhdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log('--- Appointments Sample ---');
  const { data: aptData, error: aptError } = await supabase.from('appointments').select('*').limit(1);
  if (aptError) console.error('Error appointments:', aptError);
  else console.log('Columns:', Object.keys(aptData[0] || {}));

  console.log('\n--- Profiles Sample ---');
  const { data: profData, error: profError } = await supabase.from('profiles').select('*').limit(1);
  if (profError) console.error('Error profiles:', profError);
  else console.log('Columns:', Object.keys(profData[0] || {}));
}

checkSchema();
