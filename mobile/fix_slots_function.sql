CREATE OR REPLACE FUNCTION public.get_available_slots(p_doctor_id uuid, p_sucursal_id uuid, p_date date)
 RETURNS TABLE(start_time time without time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER -- <--- ¡ESTA LÍNEA ES LA CLAVE MÁGICA!
AS $function$
DECLARE
    v_dow integer;
    v_schedule record;
    v_current_time time;
    v_end_time time;
    v_slot interval;
BEGIN
    -- Obtener el día de la semana (ISODOW: Lunes=1, Domingo=7)
    SELECT EXTRACT(ISODOW FROM p_date) INTO v_dow;

    -- Iterar sobre todos los bloques de horario del doctor ese día
    FOR v_schedule IN 
        SELECT * FROM doctor_schedules 
        WHERE doctor_id = p_doctor_id 
          AND sucursal_id = p_sucursal_id 
          AND day_of_week = v_dow 
          AND is_active = true
    LOOP
        v_current_time := v_schedule.start_time;
        v_end_time := v_schedule.end_time;
        v_slot := (v_schedule.slot_duration_minutes || ' minutes')::interval;

        -- Generar las horas disponibles dividiendo el turno
        WHILE v_current_time + v_slot <= v_end_time LOOP
            
            -- Si la fecha buscada es HOY, no mostrar horas que ya pasaron
            IF p_date = CURRENT_DATE AND v_current_time <= CURRENT_TIME THEN
                v_current_time := v_current_time + v_slot;
                CONTINUE;
            END IF;

            -- Verificar si esa hora ya está reservada por otro paciente
            IF NOT EXISTS (
                SELECT 1 FROM appointments a
                WHERE a.doctor_id = p_doctor_id 
                  AND a.appointment_date = p_date 
                  AND a.appointment_time = v_current_time
                  AND a.status NOT IN ('cancelled', 'completed')
            ) THEN
                start_time := v_current_time;
                RETURN NEXT;
            END IF;
            
            -- Avanzar al siguiente bloque de tiempo
            v_current_time := v_current_time + v_slot;
        END LOOP;
    END LOOP;
END;
$function$;
