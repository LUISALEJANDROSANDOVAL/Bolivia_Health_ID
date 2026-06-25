const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gmgilaahgmqagtskkhdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false // Evitar persistencia local para pruebas limpias
  }
});

async function runTest() {
  console.log('1. Intentando iniciar sesión...');
  try {
    const { data: data1, error: error1 } = await supabase.auth.signInWithPassword({
      email: 'secretaria@boliviahealth.com',
      password: 'secretaria123456'
    });

    if (error1) {
      console.error('Error en login 1:', error1.message);
      return;
    }
    console.log('Login 1 exitoso. UID:', data1.user.id);

    console.log('2. Consultando perfil...');
    const { data: profile1, error: profileError1 } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data1.user.id)
      .single();

    if (profileError1) {
      console.error('Error perfil 1:', profileError1.message);
    } else {
      console.log('Perfil 1 consultado:', profile1);
    }

    console.log('3. Cerrando sesión...');
    await supabase.auth.signOut();
    console.log('Sesión cerrada.');

    console.log('4. Intentando iniciar sesión por segunda vez...');
    const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
      email: 'secretaria@boliviahealth.com',
      password: 'secretaria123456'
    });

    if (error2) {
      console.error('Error en login 2:', error2.message);
      return;
    }
    console.log('Login 2 exitoso. UID:', data2.user.id);

    console.log('5. Consultando perfil por segunda vez...');
    const { data: profile2, error: profileError2 } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data2.user.id)
      .single();

    if (profileError2) {
      console.error('Error perfil 2:', profileError2.message);
    } else {
      console.log('Perfil 2 consultado:', profile2);
    }

    console.log('Prueba finalizada con éxito.');
  } catch (err) {
    console.error('Excepción durante la prueba:', err);
  }
}

runTest();
