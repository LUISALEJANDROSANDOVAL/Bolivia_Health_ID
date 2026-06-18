# Requisitos y Funcionalidades Implementadas — Bolivia Health ID

Este documento contiene la especificación formal de todos los **Requisitos Funcionales (RF)** y **Requisitos No Funcionales (RNF)** que se cumplen y están implementados actualmente en el sistema **Bolivia Health ID**.

---

## 1. Requisitos Funcionales (RF)

### 1.1. Gestión de Identidad y Autenticación (Web3 & Social)
*   **RF-01: Registro e Inicio de Sesión de Pacientes:** 
    *   Permite a los pacientes iniciar sesión de forma descentralizada utilizando su cuenta social de Google mediante el SDK de **Particle Network**. Este proceso crea automáticamente una *Smart Wallet* no custodia (ERC-4337) en la red de pruebas Avalanche Fuji.
    *   Habilita la opción de conectar billeteras Web3 tradicionales (MetaMask, Coinbase Wallet) a través de **Wagmi** y **ConnectKit**.
*   **RF-02: Registro e Inicio de Sesión de Médicos:**
    *   Autenticación basada en correo electrónico y contraseña gestionada por Supabase Auth, manteniendo una persistencia de sesión local segura.
*   **RF-03: Sincronización Automática de Perfiles:**
    *   Al autenticarse mediante Web3, el sistema detecta la dirección de la billetera y crea/actualiza en tiempo real el registro del perfil en la base de datos centralizada de Supabase, enlazando la wallet con sus datos personales.
*   **RF-04: Simulación de Validación de Identidad (SEGIP & SIREPRO):**
    *   Reconocimiento óptico de caracteres (OCR) mediante `Tesseract.js` en el cliente para escanear y extraer información de la Cédula de Identidad (CI) del paciente y la matrícula profesional del médico.
    *   Validación automatizada de los datos contra simulaciones de la base de datos civil (SEGIP) y de profesionales en salud (SIREPRO) en Supabase.

---

### 1.2. Gestión de Expedientes y Diagnósticos Médicos
*   **RF-05: Emisión de Diagnósticos y Recetas:**
    *   Los médicos pueden registrar consultas y recetas ingresando signos vitales (presión arterial, peso, temperatura, glucosa), medicamentos (dosis, frecuencia, duración) e indicando códigos diagnósticos estandarizados internacionalmente (**CIE-10**).
*   **RF-06: Carga Descentralizada de Archivos (IPFS):**
    *   Al guardar un estudio o receta, el sistema empaqueta los datos clínicos en formato JSON y sube los archivos adjuntos a **IPFS** a través del servicio de Pinata, obteniendo un hash CID (identificador de contenido) único e inmutable.
*   **RF-07: Registro On-Chain (Anclaje Blockchain):**
    *   El sistema registra el hash CID de IPFS en el contrato inteligente `MedicalRecords.sol` desplegado en **Avalanche Fuji C-Chain** mediante una transacción patrocinada por el Relayer.
*   **RF-08: Verificación Criptográfica de Integridad:**
    *   El dashboard del paciente (`/diagnosticos`) descarga los registros de Supabase y, de forma paralela, lee los hashes registrados en la blockchain mediante `getRecords`.
    *   **Cruzamiento y distintivo visual:**
        *   **Verificado Blockchain:** Los datos de Supabase coinciden con el hash registrado on-chain.
        *   **Datos Alterados:** El hash local de Supabase no coincide con la blockchain (alerta de manipulación).
        *   **Falta Firma On-Chain:** El expediente existe off-chain pero aún no ha sido firmado en la blockchain.

---

### 1.3. Control de Acceso y Privacidad de Datos
*   **RF-09: Panel de Solicitud de Autorización (Médicos):**
    *   Los médicos pueden buscar pacientes mediante su Cédula de Identidad (CI) y enviar una solicitud digital para visualizar su historial clínico.
*   **RF-10: Panel de Gestión de Permisos (Pacientes):**
    *   Los pacientes visualizan en `/permisos` las solicitudes pendientes, los accesos activos, los revocados y los expirados.
    *   Habilita botones para aprobar, rechazar o revocar permisos médicos de forma inmediata, actualizando el estado de la relación en la base de datos de manera segura.
*   **RF-11: Notificaciones de Solicitudes y Aprobaciones:**
    *   Envío de alertas internas en tiempo real al panel de notificaciones del médico cuando un paciente aprueba o rechaza una solicitud de acceso.

---

### 1.4. Servicios de Inteligencia Artificial (IA) y Agendamiento
*   **RF-12: Extracción Inteligente de Datos Médicos (Gemini IA):**
    *   Al subir un diagnóstico o receta médica física en formato PDF o imagen, la aplicación web procesa el archivo utilizando la API de **Google Gemini Flash**.
    *   La IA extrae automáticamente la fecha, medicamentos prescritos, signos vitales y posibles códigos CIE-10, precargando el formulario de Supabase para evitar el copiado manual.
*   **RF-13: Agenda y Programación de Citas Médicas:**
    *   Los pacientes pueden programar citas médicas eligiendo especialidades y médicos registrados.
    *   Los médicos cuentan con un panel de agenda (`/doctor/agenda`) donde visualizan las citas pendientes y confirmadas del día.
*   **RF-14: Indicador Dinámico del Nivel de Seguridad:**
    *   Evalúa de manera interactiva la seguridad de la cuenta del usuario en base a factores activos (billetera conectada, correo verificado, CI validada por SEGIP, firma silenciosa activa) y muestra un porcentaje de protección en tiempo real en los dashboards.

---

## 2. Requisitos No Funcionales (RNF)

*   **RNF-01: Seguridad a Nivel de Fila en Base de Datos (RLS):**
    *   Las consultas a las tablas `medical_background` y `health_records` en Supabase están protegidas por políticas de **Row Level Security (RLS)**. Un registro clínico solo puede ser leído si el solicitante es el propio paciente o si es un médico con un permiso `active` y vigente registrado en la tabla `access_permissions`.
*   **RNF-02: Transacciones Gasless (Abstracción de Cuenta):**
    *   La interacción con la blockchain de Avalanche Fuji es completamente gratuita para el usuario final (paciente o médico). Las transacciones son firmadas localmente en el cliente y enviadas a través de una API *Relayer* intermediaria que paga el costo de gas en AVAX.
*   **RNF-03: Modo de Sesión Clínica Rápida (Firma Silenciosa):**
    *   Permite a los médicos activar una llave temporal local válida por 24 horas. Esto les permite firmar e interactuar con la blockchain en segundo plano de manera silenciosa, eliminando ventanas emergentes (popups) de MetaMask en cada diagnóstico emitido.
*   **RNF-04: Diseño Estético, Premium y Responsivo:**
    *   Desarrollado con Tailwind CSS v4 y Next.js. Las páginas de login se adaptan de manera responsiva a pantallas móviles (`grid-cols-1 sm:grid-cols-2`), y los campos de texto tienen tamaños de fuente mínimos de 16px (`text-base`) para evitar el zoom molesto en navegadores Safari de iOS.
*   **RNF-05: Cargas de UI Fluidas sin CLS (Cumulative Layout Shift):**
    *   Las pantallas de carga de datos pesados (permisos y diagnósticos) utilizan representaciones en esqueleto mediante componentes `<Skeleton />` que replican la estructura física de los datos finales, reduciendo el parpadeo visual.
*   **RNF-06: Inmutabilidad e Integridad de la Auditoría Histórica:**
    *   La blockchain de Avalanche Fuji sirve como bitácora forense de auditoría inalterable. Los registros de salud e históricos de accesos no pueden eliminarse ni modificarse de forma retroactiva.
