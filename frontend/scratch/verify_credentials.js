const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gmgilaahgmqagtskkhdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
  console.log('Intentando hacer login con secretaria@boliviahealth.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'secretaria@boliviahealth.com',
    password: 'secretaria123456'
  });

  if (error) {
    console.error('Error de autenticación:', error.message);
  } else {
    console.log('Autenticación exitosa! User ID:', data.user.id);
    console.log('Metadata:', data.user.user_metadata);
  }
}

verify();
