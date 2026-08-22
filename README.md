# Switch&Tech

Tienda e-commerce de accesorios (fundas, cargadores y termos) construida con Next.js App Router. Pagos con MercadoPago (tarjeta y PSE, Colombia), panel de administración completo y cumplimiento Ley 1581 (tratamiento de datos).

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **Estilos:** Tailwind CSS v4
- **Datos:** Neon Postgres (`@neondatabase/serverless`), lowdb (JSON local) o memoria — seleccionables con `STORE_DRIVER`
- **Validación:** zod
- **Auth:** JWT cortos (`jose`) + refresh tokens rotativos hasheados (bcryptjs)
- **Pagos:** MercadoPago Checkout Pro con webhook firmado (HMAC)
- **Imágenes:** Vercel Blob (producción) / `public/` (desarrollo)
- **Tests:** Vitest + Testing Library

## Requisitos

- Node.js 20 o 22
- Una base de datos (opcional según driver)

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa los valores
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El admin se crea automáticamente al primer acceso a `/admin` con las credenciales de `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

### Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `STORE_DRIVER` | No | `lowdb` (default), `memory` o `postgres` |
| `DATABASE_URL` | Solo con postgres | Cadena de conexión Neon (endpoint **pooled**) |
| `JWT_SECRET` | Sí en producción | Mínimo 32 caracteres; sin él la app no arranca en prod |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Sí en producción | Credenciales del administrador |
| `MP_ACCESS_TOKEN` | Para pagos reales | Sin él, el checkout corre en modo simulado |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | No | Determina modo test vs producción |
| `MP_WEBHOOK_SECRET` | Sí en producción | Verificación HMAC del webhook de MercadoPago |
| `UPSTASH_REDIS_REST_URL/TOKEN` | No | Rate limiting distribuido entre instancias |
| `BLOB_READ_WRITE_TOKEN` | Sí en producción | Persistencia de imágenes subidas (Vercel Blob) |

## Scripts

```bash
npm run dev          # desarrollo (Turbopack)
npm run build        # build de producción
npm test             # suite completa (vitest)
npm run lint         # eslint

npm run db:schema    # crea/actualiza el esquema en Neon
npm run db:migrate   # esquema + importación de data/db.json
npm run db:seed      # crea el usuario admin desde env
```

## Arquitectura

```
src/
├── app/                  # Rutas App Router (páginas + api/*/route.ts)
│   ├── admin/            # Panel de administración (protegido por proxy.ts)
│   └── api/              # Route handlers: auth, mercadopago, admin CRUD…
├── components/           # Componentes compartidos
├── context/              # AuthProvider, CartContext, ThemeContext, Toasts
├── lib/
│   ├── store/            # Drivers de persistencia (lowdb | memory | postgres)
│   ├── repositories/     # Contratos Promise-first sobre el store
│   ├── session.ts        # Sesiones: access corto + refresh rotativo, cookies
│   ├── auth.ts           # Firma/verificación JWT, hashes de refresh
│   ├── rate-limit.ts     # Límites por ruta + presupuesto global por IP
│   └── csrf.ts           # Defensa CSRF por verificación de Origin
└── proxy.ts              # Gate de rutas /admin y redirecciones de sesión
```

Principios de seguridad implementados: precios autoritativos en el servidor (anti-tamper), webhook de pagos con firma HMAC y verificación de monto, bloqueo temporal tras intentos fallidos, headers de seguridad estrictos (CSP sin `unsafe-eval` en producción) y borrado de cuenta con cascada (Ley 1581).

## Despliegue

Pensado para Vercel (región `gru1`). Los secretos se configuran en el dashboard de Vercel; el pipeline (`.github/workflows/`) ejecuta lint → typecheck → tests → build antes de publicar.
