const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Read env variables
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: URL o Anon Key de Supabase faltantes en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = 'eddyygalvaan@gmail.com';
const password = 'AdminPassword2026!'; 

async function run() {
  console.log(`Intentando registrar a ${email} en Supabase Auth...`);
  
  // 1. Sign up user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Error al registrar en Supabase Auth:', authError.message);
    process.exit(1);
  }

  const user = authData.user;
  if (!user) {
    console.error('Error: No se recibió información del usuario.');
    process.exit(1);
  }

  console.log(`Usuario creado exitosamente en Supabase Auth. ID: ${user.id}`);

  // 2. Check if a profile already exists
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('id, wallet_address')
    .eq('email', email)
    .maybeSingle();

  if (selectError) {
    console.error('Error al consultar perfiles existentes:', selectError.message);
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex');

  if (existingProfile) {
    console.log(`Se encontró un perfil existente con ID: ${existingProfile.id}. Actualizándolo...`);
    
    // Delete old profile
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.warn('Advertencia al eliminar perfil antiguo:', deleteError.message);
    }

    // Insert new profile linked to the auth user ID
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        wallet_address: existingProfile.wallet_address || `0xadmin_${user.id.substring(0, 10)}`,
        full_name: 'eddy galvan',
        email: email,
        role: 'admin',
        password_hash: hash,
        identity_verified: true
      });

    if (insertError) {
      console.error('Error al insertar perfil actualizado:', insertError.message);
    } else {
      console.log('Perfil de administrador actualizado y configurado correctamente.');
    }
  } else {
    console.log('No se encontró un perfil existente. Creando uno nuevo...');

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        wallet_address: `0xadmin_${user.id.substring(0, 10)}`,
        full_name: 'eddy galvan',
        email: email,
        role: 'admin',
        password_hash: hash,
        identity_verified: true
      });

    if (insertError) {
      console.error('Error al crear perfil:', insertError.message);
    } else {
      console.log('Perfil de administrador creado correctamente.');
    }
  }

  console.log('\n--- REGISTRO EXITOSO ---');
  console.log(`Correo: ${email}`);
  console.log(`Contraseña: ${password}`);
  console.log('------------------------');
}

run();
