-- 1. Corregimos la especialidad (quitamos el espacio invisible que tenía)
UPDATE profiles
SET specialty = 'Ginecología'
WHERE full_name ILIKE '%Jorge%Ayala%';

-- 2. Vinculamos al doctor Jorge Ayala con la Casa de Sandoval automáticamente
DO $$
DECLARE
    v_doctor_id uuid;
    v_sucursal_id uuid;
BEGIN
    -- Buscar el ID exacto del doctor Jorge Ayala
    SELECT id INTO v_doctor_id FROM profiles WHERE full_name ILIKE '%Jorge%Ayala%' LIMIT 1;
    
    -- Verificar si la Casa Sandoval existe en la tabla de sucursales
    SELECT id INTO v_sucursal_id FROM sucursales WHERE name ILIKE '%Sandoval%' LIMIT 1;

    -- Si la sucursal no existe, LA CREAMOS automáticamente
    IF v_sucursal_id IS NULL THEN
        INSERT INTO sucursales (name, address) 
        VALUES ('Casa Sandoval', 'Sede Principal Sandoval')
        RETURNING id INTO v_sucursal_id;
        RAISE NOTICE 'Sucursal "Casa Sandoval" creada automáticamente.';
    END IF;

    -- Si encontramos al doctor, procedemos a crear el vínculo
    IF v_doctor_id IS NOT NULL AND v_sucursal_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM doctor_sucursal WHERE doctor_id = v_doctor_id AND sucursal_id = v_sucursal_id) THEN
            INSERT INTO doctor_sucursal (doctor_id, sucursal_id)
            VALUES (v_doctor_id, v_sucursal_id);
            RAISE NOTICE 'Sucursal asignada con éxito al doctor.';
        ELSE
            RAISE NOTICE 'El doctor ya estaba asignado a esta sucursal.';
        END IF;
    ELSE
        RAISE NOTICE 'Doctor no encontrado en la base de datos (verifica el nombre).';
    END IF;
END $$;
