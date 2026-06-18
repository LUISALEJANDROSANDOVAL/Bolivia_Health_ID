# 🚀 Guía de Configuración y Ejecución
## Bolivia Health ID — App Móvil

> Esta guía está escrita para cualquier miembro del equipo que quiera correr,
> modificar o generar el APK del proyecto desde cero en su computadora.

---

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener instalado lo siguiente en tu computadora:

| Herramienta | Versión mínima | Cómo verificar |
|---|---|---|
| **Node.js** | 18 o superior | `node --version` |
| **npm** | 9 o superior | `npm --version` |
| **Git** | Cualquiera | `git --version` |
| **VS Code** | Cualquiera | (recomendado) |

> [!NOTE]
> No necesitas Android Studio, Java ni ningún SDK de Android. Todo se compila en la nube gracias a EAS Build.

---

## 📦 Paso 1 — Clonar el Repositorio

Abre una terminal (PowerShell en Windows) y ejecuta:

```bash
git clone https://github.com/TU_USUARIO/Bolivia_Health_ID.git
cd Bolivia_Health_ID
```

---

## 📁 Paso 2 — Ir a la Carpeta Móvil

Todo el código de la app móvil vive en la carpeta `mobile/`. Entra a ella:

```bash
cd mobile
```

> [!IMPORTANT]
> **Todos los comandos de esta guía deben ejecutarse desde la carpeta `mobile/`.**
> No ejecutes `npm install` desde la raíz del proyecto, sino desde dentro de `mobile/`.

---

## 📥 Paso 3 — Instalar las Dependencias

Instala todas las librerías del proyecto:

```bash
npm install
```

Esto leerá el archivo `package.json` e instalará automáticamente todo lo necesario
(Expo, Supabase, Lucide Icons, biometría, etc.). Puede tardar entre 1 y 3 minutos.

---

## 🔑 Paso 4 — Configurar las Variables de Entorno

La app necesita conectarse a Supabase. Crea un archivo `.env` dentro de la carpeta `mobile/`:

```bash
# Crea el archivo .env (copia este contenido)
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_LLAVE_ANONIMA_AQUI
```

> [!TIP]
> Puedes encontrar estas credenciales en el panel de Supabase de Bolivia Health ID:
> **supabase.com → Tu Proyecto → Settings → API**
> Pídele al líder del equipo las credenciales si no las tienes.

---

## 👤 Paso 5 — Iniciar Sesión en Expo (Solo la primera vez)

Para poder compilar el APK, necesitas estar autenticado con la cuenta del equipo en Expo.

**5.1** — Instala la herramienta de compilación de Expo (si no la tienes):
```bash
npm install -g eas-cli
```

**5.2** — Inicia sesión. Se abrirá el navegador automáticamente:
```bash
eas login
```
Cuando el navegador se abra, inicia sesión con la cuenta del equipo en **expo.dev**.
Al terminar verás en la terminal: `Logged in as dantehse` ✅

> [!NOTE]
> Solo necesitas hacer este paso una vez. La sesión se guarda en tu computadora
> para futuros comandos.

---

## 🧪 Paso 6 — Probar la App en el Celular (Desarrollo)

Este paso sirve para ver cambios en tiempo real mientras programas.

**6.1** — Inicia el servidor de desarrollo:
```bash
npx expo start -c
```
*(El `-c` limpia el caché para evitar errores de configuraciones antiguas)*

**6.2** — En tu celular Android, abre la cámara y escanea el código QR que
aparece en la terminal.

> [!WARNING]
> Tu computadora y tu celular **DEBEN estar en la misma red Wi-Fi**.
> Si el celular usa datos móviles (4G/5G) y la computadora está en Wi-Fi,
> la conexión no funcionará.

**6.3** — La app se compilará y abrirá en tu celular en 30–60 segundos.

**¿Cómo ver cambios?**
Cada vez que guardes un archivo `.tsx`, la app se actualizará automáticamente
en tu celular en menos de 1 segundo. No es necesario volver a escanear el QR.

---

## 📱 Paso 7 — Generar el APK (Para instalar en cualquier Android)

Este es el proceso para crear el archivo `.apk` instalable, ideal para la feria.

**7.1** — Asegúrate de estar logueado en Expo (Paso 5).

**7.2** — Ejecuta el comando de compilación en la nube:
```bash
eas build -p android --profile preview
```

**7.3** — El proceso hará lo siguiente automáticamente:
- Subir tu código a los servidores de Expo.
- Compilar la app en la nube (tarda entre 10 y 20 minutos).
- Mostrarte un enlace de descarga y un código QR al terminar.

**7.4** — Al finalizar verás algo así en la terminal:
```
✅ Build finished

🤖 Open this link on your Android devices to install the app:
https://expo.dev/accounts/dantehse/projects/bolivia-health-id/builds/XXXXX
```

**7.5** — Abre ese enlace en el navegador de tu celular Android y descarga el APK.
Si Android pregunta si confías en la fuente, acepta la instalación.

---

## 🗂️ Estructura del Proyecto

```
mobile/
├── App.tsx                  # Punto de entrada principal de la app
├── app.json                 # Configuración de Expo (nombre, ícono, etc.)
├── eas.json                 # Configuración de compilación EAS
├── babel.config.js          # Configuración del compilador
├── assets/                  # Íconos y recursos gráficos
└── src/
    ├── screens/             # Pantallas de la app (Login, Home, Fichas...)
    ├── components/          # Componentes reutilizables (botones, tarjetas)
    ├── navigation/          # Configuración de navegación (Tab Bar, Stacks)
    ├── services/            # Conexión a Supabase y APIs externas
    ├── context/             # Estado global (sesión del usuario)
    ├── hooks/               # Funciones React personalizadas
    ├── constants/           # Colores, URLs y variables del proyecto
    └── types/               # Definiciones de TypeScript
```

---

## 🛠️ Comandos Útiles de Referencia Rápida

| Comando | ¿Para qué sirve? |
|---|---|
| `npm install` | Instalar/actualizar dependencias |
| `npx expo start -c` | Iniciar servidor de desarrollo (limpiando caché) |
| `eas login` | Iniciar sesión en Expo |
| `eas build -p android --profile preview` | Compilar APK en la nube |
| `eas build:list` | Ver el historial de builds anteriores |
| `npx expo prebuild --platform android` | Generar carpeta Android nativa (avanzado) |
| `Get-Process node \| Stop-Process -Force` | Matar procesos de Node atascados (Windows) |

---

## ❓ Problemas Frecuentes y Soluciones

### ❌ "Something went wrong" en Expo Go
**Causa:** El proyecto ya usa Bare Workflow (tiene carpeta `android/`).
**Solución:** Expo Go ya no es compatible. Usa el APK generado por EAS Build.

### ❌ El servidor se queda cargando infinitamente
**Causa:** El celular y la computadora no están en la misma red.
**Solución:** Conecta ambos al mismo Wi-Fi, luego corre `npx expo start -c`.

### ❌ "Cannot find module babel-preset-expo"
**Causa:** Falta una dependencia de desarrollo.
**Solución:** `npm install --save-dev babel-preset-expo`

### ❌ EAS Build falla con "ENOENT: icon.png"
**Causa:** La carpeta `assets/` está vacía o le falta el ícono.
**Solución:** Verifica que existan los archivos `assets/icon.png` y `assets/adaptive-icon.png`.

### ❌ Terminal bloqueada (no responde a Ctrl+C)
**Causa:** El proceso de Node se quedó colgado.
**Solución:** Abre una nueva terminal y ejecuta: `Get-Process node | Stop-Process -Force`

---

## 📞 Contacto del Equipo

| Rol | Responsable |
|---|---|
| Cuenta Expo / EAS | **dantehse** (expo.dev) |
| Proyecto Supabase | Consultar con el líder del equipo |
| Contratos Blockchain | Ver carpeta `/blockchain` en la raíz del proyecto |
