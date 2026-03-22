-- ===================================================================================
-- BOLIVIA HEALTH ID - ESQUEMA DE BASE DE DATOS SUPABASE
-- Este esquema cubre TODAS las vistas del frontend del proyecto descentralizado.
-- ===================================================================================

-- 1. Usuarios y Perfil (Vista: Configuración / Perfil y Base de Usuarios)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  cedula_identidad TEXT UNIQUE,
  email TEXT,              -- Nuevo: Para Configuración
  phone TEXT,              -- Nuevo: Para Configuración
  address TEXT,            -- Nuevo: Para Configuración
  occupation TEXT,         -- Nuevo: Para Configuración
  role TEXT CHECK (role IN ('paciente', 'medico')) DEFAULT 'paciente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Vitales del Paciente (Vistas: Dashboard -> Resumen de Salud y Configuración -> Datos Médicos)
CREATE TABLE patient_vitals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  blood_type TEXT,         -- Ej: 'O+'
  allergies TEXT,          -- Ej: 'Polen, Penicilina'
  blood_pressure TEXT,     -- Ej: '120/80'
  weight TEXT,             -- Ej: '75'
  height TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Historial Médico / Antecedentes (Vista: Historial Médico -> Consultas, Cirugías, Vacunas)
CREATE TABLE medical_background (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('consulta', 'vaccine', 'surgery')),
  status_detail TEXT,      -- Ej: 'Completa', 'Pendiente'
  date_recorded DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Documentos y Exámenes IPFS (Vistas: Mis Registros Médicos y Subir Archivos)
CREATE TABLE health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('Laboratorio', 'Imágenes', 'Recetas', 'Otros')),
  file_size TEXT,          -- Ej: '2.4 MB'
  file_url TEXT NOT NULL,  -- Hash o CID de IPFS/Lighthouse
  file_type TEXT,          -- Ej: 'pdf', 'png'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tratamientos (Vista: Medicamentos -> Activos e Historial)
CREATE TABLE medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,      -- Ej: 'Metformina'
  dosage TEXT,             -- Ej: '500mg'
  frequency TEXT,          -- Ej: 'Cada 8 horas'
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('active', 'completed', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Permisos de Acceso / Motor QR (Vista: Gestión de Permisos)
CREATE TABLE access_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired', 'revoked')) DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Próximas Citas (Vista: Dashboard -> Próximas Citas)
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id),
  doctor_name TEXT,        -- Opcional: Nombre directo si no hay ID (Ejem: 'Dra. Ana López')
  specialty TEXT,          -- Ej: 'Cardiología'
  appointment_date DATE,   -- Ej: '2026-03-25'
  appointment_time TIME,   -- Ej: '10:30'
  location TEXT,           -- Ej: 'Clínica del Sur' o 'Virtual'
  type TEXT CHECK (type IN ('presencial', 'virtual')),
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TRIGGER: Expiración automática de Permiso (30 min por defecto)
-- ==========================================
CREATE OR REPLACE FUNCTION set_expiracion_permiso()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + interval '30 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_expiracion_permiso
BEFORE INSERT ON access_permissions
FOR EACH ROW EXECUTE FUNCTION set_expiracion_permiso();