import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Faltan las variables de entorno de Supabase. Asegúrate de tener configurado el archivo .env en la carpeta mobile.'
  );
}

// Inicializa el cliente de Supabase
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
