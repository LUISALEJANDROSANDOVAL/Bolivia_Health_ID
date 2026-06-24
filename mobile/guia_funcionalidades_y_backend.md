# Guía Completa de Funcionalidades, UI/UX y Backend (App Móvil)

Este documento unifica los requisitos de la **interfaz del cliente (Frontend)** y las especificaciones de la **base de datos (Backend/Supabase)** de todas las pantallas de **Bolivia Health ID**, organizadas por su nivel de prioridad para prevenir fallos (crashes) y colisiones de estado en la aplicación móvil.

---

## 🟥 Prioridad 1: Inicio de Sesión y Dashboard Principal

### 1.1. LoginScreen (Acceso Seguro)
* **Funcionalidad y UI/UX (Frontend):**
  - Pantalla inicial limpia y minimalista, optimizada para modo claro y oscuro (`Colors.tsx`).
  - Opciones de ingreso simulado: Botón de "Google" (para fines demostrativos rápidos) y botones inferiores para iniciar sesión con cuentas de prueba (`Luis`, `David`, `Maciel`).
  - Botón principal de **Acceso Seguro (Biometría)**: Llama a la API nativa de huella/FaceID del dispositivo.
* **Integración de Backend (Supabase & Storage):**
  - **AsyncStorage:** Almacena la dirección pública de la billetera en la llave `@current_patient_wallet` (ej: `0x4e475c495...`).
  - **Autenticación Determinista:** Para cumplir con la seguridad de base de datos (RLS) sin ventanas emergentes lentas en la feria, la app inicia sesión silenciosamente en Supabase Auth usando un correo (`wallet@boliviahealth.com`) y contraseña determinista calculados a partir de la dirección de la billetera.
* **Prevención de Crashes (Antichoque):**
  - **Error en Auth:** Si falla el inicio de sesión por cuenta inexistente, la app detecta el error e intenta registrar automáticamente al usuario antes de reintentar el login, evitando que el usuario quede en un bucle o la app intente cargar la pantalla principal con datos nulos.

### 1.2. HomeScreen (Panel de Control)
* **Funcionalidad y UI/UX (Frontend):**
  - Cabecera con saludo personalizado, foto de perfil y ubicación.
  - Tarjeta dinámica de "Ficha Activa" (solo visible si el paciente tiene una cita programada para hoy).
  - Accesos directos a: Solicitar Ficha, Mi Historial, Permisos de Acceso y Ver Ficha Activa.
  - **Botón SOS (Emergencias):** Despliega un modal táctil con marcado directo a SAMU (168), Policía (110) y Bomberos (119), además de mostrar datos de emergencia vitales del paciente.
* **Integración de Backend (Supabase):**
  - **Tabla `profiles`:** Consulta los datos personales del paciente mediante el ID del usuario autenticado.
  - **Tabla `appointments`:** Consulta con filtros `.eq('patient_id', profile.id).in('status', ['scheduled', 'confirmed', 'in_progress'])` ordenados por fecha y hora para obtener la cita más próxima del día.
* **Prevención de Crashes (Antichoque):**
  - **Perfil Inexistente:** Si la consulta a `profiles` devuelve nulo, se muestra un esqueleto de carga y se redirige al login en lugar de intentar leer campos como `profile.full_name` que crashean la app.

---

## 🟧 Prioridad 2: Credencial de Identidad

### 2.1. HealthIDScreen (Mi ID de Salud)
* **Funcionalidad y UI/UX (Frontend):**
  - Tarjeta de presentación digital estilo Wallet (Apple/Google).
  - Generación de un código QR central grande que representa la dirección de la wallet del paciente.
  - Resumen visual rápido de signos clínicos inmutables (Grupo sanguíneo, alergias severas).
* **Integración de Backend (Supabase):**
  - **Tabla `patient_vitals`:** Descarga los signos vitales base relacionados al ID del perfil del paciente.
  - **Llave Pública:** Lee el valor directo de la dirección de la billetera del almacenamiento persistente local.
* **Prevención de Crashes (Antichoque):**
  - **QR Nulo:** El componente de QR (`react-native-qrcode-svg`) crashea inmediatamente si recibe un string vacío o nulo. Se introduce una validación estricta para renderizar un esqueleto (`ActivityIndicator`) hasta que el string de la wallet esté 100% cargado.

---

## 🟩 Prioridad 3: Historial y Expediente Clínico

### 3.1. HistorialScreen (Expediente Médico)
* **Funcionalidad y UI/UX (Frontend):**
  - Pantalla plana tipo timeline (cronología) con las consultas pasadas del paciente.
  - Cada tarjeta de consulta muestra la fecha, especialidad, diagnóstico (CIE-10), doctor, y un distintivo de "Verificación Criptográfica".
  - Al presionar una tarjeta, se despliegan detalles adicionales (receta médica, dosis, signos vitales medidos).
* **Integración de Backend (Supabase & RLS):**
  - **Tablas `health_records`, `medications` y `profiles` (doctores):** Consulta con JOINs en Supabase filtrando por el ID de paciente.
  - **Verificación de Firma:** Lee el campo `blockchain_tx_hash` para mostrar el sello de "Verificado on Avalanche Fuji".
* **Prevención de Crashes (Antichoque):**
  - **RLS Denegado:** Si las políticas RLS de Supabase bloquean la lectura (por sesión expirada o conflicto), la consulta fallará. Se captura el error en un bloque `try/catch` y se muestra un estado de "Fallo de conexión" en lugar de crashear la lista.
  - **Datos Nulos en Recetas:** Si un diagnóstico no tiene medicamentos asociados, se maneja una condición para ocultar la sección de recetas graciosamente.

---

## 🟦 Prioridad 4: Gestión de Privacidad y Permisos

### 4.1. PermisosScreen (Soberanía del Paciente)
* **Funcionalidad y UI/UX (Frontend):**
  - Listado de permisos activos otorgados a médicos o instituciones médicas.
  - Botón rojo prominente de "Revocar Acceso" al lado de cada médico autorizado.
  - Listado de solicitudes pendientes de aprobación.
* **Integración de Backend (Supabase):**
  - **Tabla `access_permissions`:** Lee los registros donde `patient_id` coincide con el del paciente autenticado y el estado es `active` o `pending`.
  - **Acción Revocar:** Ejecuta un `UPDATE` en la tabla `access_permissions` cambiando el estado a `revoked` y estableciendo la fecha de expiración al momento actual.
* **Prevención de Crashes (Antichoque):**
  - **Doble clic en Revocar:** Mientras se procesa la petición de Supabase, se coloca el botón en estado de carga desactivado (`disabled={loading}`) para evitar clics consecutivos que causen errores en la base de datos.

---

## 🟪 Prioridad 5: Agendamiento y Cita Activa

### 5.1. SolicitarFichaScreen y DoctorProfileScreen
* **Funcionalidad y UI/UX (Frontend):**
  - Flujo de reserva interactivo en 3 pasos:
    1. Búsqueda y selección de Centro Médico.
    2. Búsqueda y selección de Especialidad.
    3. Selección de Médico y horario de consulta disponible.
  - Botón de confirmación que redirige automáticamente a la Ficha Activa tras el éxito.
* **Integración de Backend (Supabase):**
  - **Tablas de catálogo:** `hospitals`, `specialties`, `profiles` (médicos).
  - **Acción Confirmar:** Realiza un `INSERT` en la tabla `appointments` con el ID del paciente, médico, especialidad, fecha, hora y estado inicial `scheduled`.
* **Prevención de Crashes (Antichoque):**
  - **Navegación sin argumentos:** Al abrir `DoctorProfileScreen`, el componente requiere los datos del doctor. Se añade validación para que si el objeto `route.params.doctor` es indefinido, muestre una alerta y regrese a la pantalla de búsqueda en lugar de crashearse.

### 5.2. FichaActivaScreen (Cola de Espera Realtime)
* **Funcionalidad y UI/UX (Frontend):**
  - Muestra la tarjeta de atención médica actual con un código QR que la clínica escaneará para la admisión.
  - Indicador de cola en tiempo real: número de turno actual siendo atendido y número de pacientes pendientes delante.
* **Integración de Backend (Supabase Realtime):**
  - **Suscripción de WebSocket:** Utiliza `supabase.channel('public:appointments')` para escuchar cambios de actualización (`UPDATE`) en la cita activa.
  - Cuando el médico en el hospital cambia el estado del turno a `in_progress` o incrementa el contador de admisión, la app del paciente actualiza el componente visual de forma reactiva sin refrescar toda la pantalla.
* **Prevención de Crashes (Antichoque):**
  - **Desconexión del canal:** Si la conexión del WebSocket de Supabase se interrumpe, la app hace un fallback automático a encuestas periódicas (polling) cada 20 segundos para mantener al usuario informado sin congelar la interfaz.
