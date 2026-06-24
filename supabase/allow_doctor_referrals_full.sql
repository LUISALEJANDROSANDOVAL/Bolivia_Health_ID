-- 1. Crear la función helper que falta en tu base de datos para verificar permisos activos
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

-- 2. Actualizar la política para permitir la derivación automática
DROP POLICY IF EXISTS insert_permission_request ON public.access_permissions;

CREATE POLICY insert_permission_request ON public.access_permissions
    FOR INSERT WITH CHECK (
      -- Un paciente puede insertar sus propios permisos
      patient_id = public.get_profile_id()
      OR
      -- Un médico puede solicitar permisos (pending) 
      -- O puede derivar (active) si ya tiene permiso activo sobre el paciente
      (
        requested_by = public.get_profile_id()
        AND (
          status = 'pending'
          OR (status = 'active' AND public.has_active_permission(patient_id))
        )
      )
    );
