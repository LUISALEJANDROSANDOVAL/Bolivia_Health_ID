# 🏥 Análisis del Ecosistema: Citas (Web) vs Fichas (Móvil)

Has tocado uno de los puntos más críticos a nivel de diseño de producto. Si la página web está enfocada en "Citas" (agendar a futuro) y la aplicación móvil en "Fichas" (turnos en tiempo real para hoy), puede parecer que son aplicaciones de dos empresas distintas. 

A continuación, presento un análisis detallado para **unificar ambos conceptos** y crear un sistema 100% coherente que tenga todo el sentido del mundo para los pacientes, médicos y el jurado.

---

## 1. El Modelo Híbrido (La Solución)

No tienes que eliminar las Citas de la Web ni las Fichas de la Móvil. Los hospitales modernos de primer nivel utilizan un **Modelo Híbrido**. 

Nuestra narrativa para el proyecto será la siguiente:
> *"Bolivia Health ID resuelve las dos necesidades principales del paciente: la atención planificada y la atención urgente del día".*

### 💻 El Rol de la Plataforma Web: "Atención Planificada" (Citas)
* **Caso de uso:** Valeria necesita un chequeo general o una revisión de rutina el próximo mes.
* **Comportamiento:** Entra a la web desde su computadora, busca especialidad, elige un día en el calendario (ej. 15 de Octubre a las 10:00 AM) y reserva su Cita.
* **Tecnología:** Base de datos tradicional (CRUD). El tiempo no es un factor crítico.

### 📱 El Rol de la Aplicación Móvil: "Atención del Día" (Fichas/Filas virtuales)
* **Caso de uso:** Valeria despierta con fiebre altísima y necesita ir al médico **hoy mismo**. No puede esperar a agendar una cita para el próximo mes.
* **Comportamiento:** Desde su cama, abre la app en su celular, solicita una **Ficha** para el día de hoy, y la app le avisa en tiempo real cuántas personas faltan para que sea su turno. Solo viaja al hospital cuando es su momento.
* **Tecnología:** Supabase Realtime (WebSockets) y notificaciones Push.

---

## 2. Puntos de Coherencia a Tomar en Cuenta

Para que la web y la móvil se sientan como "hermanas" del mismo ecosistema, debemos unificar los siguientes detalles técnicos y visuales:

### A. Lenguaje y Copywriting
Debemos estandarizar cómo llamamos a las cosas para no confundir.
* En la Web diremos: **"Agendar Cita Médica"** (Implica futuro).
* En la Móvil diremos: **"Solicitar Ficha de Hoy"** o **"Fila Virtual"** (Implica inmediatez).
* En ambas plataformas: Evitar la palabra "Reserva" sin especificar si es cita o ficha.

### B. Coherencia en la Base de Datos (Backend)
En la base de datos (Supabase), la tabla de `consultas` o `atenciones` debe tener un campo que diferencie cómo llegó el paciente:

```sql
-- Ejemplo de estructura para el Backend
CREATE TABLE atencion_medica (
  id UUID PRIMARY KEY,
  paciente_id UUID,
  medico_id UUID,
  tipo_atencion VARCHAR, -- Puede ser 'CITA_PROGRAMADA' o 'FICHA_DEL_DIA'
  fecha DATE,
  hora_estimada TIME,
  estado VARCHAR -- 'ESPERA', 'EN_CONSULTORIO', 'FINALIZADA'
);
```
Cuando el médico abre su sistema en el hospital, verá su lista de pacientes de hoy mezclada de manera inteligente:
1. Valeria (Llegó por Cita Web a las 10:00 AM)
2. Carlos (Llegó por Ficha Móvil - Turno 1)
3. Ana (Llegó por Ficha Móvil - Turno 2)

### C. La Pantalla "Home" debe conectar ambos mundos
En el Home de la aplicación móvil que programamos, podríamos agregar más adelante una sección pequeña que diga: *"Tus Citas Programadas"* justo debajo de la tarjeta azul brillante de *"Ficha Activa de Hoy"*. Así, el celular se convierte en el centro de control total.

---

## 3. ¿Qué ajustes requerimos en nuestro MVP Móvil actual?

Lo que hemos construido hasta ahora en la aplicación móvil **ya está perfectamente adaptado para este modelo híbrido**. 

* Las pantallas se llaman `SolicitarFicha` y no `AgendarCita`.
* El subtítulo dice claramente *"Turno digital para hoy"*.
* La pantalla `FichaActiva` muestra un número en tiempo real (ej. Turno 18) en lugar de una fecha en el calendario.

### Recomendación para la Feria / Hackathon:
Si el jurado pregunta por qué la web hace Citas y el móvil Fichas, la respuesta ganadora es:
> *"Aplicamos el principio de contexto de uso UX. Cuando un paciente agenda a futuro, suele usar una computadora (Web) para ver calendarios. Pero cuando hay una emergencia en el mismo día, no prende su laptop; agarra su celular (Móvil) para sacar una ficha instantánea y monitorear la fila desde su cama, eliminando así las aglomeraciones físicas."*
