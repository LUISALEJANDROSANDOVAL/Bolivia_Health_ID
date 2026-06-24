DO $$
DECLARE
    v_doctor_id uuid;
    v_sucursal_id uuid;
    v_day integer;
BEGIN
    -- 1. Buscar al Dr. Jorge Ayala
    SELECT id INTO v_doctor_id FROM profiles WHERE full_name ILIKE '%Jorge%Ayala%' LIMIT 1;
    
    -- 2. Buscar Casa Sandoval
    SELECT id INTO v_sucursal_id FROM sucursales WHERE name ILIKE '%Sandoval%' LIMIT 1;

    -- Si ambos existen, procedemos
    IF v_doctor_id IS NOT NULL AND v_sucursal_id IS NOT NULL THEN
        
        -- Insertar horario de Lunes (1) a Viernes (5) de 09:00 a 17:00
        -- (Dura 30 minutos cada turno por defecto)
        FOR v_day IN 1..5 LOOP
            -- Solo insertar si no existe ya para evitar duplicados
            IF NOT EXISTS (
                SELECT 1 FROM doctor_schedules 
                WHERE doctor_id = v_doctor_id AND sucursal_id = v_sucursal_id AND day_of_week = v_day
            ) THEN
                INSERT INTO doctor_schedules (
                    doctor_id, sucursal_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active
                ) VALUES (
                    v_doctor_id, v_sucursal_id, v_day, '09:00:00', '17:00:00', 30, true
                );
            END IF;
        END LOOP;
        
        RAISE NOTICE '¡Horarios creados exitosamente para el Dr. Jorge Ayala en Casa Sandoval!';
    ELSE
        RAISE NOTICE 'No se encontró al doctor o la sucursal.';
    END IF;
END $$;
