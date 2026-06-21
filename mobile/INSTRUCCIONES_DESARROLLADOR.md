# 🛠️ Guía Maestra de Funcionalidad, Requisitos y Backend (Bolivia Health ID)

Esta guía asocia cada pantalla física que se debe programar o revisar (**Pantalla a Tocar**) con el **Requisito Funcional (RF)** o **No Funcional (RNF)** correspondiente del sistema y las **tareas lógicas/backend** a realizar en el código.

---

## 🏛️ Flujo General de Datos y Seguridad RLS

*   **Requisito Relacionado:** **RNF-01 (Seguridad a Nivel de Fila - RLS)**
*   **Lógica a seguir:** La aplicación móvil debe ejecutar un inicio de sesión silencioso en Supabase utilizando la billetera guardada en el almacenamiento persistente (`AsyncStorage`). Esto garantiza que todas las peticiones pasadas a Supabase cuenten con una sesión activa autorizada y no violen las reglas RLS de Postgres al consultar datos privados.

---

## ⚙️ Tareas de Desarrollo: Pantalla por Pantalla

### 1. 🔑 [LoginScreen.tsx](file:///d:/Bolivia_Health_ID/mobile/src/screens/LoginScreen.tsx)
*   **Requisitos Asociados:** 
    *   **RF-01 (Registro e Inicio de Sesión de Pacientes):** Acceso seguro mediante firmas simuladas.
    *   **RF-03 (Sincronización Automática de Perfiles):** Ligación del perfil de Supabase con la dirección de la billetera.
*   **Tareas Lógicas y de Backend:**
    *   [ ] **Lógica de Biometría:** Utilizar el módulo `LocalAuthentication` de Expo. Si es exitoso, iniciar sesión con `DEFAULT_WALLET` (`0x4e475c495f2b76624321480a7ecec6946168e865`).
    *   [ ] **Simulación en Feria:** Comprobar que los accesos rápidos (`Luis`, `David`, `Maciel`) disparen la función `loginDemo` enviando la wallet pública correspondiente.
    *   [ ] **Persistencia y Registro Silencioso:** 
        - Almacenar la billetera del paciente en `AsyncStorage` en la clave `@current_patient_wallet`.
        - En el servicio de inicio de sesión (`patientService.ts`), verificar que intente loguear en Supabase Auth con el email `wallet@boliviahealth.com`. Si la cuenta no existe en Auth, registrarla automáticamente con `signUp` antes del login.

### 2. 🏠 [HomeScreen.tsx](file:///d:/Bolivia_Health_ID/mobile/src/screens/HomeScreen.tsx)
*   **Requisitos Asociados:**
    *   **RF-03 (Sincronización Automática de Perfiles):** Descargar la información del paciente logueado.
    *   **RF-04 (Validación de Identidad):** Mostrar marcas visuales de validación de identidad.
    *   **RF-11 (Notificaciones):** Alertar sobre solicitudes pendientes.
    *   **RF-13 (Citas Médicas):** Detección rápida de citas agendadas para el día de hoy.
*   **Tareas Lógicas y de Backend:**
    *   [ ] **Control de Renderizado:** Controlar la variable `loading`. Si los datos están descargándose, pintar un `ActivityIndicator` (evita que la pantalla crashee por variables indefinidas).
    *   [ ] **Lógica SOS:** Cargar los signos vitales base y usar `Linking.openURL('tel:NUMERO')` para llamadas directas a emergencias de Bolivia (SAMU: 168, Policía: 110, Bomberos: 119).
    *   [ ] **Consulta de Turno Activo:** Buscar en la tabla `appointments` registros en estado `'scheduled'`, `'confirmed'` o `'in_progress'` para la fecha de hoy, activando el banner de ficha en curso en la UI.

### 3. 💳 [HealthIDScreen.tsx](file:///d:/Bolivia_Health_ID/mobile/src/screens/HealthIDScreen.tsx)
*   **Requisitos Asociados:**
    *   **RF-01 (Generación de QR de Health ID):** Generar una credencial digital inalterable con llave pública.
    *   **RF-04 (Simulación de SEGIP - Datos Clínicos):** Cargar la información médica oficial y validada.
*   **Tareas Lógicas y de Backend:**
    *   [ ] **Seguridad del QR:** Validar que la variable de estado `walletAddress` no esté vacía ni sea nula antes de montar el componente del QR para evitar cierres inesperados de la librería de SVG.
    *   [ ] **Consulta de Datos Clínicos:** Consultar la tabla `patient_vitals` en Supabase para obtener `blood_type` (Tipo de sangre) y `allergies` (Alergias), pintándolos en la credencial virtual.

### 4. 📄 [HistorialScreen.tsx](file:///d:/Bolivia_Health_ID/mobile/src/screens/HistorialScreen.tsx)
*   **Requisitos Asociados:**
    *   **RF-05 (Emisión de Diagnósticos y Recetas):** Mostrar recetas y atenciones emitidas por los médicos.
    *   **RF-08 (Verificación Criptográfica de Integridad):** Comprobar que los registros están firmados on-chain.
*   **Tareas Lógicas y de Backend:**
    *   [ ] **Control de Excepciones RLS:** Envolver las consultas en un bloque `try/catch`. En caso de que la sesión haya caducado y Supabase devuelva un error de permisos RLS, la UI debe mostrar un mensaje amigable indicando que debe reconectarse.
    *   [ ] **Consulta de Expedientes:** Traer las filas de `health_records` y `medications` filtradas por `patient_id`.
    *   [ ] **Verificación de Firma On-Chain:** Validar la columna `tx_hash`. Si contiene un hash hexadecimal de transacción de 66 caracteres, activar la insignia verde de "Verificado en Blockchain" (Avalanche Fuji).

### 5. 🔐 [PermisosScreen.tsx](file:///d:/Bolivia_Health_ID/mobile/src/screens/PermisosScreen.tsx)
*   **Requisitos Asociados:**
    *   **RF-10 (Panel de Gestión de Permisos - Pacientes):** Control de quién puede leer el historial clínico.
*   **Tareas Lógicas y de Backend:**
    *   [ ] **Consulta de Permisos Activos/Pendientes:** Listar filas de `access_permissions` donde el estado sea `'pending'` o `'active'`.
    *   [ ] **Acción de Revocación de Acceso:** Al hacer clic en "Revocar", deshabilitar el botón de inmediato y realizar un `UPDATE` en la tabla `access_permissions` cambiando el estado a `'revoked'`. Esto impide llamadas duplicadas y asegura que el portal médico no pueda consultar más los datos clínicos (respetando RLS).

### 6. 📅 [SolicitarFichaScreen.tsx](file:///d:/Bolivia_Health_ID/mobile/src/screens/SolicitarFichaScreen.tsx) y [DoctorProfileScreen.tsx](file:///d:/Bolivia_Health_ID/mobile/src/screens/DoctorProfileScreen.tsx)
*   **Requisitos Asociados:**
    *   **RF-13 (Agenda y Programación de Citas Médicas):** Flujo de agendamiento de turnos.
*   **Tareas Lógicas y de Backend:**
    *   [ ] **Encadenamiento de Filtros:** Al cambiar de Hospital/Sucursal, vaciar los estados de especialidad y médico seleccionados en `SolicitarFichaScreen`.
    *   [ ] **Disponibilidad Horaria Real:** En `DoctorProfileScreen`, obtener los turnos libres del día llamando a la función de base de datos `get_available_slots(p_doctor_id, p_sucursal_id, p_date)` en lugar de pintar bloques fijos.
    *   [ ] **Persistencia de la Cita:** Al presionar "Confirmar Cita", deshabilitar el botón y realizar un `INSERT` en la tabla `appointments` con las columnas exactas:
        *   `patient_id`: ID del paciente logueado.
        *   `doctor_id`: ID del doctor seleccionado.
        *   `doctor_name`: Nombre completo del médico.
        *   `specialty`: Especialidad del médico.
        *   `appointment_date`: Fecha de la cita (`YYYY-MM-DD`).
        *   `appointment_time`: Bloque de hora seleccionado (`HH:MM:SS`).
        *   `location`: Sucursal del médico (`doctor.branch`).
        *   `status`: Estado inicial `'scheduled'`.
        *   `type`: Modalidad de consulta (`'presencial'`).

### 7. 🎫 [FichaActivaScreen.tsx](file:///d:/Bolivia_Health_ID/mobile/src/screens/FichaActivaScreen.tsx)
*   **Requisitos Asociados:**
    *   **RF-13 (Agenda e Indicador de Fila):** Visualización en tiempo real de la posición de espera.
*   **Tareas Lógicas y de Backend:**
    *   [ ] **Suscripción de WebSocket (Supabase Realtime):** Escuchar el canal de la tabla `appointments` filtrando por el ID del turno activo:
        ```typescript
        const subscription = supabase
          .channel('appointment-live')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `id=eq.${appointmentId}` },
            (payload) => {
              setAppointment(payload.new); // Actualiza la cola en tiempo real
            }
          )
          .subscribe();
        ```
    *   [ ] **Desmontado Seguro:** Detener la suscripción en el retorno del Hook `useEffect` llamando a `supabase.removeChannel(subscription)`.
    *   [ ] **Polling de Fallback:** Si se pierde la conexión de WebSockets, activar una rutina que consulte la base de datos de manera manual cada 20 segundos.
