-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.access_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'expired'::text, 'revoked'::text])),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT access_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT access_permissions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id),
  CONSTRAINT access_permissions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  doctor_id uuid,
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
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id),
  CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.diagnosis_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  category text,
  is_chronic boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT diagnosis_catalog_pkey PRIMARY KEY (id)
);
CREATE TABLE public.health_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  title text NOT NULL,
  category text CHECK (category = ANY (ARRAY['Laboratorio'::text, 'Imágenes'::text, 'Recetas'::text, 'Otros'::text])),
  file_size text,
  file_url text NOT NULL,
  file_type text,
  created_at timestamp with time zone DEFAULT now(),
  tx_hash text CHECK (tx_hash IS NULL OR tx_hash ~ '^0x[0-9a-fA-F]{64}$'::text),
  doctor_id uuid,
  CONSTRAINT health_records_pkey PRIMARY KEY (id),
  CONSTRAINT health_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id),
  CONSTRAINT health_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.medical_background (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  title text NOT NULL,
  description text,
  category text CHECK (category = ANY (ARRAY['consulta'::text, 'vaccine'::text, 'surgery'::text])),
  status_detail text,
  date_recorded date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  doctor_id uuid,
  diagnosis_id uuid,
  CONSTRAINT medical_background_pkey PRIMARY KEY (id),
  CONSTRAINT medical_background_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id),
  CONSTRAINT medical_background_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id),
  CONSTRAINT medical_background_diagnosis_fkey FOREIGN KEY (diagnosis_id) REFERENCES public.diagnosis_catalog(id)
);
CREATE TABLE public.medications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  name text NOT NULL,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'suspended'::text])),
  created_at timestamp with time zone DEFAULT now(),
  doctor_id uuid,
  medicine_id uuid,
  diagnosis_id uuid,
  CONSTRAINT medications_pkey PRIMARY KEY (id),
  CONSTRAINT medications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id),
  CONSTRAINT medications_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id),
  CONSTRAINT medications_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicine_catalog(id),
  CONSTRAINT medications_diagnosis_fkey FOREIGN KEY (diagnosis_id) REFERENCES public.diagnosis_catalog(id)
);
CREATE TABLE public.medicine_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  generic_name text NOT NULL,
  brand_name text,
  form text,
  item_number text,
  concentration text,
  CONSTRAINT medicine_catalog_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  sender_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['request'::text, 'approval'::text, 'prescription'::text, 'alert'::text, 'info'::text])),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.patient_vitals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  blood_type text,
  allergies text,
  blood_pressure text,
  weight text,
  height text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  heart_rate text,
  temperature text,
  CONSTRAINT patient_vitals_pkey PRIMARY KEY (id),
  CONSTRAINT patient_vitals_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL UNIQUE,
  full_name text NOT NULL,
  cedula_identidad text UNIQUE,
  email text,
  phone text,
  address text,
  occupation text,
  role text DEFAULT 'paciente'::text CHECK (role = ANY (ARRAY['paciente'::text, 'medico'::text])),
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
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.sucursales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  coordinates text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sucursales_pkey PRIMARY KEY (id)
);

CREATE TABLE public.doctor_sucursal (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  sucursal_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctor_sucursal_pkey PRIMARY KEY (id),
  CONSTRAINT doctor_sucursal_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id),
  CONSTRAINT doctor_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id)
);

CREATE TABLE public.doctor_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  sucursal_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL CHECK (end_time > start_time),
  slot_duration_minutes integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT doctor_schedules_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id),
  CONSTRAINT doctor_schedules_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id)
);

-- Función para generar las "píldoras de hora" (slots disponibles)
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
    -- En PostgreSQL, extract(isodow from date) devuelve 1=Lunes, 7=Domingo
    v_day_of_week := extract(isodow from p_date);

    -- Obtener el horario del doctor para ese día en esa sucursal
    SELECT * INTO v_schedule
    FROM public.doctor_schedules
    WHERE doctor_id = p_doctor_id
      AND sucursal_id = p_sucursal_id
      AND day_of_week = v_day_of_week
      AND is_active = true
    LIMIT 1;

    -- Si no hay horario activo para ese día, no retornar nada
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
          -- Verificamos si hay superposición con una cita existente
          AND (s.slot_time < COALESCE(a.end_time, a.appointment_time + (v_schedule.slot_duration_minutes || ' minutes')::interval)
               AND 
               (s.slot_time + (v_schedule.slot_duration_minutes || ' minutes')::interval) > a.appointment_time)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
