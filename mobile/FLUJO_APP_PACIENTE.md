# Flujo Completo de la Aplicación Móvil (Bolivia Health ID)

Este documento detalla el viaje del paciente a través de la aplicación móvil, explicando la arquitectura funcional y el propósito de cada una de las 8 pantallas que conforman el ecosistema del paciente.

> [!NOTE]
> **Contexto de Arquitectura**
> La aplicación móvil está diseñada **exclusivamente para el uso del paciente (ciudadano)**. Es su "billetera digital de salud". El personal médico y administrativo utilizará un portal web separado en sus computadoras de escritorio.

---

## 1. El Inicio y la Seguridad

### 📱 1. LoginScreen (Autenticación Segura)
El punto de entrada a la aplicación. Dado que se maneja información médica y llaves criptográficas de blockchain, la seguridad es primordial.
- **Flujo:** El paciente abre la app y se le pide autenticarse.
- **Acción del Usuario:** Usa la huella dactilar (Biometría nativa) o inicia sesión con su cuenta de Google.
- **Valor UX:** Elimina la necesidad de recordar contraseñas complejas, haciendo la app accesible para adultos mayores.

### 🏠 2. HomeScreen (El Centro de Control)
Una vez autenticado, el paciente llega a su "Dashboard" personal.
- **Flujo:** Es la pantalla central que conecta a todas las demás funcionalidades.
- **Elementos Clave:**
  - **Tarjeta de Identidad Rápida:** Muestra su nombre, cédula y el estado de "Verificado".
  - **Acción Rápida - Solicitar Ficha:** Un botón destacado para la acción más frecuente.
  - **Cita Activa:** Si el paciente ya sacó una ficha, aparece un banner recordando que está en la fila.
  - **Accesos Inferiores:** Botones para ir al Historial Clínico o a la sección de Privacidad.

---

## 2. El Flujo Principal: El Sistema de Fichas (Resolviendo el problema de las filas)

Este es el núcleo de la innovación móvil para resolver el problema de las filas físicas de madrugada en los hospitales bolivianos.

### 🏥 3. SolicitarFichaScreen (La Reserva a Distancia)
- **Flujo:** El paciente entra aquí desde el Home cuando necesita ir al médico hoy.
- **Acción del Usuario:** 
  1. Abre un menú desplegable y elige el **Hospital** (ej. Hospital de Clínicas) viendo el tiempo estimado de espera.
  2. Elige la **Especialidad** (ej. Cardiología) mediante una cuadrícula visual.
- **Resultado:** Al confirmar, la app reserva su lugar en la base de datos (Supabase) y lo lleva a la pantalla de espera.

### ⏱️ 4. FichaActivaScreen (La Sala de Espera Digital)
- **Flujo:** El paciente ya tiene su turno y ahora puede esperar desde su casa, el trabajo o el transporte público.
- **Elementos Clave:**
  - **Círculo Animado:** Muestra su número de turno (ej. #18).
  - **Tiempo Real:** Muestra a quién están atendiendo AHORA mismo (ej. #14).
  - **Barra de Progreso:** Indica visualmente cuánto falta para su turno y el tiempo estimado de espera en minutos.
- **Acción del Usuario:** Simplemente vigila la pantalla. Cuando es su turno, presiona el botón "Código QR de Admisión".

### 🎟️ 5. QRAdmisionScreen (La Llegada al Hospital)
- **Flujo:** El paciente llega físicamente al hospital.
- **Acción del Usuario:** Muestra la pantalla brillante con el Código QR gigante al recepcionista.
- **Resultado:** El hospital escanea el QR con su sistema web, lo que confirma que el paciente ya está presente físicamente para pasar al consultorio.

---

## 3. El Ecosistema Blockchain: Identidad y Privacidad

Una vez dentro del consultorio, el flujo cambia de "Logística" a "Intercambio de Información Médica Segura".

### 🆔 6. HealthIDScreen (El Carnet Médico Digital)
- **Flujo:** El paciente entra al consultorio médico. El doctor le pide sus antecedentes.
- **Acción del Usuario:** El paciente abre su "Health ID" desde el Home y le muestra un QR diferente al doctor.
- **Elementos Clave:**
  - Muestra una tarjeta premium tipo tarjeta de crédito azul oscuro.
  - Contiene el QR criptográfico y el **Wallet ID** (dirección de la billetera blockchain).
  - Muestra un resumen de registros inmutables.
- **Resultado:** El médico escanea el QR, lo que le da acceso temporal al historial clínico del paciente en su computadora.

### 📋 7. HistorialScreen (Mis Expedientes Clínicos)
- **Flujo:** El paciente está en su casa y quiere ver los resultados de laboratorio que se hizo ayer, o recordar qué pastilla le recetaron.
- **Elementos Clave:**
  - Lista completa de recetas, laboratorios e imágenes.
  - Barra de búsqueda y filtros (Chips) por categoría.
  - **El Sello Blockchain:** Cada registro muestra su "Hash" criptográfico, probando que el diagnóstico o receta no ha sido alterado desde que el médico lo emitió.

### 🔐 8. PermisosScreen (El Centro de Privacidad)
- **Flujo:** El paciente quiere gestionar quién tiene acceso a sus datos médicos, empoderándolo como el verdadero dueño de su información.
- **Acción del Usuario:** Puede autorizar (o revocar) el acceso a un doctor específico.
- **Elementos Clave:**
  - **Duración:** Puede otorgar acceso "Solo hoy", "Por 24 horas", o "Persistente".
  - **Granularidad:** Puede elegir compartir solo sus "Recetas" pero ocultar sus "Signos Vitales".
- **Valor Funcional:** Esto ejecuta un Smart Contract en la Blockchain que dicta las reglas de acceso a los datos almacenados en IPFS.
