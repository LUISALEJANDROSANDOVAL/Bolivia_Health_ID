# 🧪 Plan de Pruebas Manuales (Bolivia Health ID)

Este documento detalla las **5 pruebas críticas** que debes realizar en la aplicación móvil y en la base de datos de Supabase para validar que las funcionalidades de lógica y backend estén correctamente implementadas para la feria.

---

## 📱 Prueba 1: Autenticación e Inicialización de Caché
*   **Objetivo:** Verificar que el login determinista y el guardado de sesión inicialicen los datos correctamente.
*   **Pasos:**
    1. Abre la app móvil en tu celular mediante **Expo Go**.
    2. En la pantalla de login, presiona la cuenta rápida de **`Luis`**.
*   **Resultado Esperado:** 
    - La app realiza el inicio de sesión silencioso con Supabase Auth.
    - Navega inmediatamente a `HomeScreen`.
    - El saludo superior muestra el nombre real cargado en la tabla `profiles`: *"Luis Alejandro Sandoval"*.

---

## 🔌 Prueba 2: Resistencia al Internet de la Feria (Modo Offline)
*   **Objetivo:** Validar que el sistema de caché local (`AsyncStorage`) evite pantallas de carga infinitas o cierres inesperados si la red se corta.
*   **Pasos:**
    1. Con la sesión iniciada del paso anterior, cierra completamente la aplicación (remuévela de la lista de apps en segundo plano del celular).
    2. Activa el **Modo Avión** en tu dispositivo (desactiva Wi-Fi y datos móviles).
    3. Vuelve a abrir la aplicación.
*   **Resultado Esperado:**
    - La aplicación **no debe crashearse**.
    - La app carga y muestra los datos del panel principal leyendo la caché local offline (`@patient_profile_cache_0x4e475c...`).

---

## 📅 Prueba 3: Registro de Citas en Supabase
*   **Objetivo:** Verificar que el flujo de agendamiento inserte registros válidos en la base de datos respetando las restricciones de columna.
*   **Pasos:**
    1. Conecta tu celular a internet de nuevo.
    2. En la app, ve al flujo de reservar cita, selecciona un médico y presiona **"Confirmar Cita"**.
    3. Abre la consola de administración de **Supabase** en tu navegador, ingresa al visualizador de tablas y abre la tabla `appointments`.
*   **Resultado Esperado:**
    - Debe aparecer una nueva fila creada con:
        - `patient_id` apuntando al UUID de Luis.
        - `doctor_id` apuntando al UUID del médico seleccionado.
        - `appointment_date` con la fecha seleccionada en formato `YYYY-MM-DD`.
        - `appointment_time` con la hora en formato `HH:MM:SS`.
        - `status` en `'scheduled'`.

---

## ⚡ Prueba 4: Sincronización en Tiempo Real (Supabase Realtime)
*   **Objetivo:** Comprobar que la suscripción por WebSockets en `FichaActivaScreen` actualice la interfaz sin recargar.
*   **Pasos:**
    1. Mantén abierta la pantalla de **Ficha Activa** (el ticket virtual) en tu celular.
    2. En la consola web de Supabase, ubica la fila de la cita que acabas de crear en la tabla `appointments`.
    3. Cambia manualmente el valor de la columna **`status`** de `'scheduled'` a **`'in_progress'`** y guarda los cambios en Supabase.
*   **Resultado Esperado:**
    - El estado visual en tu celular cambia de inmediato a **"En Consulta"** en menos de 1 segundo de manera automática.

---

## 🚪 Prueba 5: Limpieza de Sesión al Salir
*   **Objetivo:** Garantizar que los datos del usuario se eliminen localmente al cerrar sesión.
*   **Pasos:**
    1. Presiona "Cerrar Sesión" en la barra de navegación o perfil.
*   **Resultado Esperado:**
    - La app limpia la clave `@current_patient_wallet` y la caché `@patient_profile_cache` de `AsyncStorage`.
    - Te redirige a la pantalla de login.
    - Si entras con otro usuario de prueba (ej: `David`), no se mostrarán datos residuales del usuario anterior.
