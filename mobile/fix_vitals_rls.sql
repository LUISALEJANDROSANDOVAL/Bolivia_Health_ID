-- Permitir la inserción de nuevos registros clínicos (Vitals) para los pacientes
DROP POLICY IF EXISTS "Permitir insercion de vitals" ON public.patient_vitals;

CREATE POLICY "Permitir insercion de vitals"
ON public.patient_vitals
FOR INSERT
TO authenticated
WITH CHECK (true);
