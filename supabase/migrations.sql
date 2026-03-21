-- 1. Usuarios y Perfil (Cabecera de tu interfaz)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  cedula_identidad TEXT UNIQUE,
  fecha_nacimiento DATE,
  tipo_sangre TEXT, -- Ej: 'ORH+'
  role TEXT CHECK (role IN ('paciente', 'medico')) DEFAULT 'paciente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Alergias (Cuadro superior derecho)
CREATE TABLE alergias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nombre_alergia TEXT NOT NULL,
  severidad TEXT, -- 'Alta', 'Media', 'Baja'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Medicamentos Actuales (Sección central)
CREATE TABLE medicamentos_actuales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nombre_medicamento TEXT NOT NULL,
  dosis TEXT,       -- Ej: '500mg'
  frecuencia TEXT,  -- Ej: 'Cada 12 horas'
  activo BOOLEAN DEFAULT true
);

-- 4. Historial de Visitas (Lista inferior)
CREATE TABLE visitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  medico_id UUID REFERENCES profiles(id),
  fecha_visita TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  motivo_consulta TEXT,
  diagnostico TEXT
);

-- 5. Documentos IPFS (Resultados y Radiografías)
CREATE TABLE documentos_ipfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT,
  ipfs_cid TEXT NOT NULL, -- El hash de Lighthouse
  blockchain_tx TEXT      -- Transacción en Polygon/Scroll
);

-- 6. Permisos de Acceso (Motor del QR)
CREATE TABLE permisos_acceso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID REFERENCES profiles(id) NOT NULL,
  medico_id UUID REFERENCES profiles(id) NOT NULL,
  fecha_expiracion TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN DEFAULT true
);

-- 7. Notificaciones (Para avisar al paciente del acceso)
CREATE TABLE notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  mensaje TEXT,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TRIGGER: Expiración automática de QR (30 min)
-- ==========================================
CREATE OR REPLACE FUNCTION set_expiracion_qr()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_expiracion := NOW() + interval '30 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_expiracion_qr
BEFORE INSERT ON permisos_acceso
FOR EACH ROW EXECUTE FUNCTION set_expiracion_qr();