-- =============================================================================
-- BOLIVIA HEALTH ID — CREAR PERFIL ADMINISTRADOR
-- =============================================================================
-- Instrucciones: Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- Este script creará un usuario administrador listo para iniciar sesión en tu panel.

DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    admin_email text := 'admin@boliviahealth.com';
    admin_password text := 'admin123456';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        -- 1. Crear el usuario en la capa de Autenticación
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, aud, role
        ) VALUES (
            new_user_id, '00000000-0000-0000-0000-000000000000', admin_email,
            crypt(admin_password, gen_salt('bf')), now(), now(), now(),
            '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'
        );
        
        -- 2. Crear el perfil correspondiente en la tabla pública con rol 'admin'
        INSERT INTO public.profiles (id, wallet_address, full_name, email, role)
        VALUES (new_user_id, '0xAdminPanelMasterWallet', 'Super Administrador', admin_email, 'admin');
        
        RAISE NOTICE '¡Administrador creado con éxito! Correo: %, Contraseña: %', admin_email, admin_password;
    ELSE
        RAISE NOTICE 'El usuario % ya existe en el sistema.', admin_email;
    END IF;
END $$;

-- 1. Crear una función maestra segura para verificar si eres Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Darle poderes absolutos al administrador sobre los perfiles (Doctores)
CREATE POLICY admin_select_all_profiles ON public.profiles 
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_update_all_profiles ON public.profiles 
  FOR UPDATE TO authenticated USING (public.is_admin());

-- 3. Darle poderes absolutos sobre los horarios médicos
CREATE POLICY admin_all_schedules ON public.doctor_schedules 
  FOR ALL TO authenticated USING (public.is_admin());