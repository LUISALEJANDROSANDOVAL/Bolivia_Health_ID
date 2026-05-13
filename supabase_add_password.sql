-- Migration: Add password_hash to profiles
-- Ejecuta esto en el SQL Editor de Supabase para añadir el campo de contraseña

begin;

alter table if exists public.profiles
  add column if not exists password_hash text;

commit;
