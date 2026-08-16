# 🐘 Base de Datos — Neon (Postgres serverless)

Instructivo para crear y configurar la base de datos de **Switch&Tech** en **Neon**, el reemplazo recomendado para `lowdb` (archivo JSON efímero en Vercel).

> ⚠️ **Por qué migrar**: Vercel ejecuta cada request en una instancia serverless efímera. El archivo `data/db.json` se crea y destruye con cada invocación — los datos se pierden. Neon es Postgres serverless con tier gratuito, sin pausas por inactividad (duerme sola y despierta sola) e integración nativa con Vercel.

---

## 📊 Plan gratuito de Neon (Free)

| Recurso | Límite |
|---|---|
| Almacenamiento | **0.5 GB** por proyecto |
| Compute | **100 CU-horas / mes** por proyecto |
| Proyectos | 10 (gratis) |
| Pausa por inactividad | ❌ No — escala a cero (~5 min sin uso) y despierta sola (~500 ms) |
| Tarjeta de crédito | No requerida |

Para una tienda pequeña/mediana, el free tier alcanza de sobra. Si algún día lo superas, el siguiente plan escala gradualmente (no hay salto brusco a $25/mes como en Supabase).

---

## 🧱 Paso 1: Crear cuenta y proyecto

1. Ir a [console.neon.tech](https://console.neon.tech) y registrarte (puedes usar GitHub o Google).
2. Click en **"Create a project"**.
3. Configurar:
   - **Name**: `switch-and-tech` (o el que prefieras).
   - **Database name**: `switchandtech` (por defecto `neondb` — cámbialo a este para claridad).
   - **Region**: elegir la más cercana a tus clientes. Tu `vercel.json` despliega en `gru1` (São Paulo, Brasil) — puedes elegir `sa-east-1` (São Paulo) para reducir latencia. O `us-east-1` si prefieres EE.UU.
   - **Plan**: **Free**.
4. Click en **"Create project"**.

---

## 🔑 Paso 2: Obtener el connection string

1. En el dashboard del proyecto, ir a **"Connect"** (botón azul arriba a la derecha).
2. Se muestra el connection string con formato:

   ```
   postgresql://[usuario]:[password]@ep-xxxxx.sa-east-1.aws.neon.tech/switchandtech?sslmode=require
   ```

3. **Importante — para serverless (Vercel) usa la conexión *pooled***:
   - En el panel "Connect", activar la opción **"Connection pooling"** (Usar PgBouncer).
   - El hostname cambia a `ep-xxxxx-xxxxxxxx-pooler.sa-east-1.aws.neon.tech`.
   - La conexión pooled soporta muchas conexiones concurrentes sin agotar el límite — lo que necesitas en serverless.

4. Copiar la URL completa (incluye usuario y password). **Guárdala en un lugar seguro — es tu credencial de acceso.**

> 🔐 La password aparece solo una vez al crear el proyecto; si la pierdes, puedes regenerarla en **Settings → Connection details**.

---

## 📝 Paso 3: Crear el esquema (tablas)

Abre la consola SQL de Neon (**"SQL Editor"** en el dashboard) y ejecuta el siguiente script, que replica exactamente los modelos actuales de la app (`src/lib/models/`):

```sql
-- Usuarios (src/lib/models/user.ts)
CREATE TABLE IF NOT EXISTS users (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  password              TEXT NOT NULL,          -- hash bcrypt, NUNCA texto plano
  is_admin              BOOLEAN NOT NULL DEFAULT FALSE,
  consent_at            TIMESTAMPTZ,            -- Ley 1581: aceptación de política
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  lockout_until         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens (sesiones activas, SOLO el hash)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hash       TEXT NOT NULL UNIQUE,
  kind       TEXT NOT NULL CHECK (kind IN ('user', 'admin')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productos (src/lib/models/product.ts)
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price       NUMERIC(12, 2) NOT NULL,          -- pesos COP
  sale_price  NUMERIC(12, 2),
  images      JSONB NOT NULL DEFAULT '[]',
  category    TEXT NOT NULL CHECK (category IN ('fundas', 'cargadores', 'termos', 'personalizados')),
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  colors      JSONB NOT NULL DEFAULT '[]',
  tags        JSONB NOT NULL DEFAULT '[]',
  stock       INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Órdenes (src/lib/models/order.ts)
CREATE TABLE IF NOT EXISTS orders (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT REFERENCES users(id) ON DELETE SET NULL,
  items               JSONB NOT NULL,           -- [{productId, name, price, quantity, color}]
  shipping            JSONB NOT NULL,           -- {name, email, phone, address, city, state, zip, notes}
  total               NUMERIC(12, 2) NOT NULL,  -- validado en servidor contra catálogo
  payment_method      TEXT CHECK (payment_method IN ('card', 'pse')),
  mp_payment_id       TEXT,
  mp_preference_id    TEXT,
  payer_identification JSONB,                   -- ⚠️ dato sensible: cifrar en reposo
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contactos (src/lib/models/contact.ts)
CREATE TABLE IF NOT EXISTS contacts (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suscriptores del newsletter (src/lib/models/subscriber.ts)
CREATE TABLE IF NOT EXISTS subscribers (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  consent_at    TIMESTAMPTZ NOT NULL,           -- Ley 1581: consentimiento explícito
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
```

> 💡 Nota sobre tipos: los arrays/objetos del modelo (items, shipping, imágenes, colores, tags) se guardan como **JSONB** — es la migración más directa desde el modelo JSON de lowdb. Si más adelante quieres modelarlos como tablas relacionales, se puede refinar.

---

## 🧪 Paso 4: Probar la conexión (local)

1. Copiar `.env.example` a `.env.local` y agregar la variable:

   ```bash
   DATABASE_URL=postgresql://[usuario]:[password]@ep-xxxxx-xxxxxxxx-pooler.sa-east-1.aws.neon.tech/switchandtech?sslmode=require
   ```

2. Probar la conexión con Node (desde la raíz del proyecto):

   ```bash
   node -e "
   const { neon } = require('@neondatabase/serverless');
   const sql = neon(process.env.DATABASE_URL);
   sql('SELECT 1').then(r => console.log('✅ Conexión OK:', r));
   "
   ```

   > Requiere instalar el driver: `npm install @neondatabase/serverless` (paso que se hará al implementar el driver de Postgres en el proyecto).

3. Si responde `✅ Conexión OK`, la base está lista.

---

## 🚀 Paso 5: Configurar en Vercel

1. Ir a [vercel.com](https://vercel.com) → tu proyecto → **"Settings" → "Environment Variables"**.
2. Agregar:

   | Variable | Valor | Entornos |
   |---|---|---|
   | `DATABASE_URL` | Tu connection string pooled | Production, Preview |
   | `STORE_DRIVER` | `postgres` *(cuando el driver esté implementado)* | Production |

3. Click en **"Save"** y hacer **"Redeploy"** en el último deploy exitoso.

> ⚠️ **No** pongas `DATABASE_URL` en `NEXT_PUBLIC_*` — es un secreto de servidor. Solo se lee desde rutas API / server components, nunca desde el cliente.

---

## 🔐 Paso 6: Seguridad de la base

- **Credenciales**: `DATABASE_URL` solo en variables de entorno. Nunca commiteada (`.env*` ya está en `.gitignore`).
- **Queries**: todo con prepared statements / queries parametrizadas (el driver `@neondatabase/serverless` las usa por diseño). Nunca concatenar input de usuario en SQL.
- **Permisos mínimos**: para producción, crear un rol de lectura/escritura limitado (sin `DROP`, `ALTER`, ni acceso a otras bases) en vez de usar el rol owner:
  ```sql
  CREATE ROLE app_user LOGIN PASSWORD 'contraseña_fuerte';
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
  -- (re-ejecutar GRANT tras cada migración de esquema)
  ```
- **Datos sensibles**: `shipping` (dirección, teléfono) y `payer_identification` (cédula/NIT) deben **cifrarse en reposo** a nivel de aplicación (pendiente de implementar — prioridad 6 de `SEGURIDAD.md`). Neon también ofrece cifrado TLS en tránsito por defecto (`sslmode=require`).
- **Backup**: Neon hace backups automáticos (PITR) incluso en free tier.

---

## 🏭 Paso 7: Pasar a producción (propiedad y traspaso)

> ⚠️ **Punto clave**: la base de datos le pertenece a la **cuenta Neon que la creó** (tu email, tu login y, si se paga, tu tarjeta). Si la web no es tuya, en producción **la base tampoco debe ser tuya** — debe estar bajo la cuenta del dueño de la tienda, para que él sea el dueño (y responsable legal) de sus datos, pague la factura y controle el acceso.

### Qué cambia al pasar a producción

| Aspecto | Desarrollo (ahora) | Producción |
|---|---|---|
| **Cuenta dueña** | Tuya (tú creaste el proyecto) | **Del cliente** — su cuenta de Neon, su billing |
| **Plan** | Free: 0.5 GB, 100 CU-h/mes | **Launch** (~usage-based): $0.106/CU-h, $0.35/GB-mes → tienda pequeña ≈ **$5–15/mes** |
| **Credenciales** | `DATABASE_URL` de tu proyecto dev | `DATABASE_URL` **nuevo** del proyecto del cliente |
| **Región** | La que elegiste | Cerca de los clientes finales (`sa-east-1` São Paulo, coincide con `gru1`) |
| **Entorno en Vercel** | Preview/Development | **Solo Production** (Preview puede seguir con tu DB de dev) |
| **Código** | — | **No cambia nada**: mismo driver, misma variable `DATABASE_URL`, solo cambia el valor |

### Opción A — Transferir el proyecto dentro de Neon (la más limpia)

Neon permite mover un proyecto entre cuentas/organizaciones:

1. En el dashboard del proyecto → **Settings → Transfer**.
2. Elegir la organización/account de destino (la del cliente).
3. El cliente acepta la transferencia desde su cuenta y queda como dueño.

> ⚠️ **Limitación**: la transferencia **no funciona para proyectos creados desde la integración de Vercel** (los "Vercel-managed" no se pueden transferir). Por eso conviene crear el proyecto directamente en [console.neon.tech](https://console.neon.tech), **no** desde el marketplace de Vercel.

### Opción B — Proyecto nuevo bajo la cuenta del cliente (recomendada para entrega)

La más segura y la que más control da al cliente:

1. El cliente crea su cuenta en [console.neon.tech](https://console.neon.tech) (su email, su tarjeta).
2. Tú (o él) crean el proyecto de producción ahí y ejecutan el esquema del **Paso 3**.
3. Migrar los datos del proyecto de dev al de producción:
   ```bash
   # Exportar desde tu proyecto dev
   pg_dump "$DATABASE_URL_DEV" --no-owner --no-acl > dump.sql
   # Importar en el proyecto de producción del cliente
   psql "$DATABASE_URL_PROD" < dump.sql
   ```
   > Alternativa sin CLI: usar el **Import Data Assistant** de Neon, que copia datos de otro proyecto Neon automáticamente.
4. En Vercel, cambiar el valor de `DATABASE_URL` del entorno **Production** al connection string del proyecto del cliente, y hacer redeploy.

Al terminar, el cliente tiene: **su cuenta, su DB, su factura y su acceso** — y tú solo si él te lo da. El código no se toca.

### Lista de entrega al cliente

- Acceso a su cuenta Neon (credenciales / membresía).
- Este documento y el esquema ejecutado.
- Cómo ver los datos y generar backups (Neon los hace automáticos, PITR).
- `DATABASE_URL` de producción configurado en Vercel (entorno Production únicamente).
- Contacto de soporte para futuras consultas.

---

## 🛠️ Comandos útiles

```bash
# Instalar el driver serverless de Neon (cuando se implemente el driver)
npm install @neondatabase/serverless

# Probar conexión
node -e "const {neon}=require('@neondatabase/serverless');const sql=neon(process.env.DATABASE_URL);sql('SELECT NOW()').then(r=>console.log('✅',r))"

# CLI de Neon (opcional)
npm i -g neonctl
neonctl auth login
neonctl connection-string --project-id switch-and-tech --pooled
```

---

## ❓ Troubleshooting

| Problema | Solución |
|---|---|
| `timeout expired` en Vercel | Usar la URL **pooled** (hostname con `-pooler`) — las conexiones directas se agotan en serverless |
| Primera request lenta | Normal: el compute escala de cero (~500 ms de cold start). Las siguientes son rápidas |
| `no pg_hba.conf entry` | Verificar que el usuario/password del connection string son correctos y que el host es el de TU proyecto |
| Datos no persisten | Verificar que `STORE_DRIVER` apunta al driver de Postgres (no `lowdb`/`memory`) |
| Consumo de CU-horas | 100 CU-h/mes ≈ 100 horas de compute activo. Con scale-to-zero, una tienda pequeña usa una fracción mínima |

---

## 📌 Siguientes pasos en el código

Este instructivo crea y configura la base. La integración en el código requiere:

1. Instalar `@neondatabase/serverless`.
2. Implementar un nuevo driver de store (`src/lib/store/postgres-store.ts`) que implemente la interfaz `DataStore` (ya definida en `src/lib/store/types.ts`) usando SQL.
3. Conectar el driver en `src/lib/store/index.ts` según `STORE_DRIVER=postgres`.
4. Script de seed para migrar los datos actuales de `data/db.json` a las tablas.
5. Ejecutar el esquema del Paso 3 en producción.

¿Quieres que implemente el driver de Postgres en el proyecto?
