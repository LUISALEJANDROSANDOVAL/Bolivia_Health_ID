-- =============================================================================
-- BOLIVIA HEALTH ID — SCRIPT DE ACTUALIZACIÓN (HOSPITALES Y SECRETARÍA)
-- =============================================================================
-- Ejecuta este script en el SQL Editor de Supabase si ya tienes una base de
-- datos activa con tablas existentes. Este script solo añade los nuevos campos,
-- tablas secundarias, políticas RLS específicas y datos semilla necesarios.
-- =============================================================================

-- Habilitar extensión pgcrypto para hashing de contraseñas de cuentas de prueba
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ACTUALIZAR ROL EN PERFILES PARA INCLUIR 'secretaria'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['paciente'::text, 'medico'::text, 'admin'::text, 'secretaria'::text]));

-- 2. CREAR TABLA DE HOSPITALES
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hospitals_pkey PRIMARY KEY (id)
);

-- 3. ACTUALIZAR TABLAS CON LLAVES FORÁNEAS DE JERARQUÍA
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL;

-- 4. CREAR TABLA DE SECRETARIAS POR SUCURSAL
CREATE TABLE IF NOT EXISTS public.secretaria_sucursal (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  secretaria_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sucursal_id uuid NOT NULL REFERENCES public.sucursales(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT secretaria_sucursal_pkey PRIMARY KEY (id),
  CONSTRAINT secretaria_sucursal_unique UNIQUE (secretaria_id, sucursal_id)
);

-- 5. HABILITAR RLS EN NUEVAS TABLAS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretaria_sucursal ENABLE ROW LEVEL SECURITY;

-- 5.5. CREAR FUNCIÓN AUXILIAR DE ROL (SECURITY DEFINER para evitar recursión infinita en RLS)
CREATE OR REPLACE FUNCTION public.get_profile_role()
RETURNS text AS $$
  SELECT role FROM public.profiles 
  WHERE LOWER(wallet_address) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. CREAR FUNCIÓN AUXILIAR DE ADMINISTRADOR
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_profile_role() = 'admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. DEFINIR/ACTUALIZAR POLÍTICAS RLS (CON DROP PREVIO PARA EVITAR ERRORES)

-- Políticas de Hospitals
DROP POLICY IF EXISTS select_hospitals ON public.hospitals;
CREATE POLICY select_hospitals ON public.hospitals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS admin_all_hospitals ON public.hospitals;
CREATE POLICY admin_all_hospitals ON public.hospitals
  FOR ALL TO authenticated USING (public.is_admin());

-- Políticas de Secretaria-Sucursal
DROP POLICY IF EXISTS select_secretaria_sucursal ON public.secretaria_sucursal;
CREATE POLICY select_secretaria_sucursal ON public.secretaria_sucursal
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS admin_all_secretaria_sucursal ON public.secretaria_sucursal;
CREATE POLICY admin_all_secretaria_sucursal ON public.secretaria_sucursal
  FOR ALL TO authenticated USING (public.is_admin());

-- Acceso a Profiles (Permitir a secretaria buscar/registrar perfiles)
DROP POLICY IF EXISTS secretaria_select_profiles ON public.profiles;
CREATE POLICY secretaria_select_profiles ON public.profiles
  FOR SELECT TO authenticated
  USING (public.get_profile_role() = 'secretaria');

DROP POLICY IF EXISTS secretaria_update_profiles ON public.profiles;
CREATE POLICY secretaria_update_profiles ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.get_profile_role() = 'secretaria');

-- Acceso a Appointments (Gestión de citas de su sucursal)
DROP POLICY IF EXISTS secretaria_select_appointments ON public.appointments;
CREATE POLICY secretaria_select_appointments ON public.appointments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.secretaria_sucursal ss
      WHERE ss.secretaria_id = public.get_profile_id()
        AND ss.sucursal_id = appointments.sucursal_id
    )
  );

DROP POLICY IF EXISTS secretaria_insert_appointments ON public.appointments;
CREATE POLICY secretaria_insert_appointments ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.secretaria_sucursal ss
      WHERE ss.secretaria_id = public.get_profile_id()
        AND ss.sucursal_id = appointments.sucursal_id
    )
  );

DROP POLICY IF EXISTS secretaria_update_appointments ON public.appointments;
CREATE POLICY secretaria_update_appointments ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.secretaria_sucursal ss
      WHERE ss.secretaria_id = public.get_profile_id()
        AND ss.sucursal_id = appointments.sucursal_id
    )
  );

DROP POLICY IF EXISTS secretaria_delete_appointments ON public.appointments;
CREATE POLICY secretaria_delete_appointments ON public.appointments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.secretaria_sucursal ss
      WHERE ss.secretaria_id = public.get_profile_id()
        AND ss.sucursal_id = appointments.sucursal_id
    )
  );

-- Políticas del Administrador
DROP POLICY IF EXISTS admin_select_all_profiles ON public.profiles;
CREATE POLICY admin_select_all_profiles ON public.profiles 
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS admin_update_all_profiles ON public.profiles;
CREATE POLICY admin_update_all_profiles ON public.profiles 
  FOR UPDATE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS admin_all_schedules ON public.doctor_schedules;
CREATE POLICY admin_all_schedules ON public.doctor_schedules 
  FOR ALL TO authenticated USING (public.is_admin());


-- 8. DATOS SEMILLA PARA PRUEBAS (HOSPITAL, SUCURSALES Y CUENTAS)

-- 8.1. Insertar Hospital de Prueba
INSERT INTO public.hospitals (id, name, logo_url)
VALUES ('a0000000-0000-0000-0000-000000000000', 'Hospital Obrero N° 1', '/logo.png')
ON CONFLICT (name) DO NOTHING;

-- 8.2. Insertar Sucursales
INSERT INTO public.sucursales (id, name, address, coordinates, hospital_id)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'Sede Central - Miraflores', 'Av. Saavedra, La Paz', '-16.5020,-68.1215', 'a0000000-0000-0000-0000-000000000000'),
  ('b0000000-0000-0000-0000-000000000002', 'Sede Sur - Calacoto', 'Calle 15 de Calacoto, La Paz', '-16.5410,-68.0820', 'a0000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

UPDATE public.sucursales SET hospital_id = 'a0000000-0000-0000-0000-000000000000' WHERE hospital_id IS NULL;

-- 8.3. Reparar posibles NULOS en auth.users (causa del error "Database error querying schema")
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  is_anonymous = COALESCE(is_anonymous, false)
WHERE 
  confirmation_token IS NULL 
  OR email_change IS NULL 
  OR email_change_token_new IS NULL 
  OR recovery_token IS NULL 
  OR reauthentication_token IS NULL
  OR is_anonymous IS NULL;

-- Reparar wallet_address de perfiles existentes para emparejar el prefijo de correo (RLS)
UPDATE public.profiles SET wallet_address = 'secretaria' WHERE email = 'secretaria@boliviahealth.com';
UPDATE public.profiles SET wallet_address = 'admin' WHERE email = 'admin@boliviahealth.com';

-- 8.4. Crear Usuario Administrador de Prueba
DO $$
DECLARE
    admin_id uuid := 'ad000000-0000-0000-0000-000000000000';
    admin_email text := 'admin@boliviahealth.com';
    admin_password text := 'admin123456';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        -- Crear usuario en auth.users con todos los campos requeridos no nulos
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, aud, role,
            confirmation_token, email_change, email_change_token_new, recovery_token, reauthentication_token, is_anonymous
        ) VALUES (
            admin_id, '00000000-0000-0000-0000-000000000000', admin_email,
            crypt(admin_password, gen_salt('bf')), now(), now(), now(),
            '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated',
            '', '', '', '', '', false
        );
        
        -- Crear perfil en public.profiles
        INSERT INTO public.profiles (id, wallet_address, full_name, email, role)
        VALUES (admin_id, 'admin', 'Super Administrador', admin_email, 'admin');
    END IF;
END $$;

-- 8.5. Crear Usuario Secretaria de Prueba
DO $$
DECLARE
    sec_id uuid := 'e0000000-0000-0000-0000-000000000000';
    sec_email text := 'secretaria@boliviahealth.com';
    sec_password text := 'secretaria123456';
    hospital_id uuid := 'a0000000-0000-0000-0000-000000000000';
    sucursal_id uuid := 'b0000000-0000-0000-0000-000000000001';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = sec_email) THEN
        -- Crear usuario en auth.users con todos los campos requeridos no nulos
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, aud, role,
            confirmation_token, email_change, email_change_token_new, recovery_token, reauthentication_token, is_anonymous
        ) VALUES (
            sec_id, '00000000-0000-0000-0000-000000000000', sec_email,
            crypt(sec_password, gen_salt('bf')), now(), now(), now(),
            '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated',
            '', '', '', '', '', false
        );
        
        -- Crear perfil en public.profiles
        INSERT INTO public.profiles (id, wallet_address, full_name, email, role, hospital_id)
        VALUES (sec_id, 'secretaria', 'María Recepcionista', sec_email, 'secretaria', hospital_id);
        
        -- Asignar la secretaria a la Sede Central
        INSERT INTO public.secretaria_sucursal (secretaria_id, sucursal_id)
        VALUES (sec_id, sucursal_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 8.6. Asociar Médicos Existentes al Hospital y a la Sede Central de Prueba
UPDATE public.profiles SET hospital_id = 'a0000000-0000-0000-0000-000000000000' WHERE role = 'medico';

INSERT INTO public.doctor_sucursal (doctor_id, sucursal_id)
SELECT id, 'b0000000-0000-0000-0000-000000000001'
FROM public.profiles
WHERE role = 'medico'
ON CONFLICT DO NOTHING;

-- Auto-confirmar correos pendientes para evitar errores de autenticación
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
