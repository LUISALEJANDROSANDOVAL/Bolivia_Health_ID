# Análisis y Mapeo: Requisitos Implementados vs. Pantallas de la App Móvil

Este documento realiza un análisis comparativo y de alineación entre los **Requisitos Implementados** generales del ecosistema de **Bolivia Health ID** (definidos en `REQUISITOS_IMPLEMENTADOS.md`) y la estructura y funcionalidad actual de la **Aplicación Móvil** (detallada en `requisitos_pantallas.md`).

---

## 1. Cuadro de Alineación (Requisitos vs. Pantallas Móviles)

El siguiente cuadro detalla cómo se mapean los requisitos funcionales (RF) del sistema general con la implementación real en las pantallas de la aplicación para smartphones:

| **Código RF** | **Requisito General (Ecosistema)** | **Estado en App Móvil** | **Pantalla / Mecanismo en Mobile** | **Detalle de la Implementación en Mobile** |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Inicio de sesión con Particle Network (Web3) | **Simulado / Híbrido** | `LoginScreen.tsx` | Permite el ingreso rápido simulando el flujo de Google/Wallet. Utiliza una billetera determinista local (`DEFAULT_WALLET`) ligada a credenciales de Supabase Auth para mantener la sesión segura y cumplir con las políticas RLS. |
| **RF-02** | Login de Médicos (Supabase Auth) | **No Aplica** | N/A | Esta aplicación móvil está orientada 100% al **paciente**. Los médicos interactúan a través de la plataforma Web/Desktop. |
| **RF-03** | Sincronización Automática de Perfiles | **Implementado** | `LoginScreen.tsx` & `HomeScreen.tsx` | La sesión móvil inicia sesión automáticamente en Supabase usando la firma determinista de la wallet, enlazando y descargando el perfil de `profiles` en tiempo real. |
| **RF-04** | Simulación de Validación CI (SEGIP) | **Integrado en Datos** | `HealthIDScreen.tsx` / Perfil | Los perfiles de prueba de los pacientes (Luis, David, Maciel) ya cuentan con sus campos de Cédula de Identidad (CI) validados en la base de datos para la demostración. |
| **RF-05** | Emisión de Diagnósticos y Recetas | **Visualización** | `HistorialScreen.tsx` | El paciente visualiza en orden cronológico los diagnósticos (CIE-10), medicamentos prescritos y signos vitales registrados por los doctores desde el portal médico. |
| **RF-06** | Carga Descentralizada (IPFS) | **Visualización** | `HistorialScreen.tsx` | Los registros que lee la aplicación móvil provienen de Supabase, que a su vez contiene la referencia al hash CID de IPFS donde se almacena el JSON clínico original. |
| **RF-07** | Registro On-Chain (Blockchain) | **Verificación** | `HealthIDScreen.tsx` / `HistorialScreen.tsx` | El código QR de la credencial Health ID contiene la dirección pública de la Smart Wallet del paciente, lo que permite a cualquier validador verificar su validez on-chain. |
| **RF-08** | Verificación Criptográfica de Integridad | **Implementado** | `HistorialScreen.tsx` | La app consume los estados de verificación en Supabase para mostrar al paciente un distintivo visual que indica si su registro médico está "Firmado on-chain" y coincide plenamente. |
| **RF-09** | Solicitud de Acceso (Médicos) | **Recepción** | `PermisosScreen.tsx` | El paciente visualiza de forma inmediata las solicitudes de acceso que los médicos envían desde sus plataformas web al buscar su CI. |
| **RF-10** | Panel de Gestión de Permisos | **Implementado** | `PermisosScreen.tsx` | El paciente puede ver accesos activos, suspender permisos de forma instantánea o denegar solicitudes pendientes, actualizando directamente las políticas y tablas en Supabase. |
| **RF-11** | Notificaciones de Solicitudes | **Visualización** | `HomeScreen.tsx` | Alertas dinámicas al paciente sobre solicitudes de acceso pendientes que requieran su atención. |
| **RF-12** | Extracción por IA (Gemini) | **No Aplica** | N/A | Esta funcionalidad es exclusiva del portal web del médico al digitalizar diagnósticos físicos. En mobile, el paciente solo visualiza la información ya procesada. |
| **RF-13** | Agenda y Reserva de Citas | **Implementado** | `SolicitarFichaScreen.tsx`, `DoctorProfileScreen.tsx` y `MisCitasScreen.tsx` | Flujo completo de reserva: el paciente elige especialidad, doctor, fecha y turno. Las citas se listan dinámicamente según su estado (Próximas/Pasadas). |
| **RF-14** | Indicador de Seguridad del Perfil | **En revisión** | Perfil / `HealthIDScreen.tsx` | Muestra el estado del perfil (si tiene billetera vinculada y datos verificados). |

---

## 2. Análisis de Requisitos No Funcionales (RNF) en Mobile

1. **RNF-01: Seguridad a Nivel de Fila (RLS) - CUMPLIDO:**
   - La aplicación móvil realiza todas las consultas (`profiles`, `patient_vitals`, `appointments`, `access_permissions`) a través del cliente Supabase inicializado con la sesión activa de la cuenta determinista del paciente. Esto garantiza que las políticas RLS de Supabase protejan los datos sensibles en tránsito y eviten fugas de información.
2. **RNF-04: Diseño Estético y Premium con Dark Mode - CUMPLIDO:**
   - La aplicación móvil cumple de manera sobresaliente este punto. Todas las pantallas (`HomeScreen`, `FichaActivaScreen`, `LoginScreen`, etc.) se adaptan automáticamente al tema claro y oscuro del sistema utilizando la paleta institucional definida en [Colors.tsx](file:///d:/Bolivia_Health_ID/mobile/src/theme/Colors.tsx).
   - Se reemplazaron todos los emojis e íconos genéricos por gráficos minimalistas basados en `lucide-react-native`.
3. **RNF-05: Cargas de UI Fluidas y Esqueletos - EN MEJORA:**
   - La app utiliza indicadores de carga (`ActivityIndicator`) fluidos durante las llamadas asíncronas a Supabase (ej. al reservar fichas o consultar permisos) para ofrecer una UX fluida y sin saltos de contenido molestos.

---

## 3. Conclusiones para la Demostración (Feria UTEPSA)

* **Autenticación Simplificada pero Segura:** En la feria, realizar el flujo completo de Particle Network en un emulador o dispositivo de pruebas puede ser lento o fallar por conectividad. El uso de **billeteras deterministas simuladas** (Luis, David, Maciel) asociadas a Supabase Auth permite mostrar de forma instantánea cómo cambia la app y los permisos según el paciente que inicia sesión.
* **Flujo Cerrado y Funcional:** La app móvil interactúa perfectamente con la base de datos de Supabase compartida con el portal médico, lo que significa que si el paciente otorga un permiso en `PermisosScreen.tsx` o solicita una ficha en `SolicitarFichaScreen.tsx`, el cambio se refleja inmediatamente en el sistema web del doctor, demostrando la integración en tiempo real del ecosistema.
