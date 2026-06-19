# 📝 Bitácora Técnica de Configuración: La "Guerra" contra Expo y Windows

Esta es la bitácora exacta de todo el trabajo técnico de configuración profunda que tuvimos que hacer para levantar el entorno móvil de **Bolivia Health ID** en entornos Windows con bloqueos de red. Compártela con el equipo para que entiendan por qué se tomaron estas decisiones de arquitectura y cómo resolver los problemas de entorno de desarrollo paso a paso.

---

## 🔍 Fase 1: El Bloqueo del Firewall (El inicio del problema)
Todo empezó cuando intentamos correr `npx expo start`. El celular marcaba continuamente el error **"Something went wrong"** o **"Failed to download remote update"**.

* **El Diagnóstico:** La computadora y el celular no se podían comunicar directamente por la red local (LAN) porque el Firewall de Windows (o la configuración de red del router/cable de red) estaba bloqueando el puerto de desarrollo `8081`.
* **Nuestra decisión:** Tuvimos que abandonar la conexión local estándar (LAN) y decidir enrutar todo el código de la app a través de servidores externos seguros en la nube usando un **Túnel** (`--tunnel`).

---

## 🔌 Fase 2: El colapso de Ngrok
Al intentar correr `npx expo start --tunnel`, el sistema de Expo colapsó porque el entorno local no tenía instalada o accesible la herramienta que crea los túneles seguros (`ngrok`).

* **El Intento Fallido:** Intentamos instalarla de forma global en la computadora con `npm install -g @expo/ngrok`. Esto falló porque Windows y la variable de entorno `PATH` del sistema no reconocían el comando global debido a restricciones de permisos del sistema operativo.
* **Nuestra Solución (Ingeniería Pura):** En lugar de pelearnos con los permisos del sistema operativo de Windows, inyectamos la herramienta directamente como dependencia de desarrollo dentro de tu proyecto móvil ejecutando:
  ```bash
  npm install @expo/ngrok --save-dev
  ```
  en la carpeta `mobile`. De esta manera, Expo ya no dependía de las variables de entorno globales de Windows, sino de las librerías locales de tu propio código.

---

## ⚔️ Fase 3: La Guerra de Versiones (SDK Incompatible)
Una vez que el túnel de internet funcionó, logramos que el celular descargara la aplicación. ¡Pero nos estrellamos con una pantalla roja gigante! El error decía: **"This project requires a newer version of Expo Go"**.

* **El Problema:** El código fuente inicial del proyecto estaba usando una versión desactualizada o inestable de React Native que chocaba con la versión moderna de la app Expo Go que está publicada en la tienda de aplicaciones.
* **La Solución:** Intervenimos los archivos de configuración centrales (`package.json`). Sincronizamos y forzamos la actualización del proyecto a la **SDK 54** oficial de Expo para que fuera 100% compatible con la versión pública de la tienda (Play Store / App Store), nivelando todas las dependencias del proyecto (`react-native`, `expo-status-bar`, etc.) mediante una instalación limpia.

---

## 🧹 Fase 4: Archivos Basura y el Error `ENOENT`
Con la versión correcta y el túnel de red abierto, intentamos correr de nuevo el servidor, pero la terminal arrojó un error interno del empaquetador Metro Bundler (`ENOENT` o `Watcher Error`).

* **El Problema:** Al haber actualizado tantas librerías y haber cambiado el tipo de conexión de LAN a Túnel, el compilador interno de React Native se quedó con archivos "basura" y rutas rotas guardadas en su memoria caché temporal.
* **La Solución Definitiva:** Detuvimos todos los procesos de Node.js activos y ejecutamos el **"Comando Limpiador de Expo"**:
  ```bash
  npx expo start -c --tunnel
  ```
  La bandera `-c` (clear) borró todo el caché corrupto del servidor y la bandera `--tunnel` levantó la conexión segura a internet de inmediato.

---

## 💡 Conclusión y Pasos para el resto del equipo:
Para que cualquier otro desarrollador del equipo corra la aplicación en su computadora sin sufrir por problemas de firewall o configuraciones en Windows, solo debe seguir estos dos pasos:

1. **Instalar las dependencias locales:**
   ```bash
   cd mobile
   npm install
   ```
2. **Correr el servidor limpiando la caché con túnel:**
   ```bash
   npx expo start -c --tunnel
   ```

---
*¡Entorno de desarrollo configurado y listo para programar!* 💻🚀
