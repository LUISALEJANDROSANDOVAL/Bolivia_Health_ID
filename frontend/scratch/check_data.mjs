import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gmgilaahgmqagtskkhdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
  console.log('--- Checking Profiles ---');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, full_name, role');
  if (pError) console.error('Profiles Error:', pError);
  else {
    console.log(`Found ${profiles.length} profiles.`);
    console.log('Doctors:', profiles.filter(p => p.role === 'medico').map(p => p.full_name));
    console.log('Patients:', profiles.filter(p => p.role === 'paciente').map(p => p.full_name));
  }

  console.log('\n--- Checking Appointments ---');
  const { data: appointments, error: aError } = await supabase.from('appointments').select('id, doctor_name, status');
  if (aError) console.error('Appointments Error:', aError);
  else {
    console.log(`Found ${appointments.length} appointments.`);
    console.log('Recent appointments:', appointments.slice(0, 5));
  }
}

checkData();
