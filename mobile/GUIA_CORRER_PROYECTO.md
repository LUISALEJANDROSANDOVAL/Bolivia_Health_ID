# 🚀 Guía Definitiva: Cómo Correr la App Móvil (Expo)

Esta guía es para todo el equipo de **Bolivia Health ID**. Sigan estos pasos al pie de la letra para evitar los clásicos errores de red, versiones incompatibles o "pantallas rojas de la muerte" al intentar ver la aplicación en sus celulares.

---

## 1. Requisitos Previos
Antes de tocar la terminal, asegúrense de tener esto listo:
1. **Node.js** instalado en la computadora.
2. **Aplicación "Expo Go"** instalada en su celular físico (desde Google Play Store o Apple App Store). 
   * *Nota importante:* El proyecto ha sido configurado para usar la versión pública oficial (**SDK 54**). Asegúrense de que su app de Expo Go esté actualizada a la última versión de la tienda.

---

## 2. Instalación del Proyecto
La primera vez que descarguen el proyecto (o hagan `git pull`), deben instalar las librerías:

1. Abran una terminal y entren a la carpeta `mobile`:
   ```bash
   cd mobile
   ```
2. Instalen las dependencias ejecutando:
   ```bash
   npm install
   ```

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
