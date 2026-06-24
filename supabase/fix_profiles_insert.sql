-- =============================================================================
-- BOLIVIA HEALTH ID — FIX PARA INSERTAR PERFILES NUEVOS
-- =============================================================================
-- Instrucciones: Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- Propósito: Permitir a los usuarios autenticados (pacientes nuevos) crear su 
-- propio perfil. Sin esta política, el upsert fallará con un error RLS.

CREATE POLICY insert_own_profile ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    LOWER(wallet_address) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1))
  );
