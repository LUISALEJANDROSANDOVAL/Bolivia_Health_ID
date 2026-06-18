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
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);