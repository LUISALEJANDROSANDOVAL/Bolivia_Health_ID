-- =============================================================================
-- BOLIVIA HEALTH ID — ACTUALIZACIÓN DE FLUJO DE ACCESO POR ESPECIALIDAD
-- =============================================================================

-- 1. Modificación de la tabla access_permissions
ALTER TABLE public.access_permissions ALTER COLUMN doctor_id DROP NOT NULL;

ALTER TABLE public.access_permissions ADD COLUMN specialty text REFERENCES public.specialties(name);
ALTER TABLE public.access_permissions ADD COLUMN sucursal_id uuid REFERENCES public.sucursales(id);
ALTER TABLE public.access_permissions ADD COLUMN requested_by uuid REFERENCES public.profiles(id);

-- Restricción para asegurar consistencia del tipo de permiso
ALTER TABLE public.access_permissions ADD CONSTRAINT check_permission_type 
  CHECK (
    (doctor_id IS NOT NULL AND specialty IS NULL AND sucursal_id IS NULL) OR
    (doctor_id IS NULL AND specialty IS NOT NULL AND sucursal_id IS NOT NULL)
  );

-- =============================================================================
-- 2. Función Helper Centralizada para Verificación de Permisos RLS
-- =============================================================================
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

-- =============================================================================
-- 3. Actualización de Políticas de Seguridad (RLS)
-- =============================================================================

-- 3.1 Tabla: patient_vitals
DROP POLICY IF EXISTS select_permitted_vitals ON public.patient_vitals;
CREATE POLICY select_permitted_vitals ON public.patient_vitals
  FOR SELECT TO authenticated
  USING (public.has_active_permission(patient_id));

DROP POLICY IF EXISTS insert_permitted_vitals ON public.patient_vitals;
CREATE POLICY insert_permitted_vitals ON public.patient_vitals
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = patient_id
    OR public.has_active_permission(patient_id)
  );

DROP POLICY IF EXISTS update_permitted_vitals ON public.patient_vitals;
CREATE POLICY update_permitted_vitals ON public.patient_vitals
  FOR UPDATE TO authenticated
  USING (public.has_active_permission(patient_id));

-- 3.2 Tabla: medical_background
DROP POLICY IF EXISTS select_permitted_medical_background ON public.medical_background;
CREATE POLICY select_permitted_medical_background ON public.medical_background
  FOR SELECT TO authenticated
  USING (public.has_active_permission(patient_id));

DROP POLICY IF EXISTS insert_permitted_medical_background ON public.medical_background;
CREATE POLICY insert_permitted_medical_background ON public.medical_background
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = doctor_id
    AND public.has_active_permission(patient_id)
  );

-- 3.3 Tabla: health_records
DROP POLICY IF EXISTS select_permitted_health_records ON public.health_records;
CREATE POLICY select_permitted_health_records ON public.health_records
  FOR SELECT TO authenticated
  USING (public.has_active_permission(patient_id));

DROP POLICY IF EXISTS insert_permitted_health_records ON public.health_records;
CREATE POLICY insert_permitted_health_records ON public.health_records
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.get_profile_id() = doctor_id OR public.get_profile_id() = patient_id)
    AND (
      public.get_profile_id() = patient_id
      OR public.has_active_permission(patient_id)
    )
  );

-- 3.4 Tabla: medications
DROP POLICY IF EXISTS select_permitted_medications ON public.medications;
CREATE POLICY select_permitted_medications ON public.medications
  FOR SELECT TO authenticated
  USING (public.has_active_permission(patient_id));

DROP POLICY IF EXISTS insert_permitted_medications ON public.medications;
CREATE POLICY insert_permitted_medications ON public.medications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = doctor_id
    AND public.has_active_permission(patient_id)
  );

-- 3.5 Tabla: appointments
DROP POLICY IF EXISTS insert_appointment ON public.appointments;
CREATE POLICY insert_appointment ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
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

-- 3.6 Tabla: access_permissions (Inserción y Lectura de Solicitudes)
DROP POLICY IF EXISTS insert_doctor_permission_request ON public.access_permissions;
CREATE POLICY insert_permission_request ON public.access_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = public.get_profile_id()) = 'medico'
    AND status = 'pending'
    AND public.get_profile_id() = requested_by
  );

DROP POLICY IF EXISTS select_involved_permissions ON public.access_permissions;
CREATE POLICY select_involved_permissions ON public.access_permissions
  FOR SELECT TO authenticated
  USING (
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
