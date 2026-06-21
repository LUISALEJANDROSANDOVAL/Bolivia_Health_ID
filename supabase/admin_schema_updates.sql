-- =============================================================================
-- BOLIVIA HEALTH ID — ACTUALIZACIONES DE ESQUEMA PARA ADMINISTRADOR
-- =============================================================================
-- INSTRUCCIONES: Ejecuta este script en el SQL Editor de tu proyecto Supabase.

-- 1. ACTUALIZAR ROL EN PERFILES
-- Permitir que el campo role acepte 'admin'. Postgres auto-nombra el constraint
-- usualmente como profiles_role_check. Si falla por el nombre, puedes omitir
-- la eliminación y aplicar el cambio manualmente en el dashboard de Supabase.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['paciente'::text, 'medico'::text, 'admin'::text]));

-- 2. CREAR TABLA DE ESPECIALIDADES
CREATE TABLE IF NOT EXISTS public.specialties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT specialties_pkey PRIMARY KEY (id)
);

-- Insertar especialidades de ejemplo
INSERT INTO public.specialties (name, description) VALUES
  ('Cardiología', 'Enfermedades del corazón'),
  ('Pediatría', 'Atención médica a niños'),
  ('Traumatología', 'Lesiones óseas y musculares'),
  ('Neurología', 'Sistema nervioso central y periférico'),
  ('Medicina General', 'Atención médica primaria')
ON CONFLICT (name) DO NOTHING;

-- 3. HABILITAR RLS EN ESPECIALIDADES
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_specialties ON public.specialties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY admin_manage_specialties ON public.specialties
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = public.get_profile_id() AND profiles.role = 'admin')
  );

-- 4. POLÍTICAS PARA QUE EL ADMIN CONTROLE SUCURSALES Y HORARIOS
-- El admin puede hacer TODO en las tablas de sucursales, horarios y asignaciones.

CREATE POLICY admin_manage_sucursales ON public.sucursales
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = public.get_profile_id() AND profiles.role = 'admin'));

CREATE POLICY admin_manage_doctor_sucursal ON public.doctor_sucursal
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = public.get_profile_id() AND profiles.role = 'admin'));

CREATE POLICY admin_manage_doctor_schedules ON public.doctor_schedules
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = public.get_profile_id() AND profiles.role = 'admin'));

-- 5. POLÍTICA PARA QUE EL ADMIN PUEDA VER TODOS LOS PERFILES Y ACTUALIZAR ESPECIALIDAD
-- Aseguramos que el admin pueda ver los perfiles para listar doctores
CREATE POLICY admin_select_profiles ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = public.get_profile_id() AND profiles.role = 'admin'));

CREATE POLICY admin_update_profiles ON public.profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = public.get_profile_id() AND profiles.role = 'admin'));

-- =============================================================================
-- NOTA: Como la tabla perfiles tiene una política previa que solo permitía ver 
-- el propio perfil, la nueva política de select permitirá al admin verlos todos.
-- =============================================================================
