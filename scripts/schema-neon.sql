-- ============================================================================
-- Switch&Tech — Esquema de base de datos para Neon (Postgres serverless)
--
-- Ejecutar en el SQL Editor de Neon o con:
--   npx tsx scripts/migrate-neon.ts --schema
--
-- Replica los modelos de src/lib/models/ (fuente de verdad).
-- Idempotente: seguro de re-ejecutar (CREATE TABLE IF NOT EXISTS).
-- ============================================================================

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
  image       TEXT,                             -- imagen legado (opcional)
  category    TEXT NOT NULL CHECK (category IN ('fundas', 'cargadores', 'termos', 'personalizados')),
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  colors      JSONB NOT NULL DEFAULT '[]',
  tags        JSONB,
  stock       INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Órdenes (src/lib/models/order.ts)
CREATE TABLE IF NOT EXISTS orders (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT REFERENCES users(id) ON DELETE SET NULL,
  items                JSONB NOT NULL,          -- [{productId, name, price, quantity, color}]
  shipping             JSONB NOT NULL,          -- {name, email, phone, address, city, state, zip, notes}
  total                NUMERIC(12, 2) NOT NULL, -- validado en servidor contra catálogo
  discount             NUMERIC(12, 2),          -- descuento por cupón (COP)
  promo_id             TEXT,                    -- cupón aplicado
  payment_method       TEXT CHECK (payment_method IN ('card', 'pse')),
  mp_payment_id        TEXT,
  mp_preference_id     TEXT,
  payer_identification JSONB,                   -- ⚠️ dato sensible: cifrar en reposo
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contactos (src/lib/models/contact.ts)
CREATE TABLE IF NOT EXISTS contacts (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,    -- leído en panel admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suscriptores del newsletter (src/lib/models/subscriber.ts)
CREATE TABLE IF NOT EXISTS subscribers (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  consent_at    TIMESTAMPTZ,                    -- Ley 1581: consentimiento explícito
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cupones de descuento (src/lib/models/promo.ts)
CREATE TABLE IF NOT EXISTS promos (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,             -- normalizado en MAYÚSCULAS
  type        TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value       NUMERIC(12, 2) NOT NULL,
  min_order   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  usage_limit INTEGER,
  used_count  INTEGER NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuración global de la tienda (src/lib/models/settings.ts)
-- Documento único (id fijo = 1) con todo el objeto Settings en JSONB.
CREATE TABLE IF NOT EXISTS app_settings (
  id   INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_orders_user_id       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user  ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_promos_active        ON promos(active);
