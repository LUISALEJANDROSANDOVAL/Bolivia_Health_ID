-- =============================================================================
-- BOLIVIA HEALTH ID — AJUSTE DE RLS PARA PERMITIR AUTOCARGA DEL PACIENTE (AI UPLOAD)
-- =============================================================================
-- Por defecto, las políticas RLS originales de 'medical_background' y 'medications'
-- solo permitían que un médico autorizado inserte registros de salud. 
--
-- Si un paciente intenta subir sus propios archivos clínicos anteriores (como recetas o
-- informes de laboratorio en formato PDF/imagen) y la IA de Gemini extrae los datos,
-- la inserción falla en Supabase con un error de violación de RLS por falta de un 'doctor_id'
-- de sesión válido.
--
-- Ejecuta este script en el Editor de SQL de tu consola de Supabase para permitir
-- que tanto los pacientes dueños de la cuenta como los médicos autorizados
-- puedan insertar registros en estas tablas.
-- =============================================================================

-- 1. Actualizar políticas de inserción para la tabla: MEDICAL_BACKGROUND
DROP POLICY IF EXISTS insert_permitted_medical_background ON public.medical_background;

CREATE POLICY insert_permitted_medical_background ON public.medical_background
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = patient_id -- El paciente dueño de la cuenta puede subir sus datos
    OR (
      public.get_profile_id() = doctor_id -- O un médico con acceso autorizado activo
      AND EXISTS (
        SELECT 1 FROM public.access_permissions ap
        WHERE ap.patient_id = medical_background.patient_id
          AND ap.doctor_id = public.get_profile_id()
          AND ap.status = 'active'
          AND (ap.expires_at IS NULL OR ap.expires_at > now())
      )
    )
  );

-- 2. Actualizar políticas de inserción para la tabla: MEDICATIONS
DROP POLICY IF EXISTS insert_permitted_medications ON public.medications;

CREATE POLICY insert_permitted_medications ON public.medications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_profile_id() = patient_id -- El paciente dueño de la cuenta puede subir sus medicamentos
    OR (
      public.get_profile_id() = doctor_id -- O un médico con acceso autorizado activo
      AND EXISTS (
        SELECT 1 FROM public.access_permissions ap
        WHERE ap.patient_id = medications.patient_id
          AND ap.doctor_id = public.get_profile_id()
          AND ap.status = 'active'
          AND (ap.expires_at IS NULL OR ap.expires_at > now())
      )
    )
  );
