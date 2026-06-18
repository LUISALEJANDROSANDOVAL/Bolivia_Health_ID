-- =============================================================================
-- BOLIVIA HEALTH ID — AUTO-CONFIRMACIÓN DE CORREOS PARA INICIO DE SESIÓN WEB3
-- =============================================================================
-- Por defecto, Supabase requiere que los correos electrónicos sean confirmados.
-- Dado que Bolivia Health ID utiliza billeteras Web3 con correos deterministas 
-- (ej: 0x... @boliviahealth.com), los usuarios no pueden recibir ni confirmar
-- estos correos electrónicos. Esto provoca que el inicio de sesión silencioso 
-- falle con el error "email_not_confirmed" y queden como usuarios anónimos,
-- impidiendo que las políticas de RLS les permitan insertar o leer registros.
--
-- Ejecuta este script en el Editor de SQL de tu consola de Supabase para:
-- 1. Auto-confirmar las cuentas de todos los usuarios registrados actualmente.
-- 2. Crear un disparador (trigger) que auto-confirme todas las cuentas futuras.
-- =============================================================================

-- 1. Confirmar correos de todos los usuarios existentes en la tabla auth.users
UPDATE auth.users 
SET 
  email_confirmed_at = now() 
WHERE 
  email_confirmed_at IS NULL;

-- 2. Crear una función para auto-confirmar los correos de nuevos usuarios
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el disparador en la tabla auth.users para automatizarlo en el futuro
DROP TRIGGER IF EXISTS tr_auto_confirm_user_email ON auth.users;

CREATE TRIGGER tr_auto_confirm_user_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user_email();
