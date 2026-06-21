-- =============================================================================
-- BOLIVIA HEALTH ID — SEGURIDAD DE FILA (RLS) E INTEGRACIÓN WEB3
-- =============================================================================
-- Tu software utiliza billeteras Web3 (MetaMask/Google social logins) y se conecta 
-- a Supabase como cliente Anónimo ('anon') hasta que inicia sesión de forma
-- silenciosa en 'supabase.auth' al conectar la wallet.
--
-- Esta configuración asegura que las políticas de RLS de abajo funcionen
-- mapeando el JWT del usuario autenticado en Supabase Auth a su registro de perfil.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. HABILITAR SEGURIDAD DE FILA (RLS) EN LAS TABLAS PRINCIPALES
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
-- -----------------------------------------------------------------------------
-- FUNCIÓN HELPER PARA MAPEAR SESIÓN WEB3 A PERFIL SUPABASE
-- -----------------------------------------------------------------------------
-- Esta función extrae la dirección de la billetera del JWT de Supabase Auth
-- (provisto silenciosamente por el frontend) y obtiene el ID correspondiente de profiles.
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles 
  WHERE LOWER(wallet_address) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1));
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- =============================================================================
-- 1. POLÍTICAS PARA LA TABLA: PROFILES
-- =============================================================================

-- Cada usuario solo puede leer su propio perfil completo
CREATE POLICY select_own_profile ON public.profiles
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = id);

-- Permitir a cada usuario actualizar únicamente su propio perfil
CREATE POLICY update_own_profile ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.get_profile_id() = id)
  WITH CHECK (public.get_profile_id() = id);


-- =============================================================================
-- VISTA PÚBLICA DE PERFILES (para búsquedas cruzadas sin exponer datos sensibles)
-- =============================================================================
-- Expone únicamente los campos no sensibles necesarios para que pacientes
-- puedan buscar médicos y viceversa. NUNCA incluye password_hash, cedula_identidad,
-- birth_date, phone ni address.
CREATE OR REPLACE VIEW public.profiles_public AS
  SELECT
    id,
    full_name,
    specialty,
    role,
    license_number,
    approval_status,
    wallet_address
  FROM public.profiles;

-- Asegurar que la vista sea accesible por usuarios autenticados
GRANT SELECT ON public.profiles_public TO authenticated;


-- =============================================================================
-- 2. POLÍTICAS PARA LA TABLA: ACCESS_PERMISSIONS
-- =============================================================================

-- Permitir a pacientes y doctores ver permisos en los que participan directamente
CREATE POLICY select_involved_permissions ON public.access_permissions
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = patient_id OR public.get_profile_id() = doctor_id);

-- El INSERT fuerza status='pending'. Solo el paciente puede cambiar a 'active'.
CREATE POLICY insert_doctor_permission_request ON public.access_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = doctor_id
    AND status = 'pending'
  );

-- Permitir a pacientes aprobar, revocar o modificar el estado de sus permisos
CREATE POLICY update_patient_permission ON public.access_permissions
  FOR UPDATE TO authenticated
  USING (public.get_profile_id() = patient_id)
  WITH CHECK (public.get_profile_id() = patient_id);

-- Permitir a pacientes eliminar permisos (revocación total)
CREATE POLICY delete_patient_permission ON public.access_permissions
  FOR DELETE TO authenticated
  USING (public.get_profile_id() = patient_id);


-- =============================================================================
-- 3. POLÍTICAS PARA LA TABLA: PATIENT_VITALS
-- =============================================================================

-- Permitir al paciente ver sus propios signos vitales
CREATE POLICY select_own_vitals ON public.patient_vitals
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = patient_id);

-- Permitir a médicos con permiso activo y no expirado ver los signos vitales
CREATE POLICY select_permitted_vitals ON public.patient_vitals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions ap
      WHERE ap.patient_id = patient_vitals.patient_id
        AND ap.doctor_id = public.get_profile_id()
        AND ap.status = 'active'
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
    )
  );

-- Permitir al paciente o a médicos con permiso activo registrar signos vitales
CREATE POLICY insert_permitted_vitals ON public.patient_vitals
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = patient_id
    OR EXISTS (
      SELECT 1 FROM public.access_permissions ap
      WHERE ap.patient_id = patient_vitals.patient_id
        AND ap.doctor_id = public.get_profile_id()
        AND ap.status = 'active'
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
    )
  );

-- Permitir a médicos con permiso activo y no expirado actualizar signos vitales
CREATE POLICY update_permitted_vitals ON public.patient_vitals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions ap
      WHERE ap.patient_id = patient_vitals.patient_id
        AND ap.doctor_id = public.get_profile_id()
        AND ap.status = 'active'
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
    )
  );


-- =============================================================================
-- 4. POLÍTICAS PARA LA TABLA: MEDICAL_BACKGROUND
-- =============================================================================

-- Permitir al paciente ver sus propios antecedentes clínicos
CREATE POLICY select_own_medical_background ON public.medical_background
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = patient_id);

-- Permitir a médicos con permiso activo ver el historial del paciente
CREATE POLICY select_permitted_medical_background ON public.medical_background
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions ap
      WHERE ap.patient_id = medical_background.patient_id
        AND ap.doctor_id = public.get_profile_id()
        AND ap.status = 'active'
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
    )
  );

-- Permitir a médicos ver las consultas que ellos mismos crearon/emitieron
CREATE POLICY select_own_created_medical_background ON public.medical_background
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = doctor_id);

-- Se fuerza doctor_id = public.get_profile_id() y se usa referencia explícita de tabla
CREATE POLICY insert_permitted_medical_background ON public.medical_background
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = doctor_id
    AND EXISTS (
      SELECT 1 FROM public.access_permissions ap
      WHERE ap.patient_id = medical_background.patient_id
        AND ap.doctor_id = public.get_profile_id()
        AND ap.status = 'active'
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
    )
  );


-- =============================================================================
-- 5. POLÍTICAS PARA LA TABLA: HEALTH_RECORDS
-- =============================================================================

-- Permitir al paciente ver sus propios documentos y hashes de blockchain
CREATE POLICY select_own_health_records ON public.health_records
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = patient_id);

-- Permitir a médicos con permiso activo ver archivos de salud del paciente
CREATE POLICY select_permitted_health_records ON public.health_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions ap
      WHERE ap.patient_id = health_records.patient_id
        AND ap.doctor_id = public.get_profile_id()
        AND ap.status = 'active'
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
    )
  );

-- Se fuerza doctor_id = public.get_profile_id() (o el paciente sube por sí mismo)
CREATE POLICY insert_permitted_health_records ON public.health_records
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.get_profile_id() = doctor_id OR public.get_profile_id() = patient_id)
    AND (
      public.get_profile_id() = patient_id -- Paciente siempre puede subir a su cuenta
      OR EXISTS (
        SELECT 1 FROM public.access_permissions ap
        WHERE ap.patient_id = health_records.patient_id
          AND ap.doctor_id = public.get_profile_id()
          AND ap.status = 'active'
          AND (ap.expires_at IS NULL OR ap.expires_at > now())
      )
    )
  );


-- =============================================================================
-- 6. POLÍTICAS PARA LA TABLA: MEDICATIONS
-- =============================================================================

-- Permitir al paciente ver sus propias recetas y planes de medicación
CREATE POLICY select_own_medications ON public.medications
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = patient_id);

-- Permitir a médicos con permiso activo ver el tratamiento farmacológico del paciente
CREATE POLICY select_permitted_medications ON public.medications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions ap
      WHERE ap.patient_id = medications.patient_id
        AND ap.doctor_id = public.get_profile_id()
        AND ap.status = 'active'
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
    )
  );

-- Permitir a médicos ver las recetas/medicamentos que ellos mismos crearon/emitieron
CREATE POLICY select_own_created_medications ON public.medications
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = doctor_id);

-- Se fuerza doctor_id = public.get_profile_id() y referencia explícita de tabla
CREATE POLICY insert_permitted_medications ON public.medications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = doctor_id
    AND EXISTS (
      SELECT 1 FROM public.access_permissions ap
      WHERE ap.patient_id = medications.patient_id
        AND ap.doctor_id = public.get_profile_id()
        AND ap.status = 'active'
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
    )
  );


-- =============================================================================
-- 7. POLÍTICAS PARA LA TABLA: APPOINTMENTS
-- =============================================================================

-- Permitir a pacientes y doctores ver citas en las que participan
CREATE POLICY select_involved_appointments ON public.appointments
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = patient_id OR public.get_profile_id() = doctor_id);

-- Si el creador es médico, debe tener un permiso activo o pendiente.
CREATE POLICY insert_appointment ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = patient_id
    OR (
      public.get_profile_id() = doctor_id
      AND EXISTS (
        SELECT 1 FROM public.access_permissions ap
        WHERE ap.patient_id = appointments.patient_id
          AND ap.doctor_id = public.get_profile_id()
          AND ap.status IN ('active', 'pending')
      )
    )
  );

-- Permitir modificar estados o detalles de citas a ambas partes involucradas
CREATE POLICY update_involved_appointment ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.get_profile_id() = patient_id OR public.get_profile_id() = doctor_id);

-- Permitir cancelar (eliminar) citas a ambas partes
CREATE POLICY delete_involved_appointment ON public.appointments
  FOR DELETE TO authenticated
  USING (public.get_profile_id() = patient_id OR public.get_profile_id() = doctor_id);


-- =============================================================================
-- 8. POLÍTICAS PARA LA TABLA: NOTIFICATIONS
-- =============================================================================

-- Permitir a los usuarios ver únicamente sus propias notificaciones
CREATE POLICY select_own_notifications ON public.notifications
  FOR SELECT TO authenticated
  USING (public.get_profile_id() = user_id);

-- El remitente (sender_id = public.get_profile_id()) debe tener una relación legítima
CREATE POLICY insert_notification ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = sender_id
    AND (
      public.get_profile_id() = user_id
      OR
      EXISTS (
        SELECT 1 FROM public.access_permissions ap
        WHERE (
          (ap.doctor_id = public.get_profile_id() AND ap.patient_id = notifications.user_id)
          OR
          (ap.patient_id = public.get_profile_id() AND ap.doctor_id = notifications.user_id)
        )
        AND ap.status IN ('active', 'pending')
      )
      OR
      EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE (
          (a.doctor_id = public.get_profile_id() AND a.patient_id = notifications.user_id)
          OR
          (a.patient_id = public.get_profile_id() AND a.doctor_id = notifications.user_id)
        )
      )
    )
  );

-- Permitir marcar como leídas las notificaciones propias
CREATE POLICY update_own_notification ON public.notifications
  FOR UPDATE TO authenticated
  USING (public.get_profile_id() = user_id)
  WITH CHECK (public.get_profile_id() = user_id);

-- Permitir al usuario borrar sus propias notificaciones
CREATE POLICY delete_own_notification ON public.notifications
  FOR DELETE TO authenticated
  USING (public.get_profile_id() = user_id);


-- =============================================================================
-- ÍNDICES DE RENDIMIENTO PARA OPTIMIZACIÓN DE RLS
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_access_permissions_lookup
  ON public.access_permissions (patient_id, doctor_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient
  ON public.patient_vitals (patient_id);

CREATE INDEX IF NOT EXISTS idx_medical_background_patient
  ON public.medical_background (patient_id);

CREATE INDEX IF NOT EXISTS idx_health_records_patient
  ON public.health_records (patient_id);

CREATE INDEX IF NOT EXISTS idx_medications_patient
  ON public.medications (patient_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_sender
  ON public.notifications (sender_id);

CREATE INDEX IF NOT EXISTS idx_appointments_patient
  ON public.appointments (patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor
  ON public.appointments (doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointments_collision
  ON public.appointments (doctor_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_access_permissions_patient_doctor
  ON public.access_permissions (patient_id, doctor_id);
-- =============================================================================
-- POLÍTICAS PARA SUCURSALES Y DOCTOR_SUCURSAL
-- =============================================================================

CREATE POLICY select_sucursales ON public.sucursales
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY select_doctor_sucursal ON public.doctor_sucursal
  FOR SELECT TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_doctor_sucursal_doctor
  ON public.doctor_sucursal (doctor_id);

CREATE INDEX IF NOT EXISTS idx_doctor_sucursal_sucursal
  ON public.doctor_sucursal (sucursal_id);

CREATE POLICY select_doctor_schedules ON public.doctor_schedules
  FOR SELECT TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor
  ON public.doctor_schedules (doctor_id);

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_sucursal
  ON public.doctor_schedules (sucursal_id);

-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================