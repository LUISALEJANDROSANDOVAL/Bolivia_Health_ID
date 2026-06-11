# Bolivia Health ID - Backend

Este directorio contiene los componentes y scripts del backend de la plataforma **Bolivia Health ID**, principalmente enfocados en la base de datos relacional (Supabase/PostgreSQL) y herramientas de utilidad para desarrolladores.

## Estructura del Directorio

```text
backend/
├── supabase/
│   └── migrations.sql      # Esquema de base de datos y políticas de seguridad
├── scripts/
│   ├── test_supabase.js    # Script para probar la conexión con Supabase
│   ├── get_schema.mjs      # Consulta el esquema de la base de datos
│   ├── guess_table.mjs     # Escanea y verifica tablas existentes
│   └── query_wallet.mjs    # Consulta los expedientes médicos a partir de una wallet
├── scratch/
│   ├── check_data.mjs      # Verifica perfiles y citas creadas
│   ├── check_db.mjs        # Muestra campos de tablas clave
│   └── debug_verification.mjs # Depura la verificación de identidad (Mock SEGIP)
└── package.json            # Gestión de dependencias y scripts de ejecución
```

## Configuración y Dependencias

Para instalar las dependencias locales del backend, ejecute desde la raíz o dentro de esta carpeta:

```bash
npm install
```

o si utiliza el package manager de la raíz:

```bash
cd backend
npm install
```

## Scripts Disponibles

En `backend/package.json` se han configurado los siguientes atajos:

- **Probar la conexión a la base de datos:**
  ```bash
  npm run test-db
  ```
- **Obtener el esquema API de Supabase:**
  ```bash
  npm run get-schema
  ```
- **Escanear tablas existentes:**
  ```bash
  npm run guess-table
  ```
- **Consultar datos clínicos de una billetera:**
  ```bash
  npm run query-wallet <DIRECCION_DE_WALLET>
  ```
