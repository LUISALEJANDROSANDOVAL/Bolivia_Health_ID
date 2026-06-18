-- ==========================================
-- POLÍTICAS DE SEGURIDAD DE FILA (RLS)
-- Bolivia Health ID - Supabase Database
-- ==========================================

-- Habilitar RLS en las tablas principales
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_background ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 1. Políticas para la tabla PROFILES
-- ==========================================

-- Permitir lectura pública de perfiles a usuarios autenticados (necesario para búsquedas de doctores/pacientes)
CREATE POLICY select_profiles_auth ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir a cada usuario actualizar únicamente su propio perfil
CREATE POLICY update_own_profile ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. Políticas para la tabla ACCESS_PERMISSIONS
-- ==========================================

-- Permitir a pacientes y doctores ver permisos en los que participan
CREATE POLICY select_involved_permissions ON public.access_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Permitir a doctores insertar solicitudes de permisos (estado inicial 'pending')
CREATE POLICY insert_doctor_permission_request ON public.access_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

-- Permitir a pacientes actualizar el estado de sus permisos (aprobar, revocar, etc.)
CREATE POLICY update_patient_permission ON public.access_permissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ==========================================
-- 3. Políticas para la tabla PATIENT_VITALS
-- ==========================================

-- Permitir al paciente ver sus propios signos vitales
CREATE POLICY select_own_vitals ON public.patient_vitals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Permitir a médicos con permiso activo ver los signos vitales del paciente
CREATE POLICY select_permitted_vitals ON public.patient_vitals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = patient_vitals.patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  );

-- Permitir a médicos con permiso activo insertar/actualizar signos vitales del paciente
CREATE POLICY insert_permitted_vitals ON public.patient_vitals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  );

CREATE POLICY update_permitted_vitals ON public.patient_vitals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = patient_vitals.patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = patient_vitals.patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  );

-- ==========================================
-- 4. Políticas para la tabla MEDICAL_BACKGROUND
-- ==========================================

-- Permitir al paciente ver su propio historial/antecedente médico
CREATE POLICY select_own_medical_background ON public.medical_background
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Permitir a médicos con permiso activo ver el historial del paciente
CREATE POLICY select_permitted_medical_background ON public.medical_background
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = medical_background.patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  );

-- Permitir a médicos con permiso activo registrar una consulta/antecedente
CREATE POLICY insert_permitted_medical_background ON public.medical_background
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  );

-- ==========================================
-- 5. Políticas para la tabla HEALTH_RECORDS
-- ==========================================

-- Permitir al paciente ver sus propios documentos/estudios
CREATE POLICY select_own_health_records ON public.health_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Permitir a médicos con permiso activo ver los estudios del paciente
CREATE POLICY select_permitted_health_records ON public.health_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = health_records.patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  );

-- Permitir a médicos con permiso activo subir un estudio al historial del paciente
CREATE POLICY insert_permitted_health_records ON public.health_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  );

-- ==========================================
-- 6. Políticas para la tabla MEDICATIONS
-- ==========================================

-- Permitir al paciente ver sus propias recetas/medicamentos
CREATE POLICY select_own_medications ON public.medications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Permitir a médicos con permiso activo ver las recetas del paciente
CREATE POLICY select_permitted_medications ON public.medications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = medications.patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  );

-- Permitir a médicos con permiso activo prescribir medicamentos
CREATE POLICY insert_permitted_medications ON public.medications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.access_permissions
      WHERE access_permissions.patient_id = patient_id
        AND access_permissions.doctor_id = auth.uid()
        AND access_permissions.status = 'active'
    )
  );

-- ==========================================
-- 7. Políticas para la tabla APPOINTMENTS
-- ==========================================

-- Permitir a pacientes y doctores ver citas en las que participan
CREATE POLICY select_involved_appointments ON public.appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Permitir a pacientes o médicos crear citas
CREATE POLICY insert_appointment ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Permitir a pacientes o médicos actualizar citas en las que participan
CREATE POLICY update_involved_appointment ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- ==========================================
-- 8. Políticas para la tabla NOTIFICATIONS
-- ==========================================

-- Permitir a los usuarios ver únicamente sus propias notificaciones
CREATE POLICY select_own_notifications ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Permitir a cualquier usuario autenticado crear notificaciones para otros
CREATE POLICY insert_notification ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir a los usuarios marcar como leídas sus notificaciones
CREATE POLICY update_own_notification ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
