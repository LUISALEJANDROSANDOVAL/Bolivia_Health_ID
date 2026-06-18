# 📱 Requisitos Funcionales — Bolivia Health ID (App Móvil)

> **Versión:** 1.0.0  
> **Stack:** React Native + Expo (Bare Workflow)  
> **Backend:** Supabase + Avalanche Fuji (Blockchain) + IPFS/Pinata  
> **Fecha:** Junio 2026

---

## 1. Módulo de Autenticación e Identidad

### RF-01 — Login con Google (Particle Network)
- El usuario podrá iniciar sesión usando su cuenta de Google mediante el SDK de Particle Network.
- Al autenticarse por primera vez, el sistema generará automáticamente una **Smart Wallet** en la red Avalanche Fuji vinculada a su cuenta.
- No se requerirá que el usuario conozca conceptos de blockchain para completar el proceso.

### RF-02 — Login con Billetera Web3 (WalletConnect)
- Los usuarios avanzados (ej. médicos o administradores) podrán conectar billeteras externas como MetaMask mediante el protocolo WalletConnect.

### RF-03 — Autenticación Biométrica Local
- Una vez que el usuario haya iniciado sesión al menos una vez, la app ofrecerá desbloqueo mediante huella dactilar o reconocimiento facial (Face ID) usando `expo-local-authentication`.
- Si la biometría falla, el sistema ofrecerá un PIN de respaldo como alternativa.
- La sesión biométrica tendrá una duración máxima de 24 horas antes de requerir re-autenticación completa.

### RF-04 — Cierre de Sesión Seguro
- El usuario podrá cerrar sesión manualmente desde la configuración.
- Al cerrar sesión, se borrarán los tokens locales del dispositivo.

### RF-05 — Consentimiento Legal
- Antes de crear una cuenta, el usuario deberá aceptar explícitamente los **Términos de Servicio** y la **Política de Privacidad de Datos Médicos**.

---

## 2. Módulo de Identidad Médica (Health ID)

### RF-06 — Perfil de Identidad del Paciente
- La app mostrará el **Health ID** del paciente: nombre completo, número de cédula de identidad boliviana, foto de perfil y dirección de la billetera vinculada.
- El perfil incluirá un código QR único generado a partir de la dirección de su Smart Wallet para ser escaneado por médicos.

### RF-07 — Visualización de Historial Clínico
- El paciente podrá ver una lista de todos sus registros médicos almacenados en la blockchain (diagnósticos, recetas, fecha, médico responsable).
- Cada registro mostrará el hash de IPFS del expediente y permitirá abrir el documento clínico completo.

### RF-08 — Sistema de Permisos de Acceso
- El paciente podrá ver qué médicos tienen acceso a su historial clínico.
- El paciente podrá **revocar el acceso** a cualquier médico con un solo toque desde la app.
- Al revocar un acceso, la transacción se registrará en la blockchain de Avalanche.

### RF-09 — Signos Vitales
- El paciente podrá registrar y visualizar su historial de signos vitales (presión arterial, glucosa, peso, temperatura).
- Los datos se almacenarán en Supabase con marca de tiempo.

---

## 3. Módulo de Sistema de Fichas (Turnero Digital)

### RF-10 — Solicitud de Ficha Digital
- El paciente podrá solicitar una ficha de atención médica desde la app, seleccionando:
  - Hospital o centro de salud.
  - Especialidad médica (medicina general, pediatría, etc.).
  - Fecha de atención.
- La ficha se registrará en la base de datos de Supabase con un número de turno único.

### RF-11 — Visualización de Ficha Activa
- La app mostrará la ficha activa del paciente con:
  - Número de turno asignado.
  - Turno actual que se está atendiendo (en tiempo real via Supabase Realtime).
  - Tiempo estimado de espera.
  - Estado de la ficha (En espera / En atención / Completada).

### RF-12 — Código QR de Ficha
- La ficha activa generará un **código QR** en pantalla que el hospital podrá escanear para confirmar la llegada del paciente.

### RF-13 — Notificaciones de Turno
- La app enviará una notificación push al celular del paciente cuando su turno esté próximo (ej. faltan 3 turnos).
- La notificación se enviará también cuando sea el turno del paciente.

### RF-14 — Cancelación de Ficha
- El paciente podrá cancelar su ficha activa con al menos 30 minutos de anticipación.

---

## 4. Módulo del Médico

### RF-15 — Panel del Médico
- Los usuarios con rol `doctor` tendrán acceso a un panel diferente al del paciente.
- Podrán ver la lista de pacientes que les han otorgado acceso a su historial.

### RF-16 — Escaneo de QR del Paciente
- El médico podrá usar la cámara del celular para escanear el código QR del paciente y acceder a su historial clínico inmediatamente, siempre que el paciente le haya concedido permiso previamente.

### RF-17 — Registro de Consulta
- El médico podrá registrar una nueva consulta para un paciente: diagnóstico, receta, observaciones.
- El registro se firmará con la billetera del médico y el hash del documento se almacenará en el contrato inteligente `MedicalRecords.sol` en Avalanche Fuji.

### RF-18 — Gestión de Fichas del Hospital
- El médico o recepcionista podrá llamar al siguiente turno desde la app, actualizando el estado en Supabase en tiempo real.

---

## 5. Módulo de Notificaciones

### RF-19 — Notificaciones en Tiempo Real
- La app mostrará notificaciones en tiempo real para:
  - Solicitudes de acceso al historial por parte de un médico.
  - Aprobación o rechazo de una solicitud de permiso.
  - Actualización del estado de la ficha de turno.
  - Nueva receta o diagnóstico registrado por un médico.

---

## 6. Requisitos No Funcionales (Referencia)

| Requisito | Detalle |
|---|---|
| **Seguridad** | Todos los datos médicos sensibles viajan cifrados. La identidad se verifica on-chain. |
| **Privacidad** | El paciente es el único dueño de sus datos. Solo él puede otorgar o revocar permisos. |
| **Rendimiento** | La app debe cargar el perfil del paciente en menos de 2 segundos con conexión 4G. |
| **Compatibilidad** | Android 8.0 (API 26) o superior. |
| **Offline** | El perfil básico e historial descargado deberá ser visible sin conexión. |
| **Accesibilidad** | Textos legibles (mínimo 14sp), contraste de colores accesible (WCAG AA). |

---

## 7. Pantallas Requeridas (MVP para la Feria)

- [ ] `LoginScreen` — Autenticación Google + Web3 + Biometría *(en desarrollo)*
- [ ] `HomeScreen` — Panel principal del paciente
- [ ] `HealthIDScreen` — Perfil e identidad médica con QR
- [ ] `HistorialScreen` — Lista de registros clínicos
- [ ] `FichaScreen` — Solicitud y seguimiento de turno
- [ ] `PermisosScreen` — Gestión de accesos médicos
- [ ] `DoctorPanelScreen` — Panel exclusivo para médicos
- [ ] `SettingsScreen` — Configuración y cierre de sesión
