-- =============================================================================
-- BOLIVIA HEALTH ID — ESQUEMA COMPLETO Y BASE DE DATOS CONSOLIDADA
-- =============================================================================
-- Este archivo contiene todo el esquema de la base de datos, relaciones,
-- funciones auxiliares, políticas de RLS, índices de rendimiento y datos semilla.
--
-- Ejecuta este script en el SQL Editor de tu consola de Supabase para inicializar
-- o reconstruir la base de datos completa.
-- =============================================================================

-- Habilitar extensión pgcrypto para hashing de contraseñas de cuentas de prueba
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. CREACIÓN DE TABLAS (ORDEN TOPOLÓGICO DE DEPENDENCIAS)
-- -----------------------------------------------------------------------------

-- Especialidades Médicas
CREATE TABLE IF NOT EXISTS public.specialties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT specialties_pkey PRIMARY KEY (id)
);

-- Hospitales e Instituciones
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hospitals_pkey PRIMARY KEY (id)
);

-- Catálogo de Medicamentos
CREATE TABLE IF NOT EXISTS public.medicine_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  generic_name text NOT NULL,
  brand_name text,
  form text,
  item_number text,
  concentration text,
  CONSTRAINT medicine_catalog_pkey PRIMARY KEY (id)
);

-- Catálogo de Diagnósticos (CIE-10 o similar)
CREATE TABLE IF NOT EXISTS public.diagnosis_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  category text,
  is_chronic boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT diagnosis_catalog_pkey PRIMARY KEY (id)
);

-- Datos Mock de SEGIP (Verificación de Identidad Nacional)
CREATE TABLE IF NOT EXISTS public.mock_segip_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cedula_identidad text NOT NULL UNIQUE,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  fecha_nacimiento date,
  estado text DEFAULT 'Vigente'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mock_segip_data_pkey PRIMARY KEY (id)
);

-- Datos Mock de SIREPRO (Verificación de Matrícula Profesional de Médicos)
CREATE TABLE IF NOT EXISTS public.mock_sirepro_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  matricula text NOT NULL UNIQUE,
  nombre_completo text NOT NULL,
  especialidad text,
  estado_matricula text DEFAULT 'VIGENTE'::text,
  fecha_emision date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mock_sirepro_data_pkey PRIMARY KEY (id)
);

-- Sucursales o Sedes de Hospitales
CREATE TABLE IF NOT EXISTS public.sucursales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  coordinates text,
  created_at timestamp with time zone DEFAULT now(),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  CONSTRAINT sucursales_pkey PRIMARY KEY (id)
);

-- Perfiles de Usuarios (Pacientes, Médicos, Administrativos, Secretarias)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL UNIQUE,
  full_name text NOT NULL,
  cedula_identidad text UNIQUE,
  email text UNIQUE,
  phone text,
  address text,
  occupation text,
  role text DEFAULT 'paciente'::text CHECK (role = ANY (ARRAY['paciente'::text, 'medico'::text, 'admin'::text, 'secretaria'::text])),
  created_at timestamp with time zone DEFAULT now(),
  license_number text,
  specialty text,
  preferences jsonb DEFAULT '{}'::jsonb,
  password_hash text,
  birth_date date,
  gender text CHECK (gender = ANY (ARRAY['M'::text, 'F'::text, 'Otro'::text])),
  identity_verified boolean DEFAULT false,
  license_verified boolean DEFAULT false,
  approval_status text DEFAULT 'pending'::text CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Tabla intermedia Doctor-Sucursal
CREATE TABLE IF NOT EXISTS public.doctor_sucursal (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sucursal_id uuid NOT NULL REFERENCES public.sucursales(id) ON DELETE CASCADE,
  schedule text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctor_sucursal_pkey PRIMARY KEY (id),
  CONSTRAINT doctor_sucursal_unique UNIQUE (doctor_id, sucursal_id)
);

-- Tabla intermedia Secretaria-Sucursal
CREATE TABLE IF NOT EXISTS public.secretaria_sucursal (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  secretaria_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sucursal_id uuid NOT NULL REFERENCES public.sucursales(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT secretaria_sucursal_pkey PRIMARY KEY (id),
  CONSTRAINT secretaria_sucursal_unique UNIQUE (secretaria_id, sucursal_id)
);

-- Horarios de Atención de Doctores
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sucursal_id uuid NOT NULL REFERENCES public.sucursales(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  slot_duration_minutes integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id)
);

-- Signos Vitales del Paciente
CREATE TABLE IF NOT EXISTS public.patient_vitals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  blood_type text,
  allergies text,
  blood_pressure text,
  weight text,
  height text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  heart_rate text,
  temperature text,
  CONSTRAINT patient_vitals_pkey PRIMARY KEY (id)
);

-- Antecedentes Médicos y Consultas Clínicas
CREATE TABLE IF NOT EXISTS public.medical_background (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text CHECK (category = ANY (ARRAY['consulta'::text, 'vaccine'::text, 'surgery'::text])),
  status_detail text,
  date_recorded date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  diagnosis_id uuid REFERENCES public.diagnosis_catalog(id) ON DELETE SET NULL,
  CONSTRAINT medical_background_pkey PRIMARY KEY (id)
);

-- Documentos de Salud (Exámenes de Laboratorio, Imágenes, Recetas Firmadas)
CREATE TABLE IF NOT EXISTS public.health_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text CHECK (category = ANY (ARRAY['Laboratorio'::text, 'Imágenes'::text, 'Recetas'::text, 'Otros'::text])),
  file_size text,
  file_url text NOT NULL,
  file_type text,
  created_at timestamp with time zone DEFAULT now(),
  tx_hash text CHECK (tx_hash IS NULL OR tx_hash ~ '^0x[0-9a-fA-F]{64}$'::text),
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT health_records_pkey PRIMARY KEY (id)
);

-- Recetas Activas y Tratamiento Farmacológico
CREATE TABLE IF NOT EXISTS public.medications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'suspended'::text])),
  created_at timestamp with time zone DEFAULT now(),
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  medicine_id uuid REFERENCES public.medicine_catalog(id) ON DELETE SET NULL,
  diagnosis_id uuid REFERENCES public.diagnosis_catalog(id) ON DELETE SET NULL,
  CONSTRAINT medications_pkey PRIMARY KEY (id)
);

-- Permisos de Acceso al Historial Clínico
CREATE TABLE IF NOT EXISTS public.access_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'expired'::text, 'revoked'::text])),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  specialty text REFERENCES public.specialties(name) ON DELETE SET NULL,
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT access_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT check_permission_type CHECK (
    (doctor_id IS NOT NULL AND specialty IS NULL AND sucursal_id IS NULL) OR
    (doctor_id IS NULL AND specialty IS NOT NULL AND sucursal_id IS NOT NULL)
  )
);

-- Notificaciones Internas
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['request'::text, 'approval'::text, 'prescription'::text, 'alert'::text, 'info'::text])),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Citas Médicas
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  doctor_name text,
  specialty text,
  appointment_date date,
  appointment_time time without time zone,
  location text,
  type text CHECK (type = ANY (ARRAY['presencial'::text, 'virtual'::text])),
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text, 'in_progress'::text])),
  created_at timestamp with time zone DEFAULT now(),
  end_time time without time zone,
  priority text DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['normal'::text, 'high'::text])),
  reason text,
  notes text,
  sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL,
  CONSTRAINT appointments_pkey PRIMARY KEY (id)
);

-- Validaciones de Identidad (SEGIP)
CREATE TABLE IF NOT EXISTS public.identity_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cedula_identidad text NOT NULL,
  segip_status text NOT NULL DEFAULT 'pending'::text CHECK (segip_status = ANY (ARRAY['pending'::text, 'verified'::text, 'mismatch'::text, 'manual_review'::text])),
  verification_method text NOT NULL DEFAULT 'automated'::text CHECK (verification_method = ANY (ARRAY['automated'::text, 'manual'::text])),
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT identity_validations_pkey PRIMARY KEY (id)
);

-- Validaciones de Médicos (SIREPRO)
CREATE TABLE IF NOT EXISTS public.doctor_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number text NOT NULL,
  sirepro_status text NOT NULL DEFAULT 'pending'::text CHECK (sirepro_status = ANY (ARRAY['pending'::text, 'processing'::text, 'valid'::text, 'invalid'::text, 'error'::text])),
  raw_scraper_response jsonb,
  error_message text,
  validated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctor_validations_pkey PRIMARY KEY (id)
);


-- -----------------------------------------------------------------------------
-- 2. FUNCIONES AUXILIARES Y DISPARADORES (TRIGGERS)
-- -----------------------------------------------------------------------------

-- Función para generar los slots de tiempo disponibles de un doctor
CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_doctor_id uuid,
    p_sucursal_id uuid,
    p_date date
)
RETURNS TABLE (
    slot_time time
) AS $$
DECLARE
    v_day_of_week integer;
    v_schedule record;
BEGIN
    -- extract(isodow from date) devuelve 1=Lunes, 7=Domingo
    v_day_of_week := extract(isodow from p_date);

    -- Obtener el horario del doctor para ese día en esa sucursal
    SELECT * INTO v_schedule
    FROM public.doctor_schedules
    WHERE doctor_id = p_doctor_id
      AND sucursal_id = p_sucursal_id
      AND day_of_week = v_day_of_week
      AND is_active = true
    LIMIT 1;

    -- Si no hay horario activo, no retornar nada
    IF NOT FOUND OR v_schedule.start_time >= v_schedule.end_time THEN
        RETURN;
    END IF;

    -- Generar los slots de tiempo y filtrar los que ya están reservados
    RETURN QUERY
    WITH slots AS (
        SELECT generate_series(
            v_schedule.start_time::timestamp,
            (v_schedule.end_time - (v_schedule.slot_duration_minutes || ' minutes')::interval)::timestamp,
            (v_schedule.slot_duration_minutes || ' minutes')::interval
        )::time AS slot_time
    )
    SELECT s.slot_time
    FROM slots s
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.appointments a
        WHERE a.doctor_id = p_doctor_id
          AND a.appointment_date = p_date
          AND a.status IN ('scheduled', 'confirmed', 'in_progress')
          AND (s.slot_time < COALESCE(a.end_time, a.appointment_time + (v_schedule.slot_duration_minutes || ' minutes')::interval)
               AND 
               (s.slot_time + (v_schedule.slot_duration_minutes || ' minutes')::interval) > a.appointment_time)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función y disparador para verificar credenciales de médicos automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.fn_final_verification()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'medico' THEN
    IF NEW.identity_verified IS DISTINCT FROM true THEN
      NEW.identity_verified := false;
    END IF;
    IF NEW.license_verified IS DISTINCT FROM true THEN
      NEW.license_verified := false;
    END IF;

    IF NEW.identity_verified AND NEW.license_verified THEN
      NEW.approval_status := 'approved';
    ELSE
      NEW.approval_status := 'pending';
    END IF;
  ELSE
    NEW.identity_verified := false;
    NEW.license_verified := false;
    NEW.approval_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_0_final_validation ON public.profiles;
CREATE TRIGGER tr_0_final_validation
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_final_verification();

-- Función helper para mapear billetera Web3 a perfil Supabase
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles 
  WHERE LOWER(wallet_address) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función helper para comprobar permisos de acceso activos de historial médico
CREATE OR REPLACE FUNCTION public.has_active_permission(p_patient_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.access_permissions ap
    WHERE ap.patient_id = p_patient_id
      AND ap.status = 'active'
      AND (ap.expires_at IS NULL OR ap.expires_at > now())
      AND (
        ap.doctor_id = public.get_profile_id()
        OR (
          ap.specialty = (SELECT specialty FROM public.profiles WHERE id = public.get_profile_id())
          AND EXISTS (
            SELECT 1 FROM public.doctor_sucursal ds
            WHERE ds.doctor_id = public.get_profile_id()
              AND ds.sucursal_id = ap.sucursal_id
          )
        )
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función helper para obtener el rol del perfil de forma segura sin recursión en RLS
CREATE OR REPLACE FUNCTION public.get_profile_role()
RETURNS text AS $$
  SELECT role FROM public.profiles 
  WHERE LOWER(wallet_address) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función helper segura para verificar si eres Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_profile_role() = 'admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Función y disparador para auto-confirmar correos de nuevos usuarios Web3 silenciosamente
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auto_confirm_user_email ON auth.users;
CREATE TRIGGER tr_auto_confirm_user_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user_email();


-- -----------------------------------------------------------------------------
-- 3. ACTIVACIÓN DE SEGURIDAD DE FILA (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_background ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_sucursal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretaria_sucursal ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- 4. POLÍTICAS DE CONTROL DE ACCESO (RLS POLICIES)
-- -----------------------------------------------------------------------------

-- --- POLÍTICAS DE PROFILES ---
CREATE POLICY select_own_profile ON public.profiles
  FOR SELECT TO authenticated USING (public.get_profile_id() = id);

CREATE POLICY update_own_profile ON public.profiles
  FOR UPDATE TO authenticated USING (public.get_profile_id() = id) WITH CHECK (public.get_profile_id() = id);

CREATE POLICY insert_own_profile ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (
    LOWER(wallet_address) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1))
  );

-- Vista pública no sensible para búsquedas cruzadas de médicos y pacientes
CREATE OR REPLACE VIEW public.profiles_public AS
  SELECT id, full_name, specialty, role, license_number, approval_status, wallet_address
  FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;

-- --- POLÍTICAS DE ACCESS_PERMISSIONS ---
CREATE POLICY select_involved_permissions ON public.access_permissions
  FOR SELECT TO authenticated USING (
    public.get_profile_id() = patient_id 
    OR public.get_profile_id() = doctor_id 
    OR public.get_profile_id() = requested_by
    OR (
      status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
      AND specialty = (SELECT specialty FROM public.profiles WHERE id = public.get_profile_id())
      AND EXISTS (
        SELECT 1 FROM public.doctor_sucursal ds
        WHERE ds.doctor_id = public.get_profile_id()
          AND ds.sucursal_id = access_permissions.sucursal_id
      )
    )
  );

CREATE POLICY insert_permission_request ON public.access_permissions
  FOR INSERT TO authenticated WITH CHECK (
    patient_id = public.get_profile_id()
    OR
    (
      requested_by = public.get_profile_id()
      AND (status = 'pending' OR (status = 'active' AND public.has_active_permission(patient_id)))
    )
  );

CREATE POLICY update_patient_permission ON public.access_permissions
  FOR UPDATE TO authenticated USING (public.get_profile_id() = patient_id) WITH CHECK (public.get_profile_id() = patient_id);

CREATE POLICY delete_patient_permission ON public.access_permissions
  FOR DELETE TO authenticated USING (public.get_profile_id() = patient_id);

-- --- POLÍTICAS DE PATIENT_VITALS ---
CREATE POLICY select_own_vitals ON public.patient_vitals
  FOR SELECT TO authenticated USING (public.get_profile_id() = patient_id);

CREATE POLICY select_permitted_vitals ON public.patient_vitals
  FOR SELECT TO authenticated USING (public.has_active_permission(patient_id));

CREATE POLICY insert_permitted_vitals ON public.patient_vitals
  FOR INSERT TO authenticated WITH CHECK (
    public.get_profile_id() = patient_id OR public.has_active_permission(patient_id)
  );

CREATE POLICY update_permitted_vitals ON public.patient_vitals
  FOR UPDATE TO authenticated USING (public.has_active_permission(patient_id));

-- --- POLÍTICAS DE MEDICAL_BACKGROUND ---
CREATE POLICY select_own_medical_background ON public.medical_background
  FOR SELECT TO authenticated USING (public.get_profile_id() = patient_id);

CREATE POLICY select_permitted_medical_background ON public.medical_background
  FOR SELECT TO authenticated USING (public.has_active_permission(patient_id));

CREATE POLICY select_own_created_medical_background ON public.medical_background
  FOR SELECT TO authenticated USING (public.get_profile_id() = doctor_id);

CREATE POLICY insert_permitted_medical_background ON public.medical_background
  FOR INSERT TO authenticated WITH CHECK (
    public.get_profile_id() = patient_id
    OR (
      public.get_profile_id() = doctor_id
      AND EXISTS (
        SELECT 1 FROM public.access_permissions ap
        WHERE ap.patient_id = medical_background.patient_id
          AND ap.doctor_id = public.get_profile_id()
          AND ap.status = 'active'
          AND (ap.expires_at IS NULL OR ap.expires_at > now())
      )
    )
  );

-- --- POLÍTICAS DE HEALTH_RECORDS ---
CREATE POLICY select_own_health_records ON public.health_records
  FOR SELECT TO authenticated USING (public.get_profile_id() = patient_id);

CREATE POLICY select_permitted_health_records ON public.health_records
  FOR SELECT TO authenticated USING (public.has_active_permission(patient_id));

CREATE POLICY insert_permitted_health_records ON public.health_records
  FOR INSERT TO authenticated WITH CHECK (
    (public.get_profile_id() = doctor_id OR public.get_profile_id() = patient_id)
    AND (public.get_profile_id() = patient_id OR public.has_active_permission(patient_id))
  );

-- --- POLÍTICAS DE MEDICATIONS ---
CREATE POLICY select_own_medications ON public.medications
  FOR SELECT TO authenticated USING (public.get_profile_id() = patient_id);

CREATE POLICY select_permitted_medications ON public.medications
  FOR SELECT TO authenticated USING (public.has_active_permission(patient_id));

CREATE POLICY select_own_created_medications ON public.medications
  FOR SELECT TO authenticated USING (public.get_profile_id() = doctor_id);

CREATE POLICY insert_permitted_medications ON public.medications
  FOR INSERT TO authenticated WITH CHECK (
    public.get_profile_id() = patient_id
    OR (
      public.get_profile_id() = doctor_id
      AND EXISTS (
        SELECT 1 FROM public.access_permissions ap
        WHERE ap.patient_id = medications.patient_id
          AND ap.doctor_id = public.get_profile_id()
          AND ap.status = 'active'
          AND (ap.expires_at IS NULL OR ap.expires_at > now())
      )
    )
  );

-- --- POLÍTICAS DE APPOINTMENTS ---
CREATE POLICY select_involved_appointments ON public.appointments
  FOR SELECT TO authenticated USING (public.get_profile_id() = patient_id OR public.get_profile_id() = doctor_id);

CREATE POLICY insert_appointment ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (
    public.get_profile_id() = patient_id
    OR (
      public.get_profile_id() = doctor_id
      AND (
        public.has_active_permission(patient_id)
        OR EXISTS (
          SELECT 1 FROM public.access_permissions ap
          WHERE ap.patient_id = appointments.patient_id
            AND ap.status = 'pending'
            AND (ap.doctor_id = public.get_profile_id() OR ap.requested_by = public.get_profile_id())
        )
      )
    )
  );

CREATE POLICY update_involved_appointment ON public.appointments
  FOR UPDATE TO authenticated USING (public.get_profile_id() = patient_id OR public.get_profile_id() = doctor_id);

CREATE POLICY delete_involved_appointment ON public.appointments
  FOR DELETE TO authenticated USING (public.get_profile_id() = patient_id OR public.get_profile_id() = doctor_id);

-- --- POLÍTICAS DE NOTIFICATIONS ---
CREATE POLICY select_own_notifications ON public.notifications
  FOR SELECT TO authenticated USING (public.get_profile_id() = user_id);

CREATE POLICY insert_notification ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (
    public.get_profile_id() = sender_id
    AND (
      public.get_profile_id() = user_id
      OR EXISTS (
        SELECT 1 FROM public.access_permissions ap
        WHERE ((ap.doctor_id = public.get_profile_id() AND ap.patient_id = notifications.user_id)
               OR (ap.patient_id = public.get_profile_id() AND ap.doctor_id = notifications.user_id))
          AND ap.status IN ('active', 'pending')
      )
      OR EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE ((a.doctor_id = public.get_profile_id() AND a.patient_id = notifications.user_id)
               OR (a.patient_id = public.get_profile_id() AND a.doctor_id = notifications.user_id))
      )
    )
  );

CREATE POLICY update_own_notification ON public.notifications
  FOR UPDATE TO authenticated USING (public.get_profile_id() = user_id) WITH CHECK (public.get_profile_id() = user_id);

CREATE POLICY delete_own_notification ON public.notifications
  FOR DELETE TO authenticated USING (public.get_profile_id() = user_id);

-- --- POLÍTICAS DE HOSPITALS ---
CREATE POLICY select_hospitals ON public.hospitals
  FOR SELECT TO authenticated USING (true);

-- --- POLÍTICAS DE SECRETARIA_SUCURSAL ---
CREATE POLICY select_secretaria_sucursal ON public.secretaria_sucursal
  FOR SELECT TO authenticated USING (true);

-- --- POLÍTICAS GENERALES DE ACCESO DE SECRETARIA ---
CREATE POLICY secretaria_select_profiles ON public.profiles
  FOR SELECT TO authenticated USING (public.get_profile_role() = 'secretaria');

CREATE POLICY secretaria_update_profiles ON public.profiles
  FOR UPDATE TO authenticated USING (public.get_profile_role() = 'secretaria');

CREATE POLICY secretaria_select_appointments ON public.appointments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.secretaria_sucursal ss
      WHERE ss.secretaria_id = public.get_profile_id() AND ss.sucursal_id = appointments.sucursal_id
    )
  );

CREATE POLICY secretaria_insert_appointments ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.secretaria_sucursal ss
      WHERE ss.secretaria_id = public.get_profile_id() AND ss.sucursal_id = appointments.sucursal_id
    )
  );

CREATE POLICY secretaria_update_appointments ON public.appointments
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.secretaria_sucursal ss
      WHERE ss.secretaria_id = public.get_profile_id() AND ss.sucursal_id = appointments.sucursal_id
    )
  );

CREATE POLICY secretaria_delete_appointments ON public.appointments
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.secretaria_sucursal ss
      WHERE ss.secretaria_id = public.get_profile_id() AND ss.sucursal_id = appointments.sucursal_id
    )
  );

-- --- POLÍTICAS GENERALES DE ACCESO DE DOCTOR SUCURSAL Y SCHEDULES ---
CREATE POLICY select_sucursales ON public.sucursales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY select_doctor_sucursal ON public.doctor_sucursal
  FOR SELECT TO authenticated USING (true);

CREATE POLICY select_doctor_schedules ON public.doctor_schedules
  FOR SELECT TO authenticated USING (true);

-- --- POLÍTICAS DEL ADMINISTRADOR ---
CREATE POLICY admin_select_all_profiles ON public.profiles 
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_update_all_profiles ON public.profiles 
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY admin_all_schedules ON public.doctor_schedules 
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY admin_all_hospitals ON public.hospitals
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY admin_all_secretaria_sucursal ON public.secretaria_sucursal
  FOR ALL TO authenticated USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- 5. ÍNDICES DE RENDIMIENTO (OPTIMIZACIÓN RLS Y BÚSQUEDAS)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_access_permissions_lookup ON public.access_permissions (patient_id, doctor_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient ON public.patient_vitals (patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_background_patient ON public.medical_background (patient_id);
CREATE INDEX IF NOT EXISTS idx_health_records_patient ON public.health_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON public.medications (patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON public.notifications (sender_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_collision ON public.appointments (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_access_permissions_patient_doctor ON public.access_permissions (patient_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_sucursal_doctor ON public.doctor_sucursal (doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_sucursal_sucursal ON public.doctor_sucursal (sucursal_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor ON public.doctor_schedules (doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_sucursal ON public.doctor_schedules (sucursal_id);


-- -----------------------------------------------------------------------------
-- 6. DATOS SEMILLA PARA PRUEBAS (HOSPITAL, SUCURSALES Y CUENTAS DE PRUEBA)
-- -----------------------------------------------------------------------------

-- 6.1. Insertar Hospital de Prueba
INSERT INTO public.hospitals (id, name, logo_url)
VALUES ('a0000000-0000-0000-0000-000000000000', 'Hospital Obrero N° 1', '/logo.png')
ON CONFLICT (name) DO NOTHING;

-- 6.2. Insertar Sucursales
INSERT INTO public.sucursales (id, name, address, coordinates, hospital_id)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'Sede Central - Miraflores', 'Av. Saavedra, La Paz', '-16.5020,-68.1215', 'a0000000-0000-0000-0000-000000000000'),
  ('b0000000-0000-0000-0000-000000000002', 'Sede Sur - Calacoto', 'Calle 15 de Calacoto, La Paz', '-16.5410,-68.0820', 'a0000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Garantizar asociación del hospital de prueba a las sucursales
UPDATE public.sucursales SET hospital_id = 'a0000000-0000-0000-0000-000000000000' WHERE hospital_id IS NULL;

-- 6.3. Insertar Especialidades de Prueba
INSERT INTO public.specialties (name, description)
VALUES 
  ('Medicina General', 'Atención médica primaria y preventiva'),
  ('Cardiología', 'Diagnóstico y tratamiento de enfermedades del corazón'),
  ('Pediatría', 'Atención médica para bebés, niños y adolescentes')
ON CONFLICT (name) DO NOTHING;

-- 6.4. Reparar posibles NULOS en auth.users (causa del error "Database error querying schema")
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

-- 6.5. Crear Usuario Administrador de Prueba
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

-- 6.6. Crear Usuario Secretaria de Prueba
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
        
        -- Asignar la secretaria a la Sede Central de Miraflores
        INSERT INTO public.secretaria_sucursal (secretaria_id, sucursal_id)
        VALUES (sec_id, sucursal_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 6.7. Asociar Médicos Existentes al Hospital Obrero y a la Sede Central
UPDATE public.profiles SET hospital_id = 'a0000000-0000-0000-0000-000000000000' WHERE role = 'medico';

INSERT INTO public.doctor_sucursal (doctor_id, sucursal_id)
SELECT id, 'b0000000-0000-0000-0000-000000000001'
FROM public.profiles
WHERE role = 'medico'
ON CONFLICT DO NOTHING;

-- Auto-confirmar cualquier correo que no haya sido confirmado para evitar el error "email_not_confirmed"
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
