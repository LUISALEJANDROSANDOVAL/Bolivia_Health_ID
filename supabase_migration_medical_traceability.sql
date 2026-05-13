-- Migration: medical traceability and blockchain linkage
-- Run in Supabase SQL Editor.

begin;

-- 1) Doctors in profiles: professional license and specialty.
alter table if exists public.profiles
  add column if not exists license_number text,
  add column if not exists specialty text;

-- Useful uniqueness rule:
-- A professional license should not repeat among active doctor profiles.
create unique index if not exists profiles_doctor_license_unique_idx
  on public.profiles (license_number)
  where role = 'medico' and license_number is not null;

-- 2) Blockchain link in health records.
alter table if exists public.health_records
  add column if not exists tx_hash text;

create index if not exists health_records_tx_hash_idx
  on public.health_records (tx_hash);

-- Optional integrity rule for Avalanche tx hash format:
-- Must be 0x + 64 hex chars when present.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'health_records_tx_hash_format_chk'
  ) then
    alter table public.health_records
      add constraint health_records_tx_hash_format_chk
      check (
        tx_hash is null
        or tx_hash ~ '^0x[0-9a-fA-F]{64}$'
      );
  end if;
end $$;

-- 3) Doctor signature / traceability in clinical tables.
alter table if exists public.health_records
  add column if not exists doctor_id uuid;

alter table if exists public.medical_background
  add column if not exists doctor_id uuid;

alter table if exists public.medications
  add column if not exists doctor_id uuid;

-- Add FK constraints only if they don't already exist.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'health_records_doctor_id_fkey'
  ) then
    alter table public.health_records
      add constraint health_records_doctor_id_fkey
      foreign key (doctor_id) references public.profiles(id)
      on update cascade on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'medical_background_doctor_id_fkey'
  ) then
    alter table public.medical_background
      add constraint medical_background_doctor_id_fkey
      foreign key (doctor_id) references public.profiles(id)
      on update cascade on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'medications_doctor_id_fkey'
  ) then
    alter table public.medications
      add constraint medications_doctor_id_fkey
      foreign key (doctor_id) references public.profiles(id)
      on update cascade on delete set null;
  end if;
end $$;

create index if not exists health_records_doctor_id_idx
  on public.health_records (doctor_id);
create index if not exists medical_background_doctor_id_idx
  on public.medical_background (doctor_id);
create index if not exists medications_doctor_id_idx
  on public.medications (doctor_id);

-- Ensure doctor_id always belongs to a profile with role = 'medico'.
create or replace function public.validate_doctor_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.doctor_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = new.doctor_id
      and p.role = 'medico'
  ) then
    raise exception 'doctor_id % is not a medico profile', new.doctor_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_doctor_role_health_records on public.health_records;
create trigger trg_validate_doctor_role_health_records
before insert or update of doctor_id on public.health_records
for each row execute function public.validate_doctor_profile_role();

drop trigger if exists trg_validate_doctor_role_medical_background on public.medical_background;
create trigger trg_validate_doctor_role_medical_background
before insert or update of doctor_id on public.medical_background
for each row execute function public.validate_doctor_profile_role();

drop trigger if exists trg_validate_doctor_role_medications on public.medications;
create trigger trg_validate_doctor_role_medications
before insert or update of doctor_id on public.medications
for each row execute function public.validate_doctor_profile_role();

-- 4) Vitals history:
-- Remove UNIQUE(patient_id) if it exists so multiple time-series rows are allowed.
do $$
declare
  v_constraint_name text;
begin
  select c.conname
  into v_constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
  where n.nspname = 'public'
    and t.relname = 'patient_vitals'
    and c.contype = 'u'
    and array_length(c.conkey, 1) = 1
    and a.attname = 'patient_id'
  limit 1;

  if v_constraint_name is not null then
    execute format(
      'alter table public.patient_vitals drop constraint %I',
      v_constraint_name
    );
  end if;
end $$;

-- Create a time-series index for better chart queries.
-- If your table uses a different timestamp column, replace created_at.
create index if not exists patient_vitals_patient_created_at_idx
  on public.patient_vitals (patient_id, created_at desc);

commit;

-- Optional post-migration checks:
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('profiles', 'health_records', 'medical_background', 'medications', 'patient_vitals')
-- order by table_name, ordinal_position;
