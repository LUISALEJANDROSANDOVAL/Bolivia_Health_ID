# 🚀 Guía Definitiva: Cómo Correr la App Móvil (Expo)

Esta guía es para todo el equipo de **Bolivia Health ID**. Sigan estos pasos al pie de la letra para evitar los clásicos errores de red, versiones incompatibles o "pantallas rojas de la muerte" al intentar ver la aplicación en sus celulares.

---

## 1. Requisitos Previos
Antes de tocar la terminal, asegúrense de tener esto listo:
1. **Node.js** instalado en la computadora.
2. **Aplicación "Expo Go"** instalada en su celular físico (desde Google Play Store o Apple App Store). 
   * *Nota importante:* El proyecto ha sido configurado para usar la versión pública oficial (**SDK 54**). Asegúrense de que su app de Expo Go esté actualizada a la última versión de la tienda.

---

## 2. Instalación del Proyecto y Dependencias

Para instalar todas las dependencias necesarias de la aplicación, abre una terminal en la raíz de tu proyecto y ejecuta:

```bash
# 1. Entrar a la carpeta mobile
cd mobile

# 2. Instalar todas las dependencias y librerías del proyecto
npm install
```

### 📦 ¿Qué dependencias se instalarán en tu entorno?

Al correr `npm install`, se descargarán automáticamente todas las dependencias configuradas en el archivo `package.json`. A continuación, se detalla qué hace cada una:

#### 🔹 Core y Configuración de Expo
* **`expo` (~54.0.0)**: El framework base de desarrollo híbrido.
* **`react` (19.1.0) & `react-native` (0.81.5)**: Los motores principales de la app.
* **`typescript`**: Soporte completo para tipado seguro en la app.

#### 🔹 Navegación entre Pantallas
* **`@react-navigation/native` & `@react-navigation/native-stack`**: Permite la navegación básica y el historial de pantallas (ej. ir del Login a la pantalla de Inicio).
* **`@react-navigation/bottom-tabs`**: Añade la barra de navegación inferior (pestañas) para cambiar rápidamente de sección.
* **`react-native-screens` & `react-native-safe-area-context`**: Optimizan el rendimiento de las pantallas y aseguran que el contenido no quede debajo del "notch" o barra de estado del celular.

#### 🔹 Base de Datos y Backend
* **`@supabase/supabase-js`**: Cliente oficial para conectarse a Supabase (autenticación de pacientes, consulta de registros de salud y fichas).
* **`@react-native-async-storage/async-storage`**: Almacenamiento local persistente para recordar la sesión iniciada del paciente en el dispositivo.
* **`react-native-url-polyfill`**: Polyfill necesario para que el cliente de Supabase funcione correctamente en entornos móviles.

#### 🔹 Autenticación Biométrica y Seguridad
* **`expo-local-authentication`**: Librería que permite validar la identidad del paciente mediante la huella dactilar o reconocimiento facial (FaceID) del dispositivo de forma segura.

#### 🔹 Diseño Visual, Iconografía y Animaciones
* **`nativewind` & `tailwindcss`**: Permite usar clases estilizadas de Tailwind CSS directamente en los componentes nativos de la aplicación.
* **`lucide-react-native`**: Colección de íconos vectoriales modernos y ligeros (como estetoscopios, códigos QR, llaves, etc.).
* **`react-native-reanimated` & `react-native-svg`**: Soporte para animaciones avanzadas de alto rendimiento y renderizado de gráficos vectoriales (SVG).

#### 🔹 Herramientas de Desarrollo
* **`@expo/ngrok`**: Paquete para generar el túnel seguro y compartir tu servidor local con tu celular conectado a redes distintas.

---


## 3. Ejecutar la Aplicación (Paso a Paso)

Existen diferentes formas de correr el proyecto dependiendo de cómo estén conectados a internet. Elijan la que corresponda a su situación:

### 🌐 Escenario A: Solo quiero ver el diseño en mi PC (Rápido y Fácil)
Si no quieres usar el celular y solo necesitas probar que la navegación funciona:
1. Ejecuta: `npx expo start`
2. Cuando cargue el código QR en la terminal, presiona la tecla **`w`** (minúscula).
3. Se abrirá la app simulada en el navegador web de tu computadora. (Tip: Presiona F12 y activa la vista de celular para que se vea real).

### 📱 Escenario B: Uso WiFi en mi PC y WiFi en mi celular
Si tu computadora y tu celular están conectados exactamente a la misma red WiFi:
1. Ejecuta: `npx expo start -c` *(La `-c` limpia la caché vieja)*
2. Escanea el código QR que aparece en la pantalla con la cámara de tu celular (o con la app Expo Go en Android).

### 🔌 Escenario C: Mi PC usa Cable Ethernet (LAN) o un WiFi distinto
**¡ALERTA!** Si tu PC está por cable y tu celular por WiFi, el Firewall de Windows bloqueará la conexión y verás un error que dice *"Something went wrong"*. 
**Solución: Usar un Túnel.**
1. Ejecuta el servidor forzando una conexión por internet:
   ```bash
   npx expo start -c --tunnel
   ```
2. Escanea el nuevo código QR. El celular descargará la app desde internet saltándose el Firewall.

---

## 4. 🚨 Solución a Errores Comunes (Troubleshooting)

Si algo sale mal, no entren en pánico. Aquí están las soluciones a los 3 errores más comunes que van a enfrentar:

**Error 1: "Something went wrong" (No conecta)**
* **Causa:** El Firewall de Windows bloqueó a Expo porque estás usando Cable de Red o un WiFi público.
* **Solución:** Cancela con `Ctrl+C` y vuelve a correr con `npx expo start --tunnel`.

**Error 2: "This project requires a newer version of Expo Go"**
* **Causa:** Tu celular tiene una versión vieja de la app Expo Go.
* **Solución:** Ve a la Play Store/App Store y actualiza Expo Go. Nuestro proyecto está fijado para funcionar perfectamente con la versión pública.

**Error 3: Pantalla roja gigante que dice "Sorry about that" o error `ENOENT` en la terminal**
* **Causa:** React Native se quedó con archivos "basura" en la memoria caché o instalaste una librería nueva (como íconos) y no refrescaste.
* **Solución:** En tu terminal, presiona `Ctrl+C` para matar el proceso. Luego ejecuta:
  ```bash
  npx expo start -c --tunnel
  ```
  La bandera `-c` (clear) borra la basura y reescribe el código desde cero. Si el celular se queda pegado en "Updating...", ve a la terminal y presiona la letra **`r`** para forzar un reinicio del celular.

---
*Fin de la guía. ¡A programar!* 💻
