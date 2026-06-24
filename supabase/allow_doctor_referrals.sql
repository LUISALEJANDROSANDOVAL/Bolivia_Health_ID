-- Permite a un médico derivar (otorgar acceso 'active') si él mismo ya tiene acceso al paciente
DROP POLICY IF EXISTS insert_permission_request ON public.access_permissions;

CREATE POLICY insert_permission_request ON public.access_permissions
    FOR INSERT WITH CHECK (
      -- 1. Un paciente puede insertar sus propios permisos
      patient_id = public.get_profile_id()
      OR
      -- 2. Un médico puede solicitar permisos (pending) 
      -- 3. O puede derivar (active) si ya tiene permiso activo sobre el paciente
      (
        requested_by = public.get_profile_id()
        AND (
          status = 'pending'
          OR (status = 'active' AND public.has_active_permission(patient_id))
        )
      )
    );
