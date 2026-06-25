const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gmgilaahgmqagtskkhdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdmin() {
  console.log('Intentando iniciar sesión como admin2@boliviahealth.com...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin2@boliviahealth.com',
      password: 'admin123456' // o la contraseña correspondiente
    });

    if (error) {
      console.error('Error de login:', error.message);
      return;
    }
    console.log('Login exitoso. UID:', data.user.id);

    console.log('Consultando perfil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error de consulta de perfil:', profileError.message);
    } else {
      console.log('Perfil obtenido:', profile);
    }
  } catch (err) {
    console.error('Excepción:', err);
  }
}

testAdmin();
