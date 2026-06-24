-- 1. Limpiar los espacios invisibles de las especialidades de TODOS los médicos
UPDATE profiles
SET specialty = TRIM(specialty)
WHERE role = 'medico' AND specialty IS NOT NULL;

-- 2. Vincular TODOS los doctores a "Casa Sandoval"
DO $$
DECLARE
    v_sucursal_id uuid;
    doc_record RECORD;
BEGIN
    -- Verificar si la Casa Sandoval existe en la tabla de sucursales
    SELECT id INTO v_sucursal_id FROM sucursales WHERE name ILIKE '%Sandoval%' LIMIT 1;

    -- Si la sucursal no existe, LA CREAMOS automáticamente
    IF v_sucursal_id IS NULL THEN
        INSERT INTO sucursales (name, address) 
        VALUES ('Casa Sandoval', 'Sede Principal Sandoval')
        RETURNING id INTO v_sucursal_id;
        RAISE NOTICE 'Sucursal "Casa Sandoval" creada automáticamente.';
    END IF;

    -- Iterar por TODOS los médicos registrados en la base de datos
    FOR doc_record IN SELECT id FROM profiles WHERE role = 'medico' LOOP
        -- Vincular cada doctor a Casa Sandoval si no estaba ya vinculado
        IF NOT EXISTS (SELECT 1 FROM doctor_sucursal WHERE doctor_id = doc_record.id AND sucursal_id = v_sucursal_id) THEN
            INSERT INTO doctor_sucursal (doctor_id, sucursal_id)
            VALUES (doc_record.id, v_sucursal_id);
        END IF;
    END LOOP;

    RAISE NOTICE 'TODOS los doctores han sido asignados exitosamente a Casa Sandoval.';
END $$;
