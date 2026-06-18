# Requisitos de Backend y Blockchain (Guía para el Equipo)

Este documento detalla qué funcionalidades de Backend (Supabase/PostgreSQL) y de Web3 (Blockchain/IPFS/Particle Network) se necesitan para que cada pantalla de la aplicación móvil del paciente funcione con datos reales.

---

## 🏛️ Arquitectura General Sugerida
- **Base de Datos Tradicional (Web2):** Supabase (PostgreSQL) para datos rápidos y relacionales como hospitales, catálogos de especialidades y el sistema de filas (turnos) en tiempo real.
- **Base de Datos Inmutable (Web3):** Blockchain (ej. Avalanche) para almacenar los hashes de los expedientes médicos y gestionar los Smart Contracts de permisos.
- **Almacenamiento de Archivos:** IPFS (InterPlanetary File System) para guardar los PDFs o imágenes de los laboratorios y recetas.
- **Autenticación (Wallet-as-a-Service):** Particle Network, para que el usuario inicie sesión con su huella o Google y se le cree una billetera criptográfica invisible por detrás.

---

## 📱 Requisitos por Pantalla

### 1. LoginScreen
- **Funcionalidad Web3:** Integración del SDK de Particle Network.
- **Qué debe hacer el Backend:** 
  1. Cuando el usuario hace login con Google/Huella, Particle Network debe generar o recuperar la "Wallet Address" del paciente.
  2. Si es la primera vez, el backend debe registrar la Wallet Address en la tabla `pacientes` de Supabase junto con el nombre del usuario.

### 2. HomeScreen
- **Funcionalidad Web2:** Endpoint `GET /api/paciente/perfil`
- **Qué debe hacer el Backend:**
  1. Devolver los datos básicos del paciente (Nombre, Cédula, Grupo Sanguíneo, Seguro) desde Supabase.
  2. Consultar si el paciente tiene un turno activo para el día de hoy (estado: "EN_ESPERA"). Si lo tiene, el frontend mostrará el banner de "Cita Activa".

### 3. SolicitarFichaScreen
- **Funcionalidad Web2:** 
  - `GET /api/hospitales` (Lista de hospitales con su tiempo de espera estimado calculado en tiempo real).
  - `GET /api/especialidades`
  - `POST /api/fichas/solicitar`
- **Qué debe hacer el Backend:**
  1. Al recibir el POST, insertar una fila en la tabla `turnos` en Supabase con: `id_paciente`, `id_hospital`, `id_especialidad`, `estado = 'EN_ESPERA'`.
  2. Asignarle el número de turno secuencial correspondiente para ese hospital/especialidad (ej. Turno #18).

### 4. FichaActivaScreen (CRÍTICO: Supabase Realtime)
- **Funcionalidad Web2:** Supabase Realtime (WebSockets).
- **Qué debe hacer el Backend:**
  1. No se necesitan endpoints REST aquí, el frontend se suscribirá directamente a la tabla `turnos_activos` de Supabase usando el cliente de Supabase JS.
  2. El backend (o la lógica del lado del hospital) es quien actualiza el campo `turno_actual_atendiendose` en la base de datos. Cada vez que ese número cambie (del 14 al 15), Supabase Realtime disparará un evento automático a la app móvil para que el círculo de progreso avance sin que el paciente tenga que recargar la pantalla.

### 5. QRAdmisionScreen
- **Funcionalidad Web2/Web3:** Endpoint para el portal del hospital `POST /api/fichas/admitir`
- **Qué debe hacer el Backend:**
  1. El QR contiene el ID del turno en texto plano o cifrado ligero.
  2. Cuando el recepcionista del hospital escanea este QR con su sistema, su sistema hace un POST al backend para cambiar el estado del turno de `EN_ESPERA` a `EN_SALA`.

### 6. HealthIDScreen
- **Funcionalidad Web3:** Visualización de la Wallet.
- **Qué debe hacer el Backend:**
  1. El QR generado aquí contiene la **Wallet Address (Public Key)** del paciente. 
  2. Cuando el doctor lo escanea en su consultorio, el sistema del doctor solicita acceso a la Blockchain para leer los contratos inteligentes asociados a esa Wallet Address.

### 7. HistorialScreen
- **Funcionalidad Web3 (Smart Contracts e IPFS):**
- **Qué debe hacer el Backend:**
  1. El frontend necesita consultar un Smart Contract (ej. `MedicalRecords.sol`) usando la Wallet Address del paciente.
  2. El Smart Contract debe devolver una lista de estructuras (Structs) que contengan: `Categoria`, `Medico_Emisor`, `Fecha`, y el **Hash de IPFS** (CID).
  3. El frontend usará ese Hash de IPFS para armar una URL (ej. `https://ipfs.io/ipfs/Qm...`) para que el botón "Ver Documento Original" descargue el PDF real desde la red IPFS.

### 8. PermisosScreen
- **Funcionalidad Web3 (Transacción Blockchain):** Ejecución de Smart Contract.
- **Qué debe hacer el Backend:**
  1. El frontend enviará una transacción firmada por el paciente (usando Particle Network) hacia el Smart Contract de permisos (ej. `AccessControl.sol`).
  2. La función del contrato a llamar sería algo como `grantAccess(address doctor, uint256 expiracion, string[] categorias)`.
  3. **Nota de arquitectura:** Esta es la única pantalla que "escribe" en la Blockchain. El backend tradicional (Supabase) no interviene aquí; la app móvil se comunica directamente con la red de Avalanche o la que se decida utilizar.
