# 🏆 MVP — Requisitos para la Feria Tecnológica
## Bolivia Health ID · App Móvil

> **Objetivo:** Construir una demostración funcional e impactante para la feria.  
> **Tiempo estimado de desarrollo:** 3–5 días  
> **Criterio de éxito:** Un jurado sin conocimientos técnicos debe poder usar la app en 2 minutos sin ayuda.

---

> [!IMPORTANT]
> Este documento define el alcance **mínimo y suficiente** para la feria. No se desarrollará nada fuera de esta lista hasta después del evento. La prioridad es calidad de la demo, no cantidad de pantallas.

---

## ✅ PANTALLA 1 — Login (Ya en desarrollo)

**Objetivo de la demo:** El jurado verá que la app tiene seguridad de nivel bancario.

| ID | Requisito | Prioridad |
|---|---|---|
| MVP-01 | Botón "Continuar con Google" (puede ser simulado con navegación directa al Home) | 🔴 Alta |
| MVP-02 | Botón "Conectar Billetera Web3" (visual, sin lógica real) | 🟡 Media |
| MVP-03 | Autenticación biométrica real con huella/FaceID via `expo-local-authentication` | 🔴 Alta |
| MVP-04 | Texto legal de privacidad de datos médicos visible | 🟡 Media |

**Criterio de aceptación:** El jurado presiona la huella en el celular y entra a la app.

---

## ✅ PANTALLA 2 — Home / Dashboard del Paciente

**Objetivo de la demo:** Mostrar que el paciente tiene todo centralizado en un solo lugar.

| ID | Requisito | Prioridad |
|---|---|---|
| MVP-05 | Saludo personalizado con nombre y foto del usuario | 🔴 Alta |
| MVP-06 | Tarjeta visual del Health ID con número de cédula | 🔴 Alta |
| MVP-07 | Botón rápido "Ver mi Ficha de Turno" | 🔴 Alta |
| MVP-08 | Botón rápido "Mi Historial Clínico" | 🔴 Alta |
| MVP-09 | Indicador de blockchain (dirección de billetera abreviada, ej: `0x3f4...a21`) | 🟡 Media |
| MVP-10 | Menú de navegación inferior (Tab Bar) con 4 secciones | 🔴 Alta |

**Criterio de aceptación:** El jurado entiende de un vistazo quién es el paciente y qué puede hacer.

---

## ✅ PANTALLA 3 — Sistema de Fichas (El "Plus" de la Feria)

**Objetivo de la demo:** Mostrar el problema real que resuelve: eliminar las filas de madrugada en los hospitales.

| ID | Requisito | Prioridad |
|---|---|---|
| MVP-11 | Selector de hospital (lista hardcodeada con 3–5 hospitales de La Paz/Cochabamba) | 🔴 Alta |
| MVP-12 | Selector de especialidad médica (lista fija: Medicina General, Pediatría, etc.) | 🔴 Alta |
| MVP-13 | Botón "Solicitar Ficha" que genera un número de turno y lo guarda en Supabase | 🔴 Alta |
| MVP-14 | Pantalla de "Ficha Activa" mostrando: Nº de turno, turno actual y tiempo estimado | 🔴 Alta |
| MVP-15 | Código QR de la ficha activa en pantalla grande (para que el hospital lo escanee) | 🔴 Alta |
| MVP-16 | Actualización en tiempo real del turno actual via **Supabase Realtime** | 🟡 Media |

**Criterio de aceptación:** El jurado ve cómo se genera una ficha #18 y observa cómo el número avanza sin recargar.

---

## ✅ PANTALLA 4 — Health ID / Identidad Médica

**Objetivo de la demo:** Mostrar la innovación blockchain de forma visual y comprensible.

| ID | Requisito | Prioridad |
|---|---|---|
| MVP-17 | Código QR grande con la dirección de la billetera del paciente | 🔴 Alta |
| MVP-18 | Nombre completo y número de cédula de identidad del paciente | 🔴 Alta |
| MVP-19 | Lista de 2–3 registros médicos demo (diagnóstico, fecha, médico) | 🔴 Alta |
| MVP-20 | Al tocar un registro, mostrar el hash de IPFS del documento | 🟡 Media |
| MVP-21 | Badge o indicador visual de "Verificado en Blockchain ✅" | 🔴 Alta |

**Criterio de aceptación:** El jurado escanea el QR con otro celular y ve la dirección blockchain del paciente.

---

{/* Removed Panel del Médico from mobile scope */}

## 🚫 Fuera del Alcance del MVP (No se desarrollará para la feria)

- **Panel del Médico y Sistema de Recepción:** Se desarrollará como un sistema web/escritorio separado, no dentro de esta app móvil.
- Registro de nuevos diagnósticos con firma blockchain real (se usa data demo)
- Integración real de Particle Network (se simula con navegación directa)
- Notificaciones push reales (se simula con Supabase Realtime en pantalla)
- Pantalla de signos vitales
- Pantalla de configuración y perfil editable
- Modo offline

---

## 📅 Plan de Trabajo Sugerido

| Día | Tarea |
|---|---|
| **Día 1** | Terminar LoginScreen + crear navegación Tab Bar + HomeScreen |
| **Día 2** | Sistema de Fichas (solicitud, ficha activa, QR, Supabase) |
| **Día 3** | Pantalla Health ID + datos demo en blockchain |
| **Día 4** | Pantalla de Historial Clínico completo + Permisos |
| **Día 5** | Pulir diseño, generar APK final, ensayar la demostración |

---

## 🎯 Script de Demo para la Feria (2 minutos)

1. **(0:00)** Abrir la app → mostrar pantalla de Login. *"Esta es la puerta de entrada a los datos médicos del paciente, protegida biométricamente."*
2. **(0:15)** Presionar la huella → entrar al Home. *"Sin contraseñas. La huella dactilar es la llave."*
3. **(0:25)** Mostrar el Health ID con el QR. *"Este es el DNI médico digital, verificado en la blockchain de Avalanche."*
4. **(0:45)** Ir a Fichas → solicitar turno. *"Antes, los pacientes hacían fila desde las 4 AM. Ahora lo hacen desde el celular."*
5. **(1:00)** Mostrar la ficha activa con QR. *"El hospital escanea este QR para confirmar la llegada."*
6. **(1:15)** Cambiar a la computadora (Web del hospital) → llamar siguiente turno → mostrar que el celular del paciente se actualiza en tiempo real. *"Tiempo real, sin recargar."*
7. **(1:45)** Cerrar con el historial clínico. *"Cada consulta, cada diagnóstico, firmado e inmutable en la blockchain."*
