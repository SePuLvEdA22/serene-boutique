# Seguridad — Estado de implementación

> Documento vivo de cumplimiento de las **Reglas de Seguridad** (checklist de e-commerce) y de los **Estándares de Calidad de Código** (`estandares-calidad-codigo.md`).
> Última actualización: agosto 2026.

---

## Resumen

| Prioridad | Hallazgo | Estado |
|---|---|---|
| 1 | Precios del cliente sin validar contra catálogo + webhook sin verificación de monto | ✅ Implementado |
| 2 | Credenciales y secretos por defecto (`admin123`, `JWT_SECRET` conocido) | ✅ Implementado |
| 3 | Dependencias con 4 grupos de vulnerabilidades high | ✅ Implementado |
| 4 | JWT largos sin refresh; sin bloqueo de cuenta | ✅ Implementado |
| 5 | Ley 1581: consentimiento explícito y borrado de datos | ✅ Implementado |
| 6 | Cifrado en reposo de datos sensibles (lowdb en claro) | ⏳ Pendiente |
| 7 | CSP con `unsafe-inline`/`unsafe-eval`; JSON-LD sin escape de `<` | ⏳ Pendiente |

Verificación actual: **127 tests pasando**, typecheck OK, build OK, `npm audit` = 0 vulnerabilidades, lint sin issues nuevos (quedan 11 preexistentes en archivos de UI).

---

## ✅ Implementado

### 1. Precios validados en el servidor (crítico)

- **`src/lib/order-items.ts`** (nuevo): `validateOrderItems()` valida cada item contra el catálogo:
  - el producto existe y está activo,
  - cantidad entre 1 y 99,
  - el precio enviado coincide **exactamente** con el precio efectivo del catálogo (`getPrice`, incluye ofertas).
  - Devuelve items canónicos (nombre/precio del catálogo, nunca del cliente) y el total recalculado en servidor.
- **`POST /api/mercadopago/create-preference`**: rechaza con **400** cualquier precio manipulado o producto inexistente **antes** de crear la orden o la preferencia de pago.
- **Eliminado `POST /api/orders`**: era código muerto (el frontend no lo usa) y creaba órdenes `confirmed` sin pago (bypass de pago). Solo queda el `GET` autenticado.
- Tests: `src/test/order-items.test.ts` (9 casos) y casos nuevos en el e2e de checkout.

### 2. Webhook de MercadoPago con verificación de monto (crítico)

- **`POST /api/mercadopago/webhook`**:
  - compara `transaction_amount` del pago con el `total` de la orden; si no coinciden → **409 y NO se actualiza el estado**.
  - registra `mpPaymentId` al confirmar (nuevo método `update` en el repositorio de órdenes).
  - ya **no loguea el body completo** (contenía email e identificación del pagador); loguea solo `type/action/data.id`.
- Tests: webhook con monto incorrecto → 409 y la orden sigue `pending`.

### 3. Secretos y credenciales sin fallbacks inseguros (crítico)

- **`src/lib/auth.ts`**: `JWT_SECRET` **obligatorio en producción** (mín. 32 caracteres). Sin él, la app **falla al compilar** (fail-fast). Fallback solo en dev/test.
- **`src/lib/admin-config.ts`** (nuevo): `ADMIN_EMAIL`/`ADMIN_PASSWORD` obligatorios en producción; `ADMIN_PASSWORD` debe cumplir la política (mín. 8, mayúscula, número). Ya no existe el admin `admin123` silencioso. `src/lib/admin.ts` y `scripts/seed.ts` lo usan.
- **`.env.example`** actualizado con los requisitos.

### 4. Sesiones: access corto + refresh rotativo + bloqueo de cuenta (prioridad 4)

Regla 4: "JWT con expiración corta (ej. 15 min) + refresh tokens con rotación, **O** sesiones server-side" — se implementó la combinación de ambas:

- **Access token JWT de 15 min** (antes 7 días usuario / 24 h admin). Nota: jose interpreta números en `setExpirationTime` como timestamp Unix → se usa `now + 900s`.
- **Refresh token opaco (256 bits)** almacenado **solo hasheado (SHA-256)** en la BD, con **rotación en cada uso**: el token usado queda invalidado (detección de reuso). Vigencia 30 días.
- **Separación `kind: 'user' | 'admin'`**: un refresh de cliente jamás puede renovar una sesión de administración.
- **`src/lib/session.ts`** (nuevo): `issueRefreshToken`, `consumeRefreshToken`, `revokeRefreshToken` y `getSessionUser()` (auto-curación: si el access expiró, rota el refresh y reemite cookies). La carrera de rotación no destruye la sesión.
- **`requireAdmin`** auto-curativo con `admin-refresh` (15 min de access + refresh de 30 días).
- **Logout** (usuario y admin): revoca los refresh tokens en el servidor además de limpiar cookies. Lee el header `Cookie` directamente (sin depender del request scope).
- **Bloqueo temporal de cuenta**: 5 intentos fallidos → 15 min de bloqueo por cuenta (no solo por IP), reseteado al login exitoso. Aplicado a login de cliente (`/api/auth/login`) y de admin (`/api/admin/login`).
- `/api/auth/me`, `/api/auth/profile` y `/api/orders` usan `getSessionUser`.
- Tests: `src/test/session.test.ts` (9 casos).

### 5. Ley 1581 — consentimiento explícito y borrado de datos (prioridad 5)

- **Registro**: checkbox obligatorio "He leído y acepto la Política de Privacidad" (validado en cliente con `registerSchema` y en servidor con `z.literal(true)`); se guarda `consentAt` en el usuario.
- **Newsletter**: checkbox obligatorio + `consentAt` en el suscriptor; la ruta rechaza sin consentimiento.
- **Borrado de cuenta** (derecho de cancelación): botón en el perfil con confirmación de contraseña → `POST /api/auth/delete-account` → `deleteUserAccount()` (`src/lib/account-deletion.ts`) elimina usuario + sus órdenes (PII) + baja automática del newsletter. Bloqueado para cuentas admin.
- Nuevos `delete()` en repositorios de usuario y órdenes.
- Tests: `src/test/consent.test.ts` (5 casos) y `src/test/account-deletion.test.ts` (3 casos).

### 6. Dependencias (prioridad 3)

- `next` 16.2.6 → **^16.3.1**; `npm audit` = **0 vulnerabilidades** (antes 4 grupos high: next, nanoid, postcss, sharp).

---

## ⏳ Pendiente

### Por prioridad

| # | Pendiente | Detalle | Dónde |
|---|---|---|---|
| 6 | **Cifrado en reposo** | Dirección, teléfono y cédula/NIT (`payerIdentification`) se guardan en claro en `data/db.json`. Requiere gestión de claves (p. ej. env var + AES-GCM). | `lowdb-store`, `create-preference`, modelos |
| 7 | **CSP sin `unsafe-inline`/`unsafe-eval`** | Debilita la protección XSS; requiere nonces o refactor de scripts inline para producción. | `next.config.ts` |
| 7 | **Escape de `<` en JSON-LD** | `JSON.stringify` no escapa `<`: un nombre/descripción con `</script>` rompe el `<script>` (stored-XSS si se compromete una cuenta admin). | `src/components/ProductJsonLd.tsx` |

### Menores (hallazgos del análisis)

- **`MP_WEBHOOK_SECRET` opcional en producción**: sin él el webhook acepta notificaciones sin verificar firma. Hacerlo obligatorio (fail-fast).
- **IDOR parcial**: `GET /api/orders/[id]` es público (mitigado por IDs aleatorios + rate limit, pero no exige sesión ni pertenencia).
- **CSRF por origen en vez de tokens**: `csrfBlocked()` valida Origin/Referer; la regla pide tokens anti-CSRF. Alternativa aceptable, documentar o migrar.
- **Rate limiting en memoria por defecto**: en Vercel (multi-instancia) es eludible; configurar Upstash (`UPSTASH_REDIS_REST_URL`/`TOKEN`).
- **2FA para rutas administrativas** (la regla lo pide como "considerar").
- **Admin `PUT /api/admin/products/[id]`** no valida con `ProductSchema` (solo el POST lo hace).
- **zod sin `.strict()`**: los schemas descartan campos extra en vez de rechazarlos (la regla pide rechazo).
- **Newsletter/contacto loguean el email** a consola (PII menor).

### Deuda del estándar de calidad (`estandares-calidad-codigo.md`)

- **Cobertura de tests**: no hay provider configurado (`@vitest/coverage-v8`); no se mide el umbral del 80%.
- **Mutation testing**: Stryker no está configurado.
- **Lint**: 11 issues preexistentes (7 errores, 4 warnings) en archivos de UI — `src/app/admin/layout.tsx`, `src/app/admin/pedidos/[id]/page.tsx`, `src/app/api/admin/users/route.ts`, `src/app/buscar/page.tsx`, `src/app/error.tsx`, `src/app/mis-ordenes/page.tsx`, `src/components/Header.tsx`, `src/context/AuthContext.tsx`, `src/context/ThemeContext.tsx`. **El job de lint del CI está en rojo por ellos.**
- **CI `npm audit` con `continue-on-error: true`**: el job de auditoría nunca bloquea el deploy.
- **Acción de deploy**: configurar en Vercel `JWT_SECRET` (≥32 chars), `ADMIN_EMAIL` y `ADMIN_PASSWORD` (política-compliant); sin ellas el build/arranque falla a propósito (fail-fast).

---

## Cumplimiento por regla (checklist)

| Regla | Estado | Notas |
|---|---|---|
| 1. Validación de entrada | ⚠️ Parcial | zod en backend en casi todo; precios validados contra catálogo ✅; falta `.strict()` y validar el PUT de admin products |
| 2. Inyección SQL | ✅ N/A | No hay SQL: persistencia lowdb (JSON) con repositorios tipados |
| 3. Contraseñas y hashing | ✅ Cumple | bcrypt costo 10, política mínima, admin sin fallbacks en prod |
| 4. Autenticación y sesiones | ✅ Mejorado | Access 15 min + refresh rotativo server-side + lockout; falta 2FA |
| 5. XSS | ⚠️ Parcial | React escapa por defecto; falta endurecer CSP y el JSON-LD |
| 6. CSRF | ⚠️ Parcial | `sameSite=strict` + validación de Origin; sin tokens anti-CSRF |
| 7. Transporte y headers | ✅ Cumple | HTTPS/HSTS, X-Frame-Options, nosniff, Referrer-Policy; CSP débil (ver regla 5) |
| 8. Pagos y datos sensibles | ⚠️ Parcial | Sin tarjetas (MP tokenizado), firma + monto verificados; falta cifrado en reposo y `MP_WEBHOOK_SECRET` obligatorio |
| 9. Infraestructura y dependencias | ⚠️ Parcial | Audit 0, secrets por env con fail-fast; falta Upstash y endurecer CI |
| 10. Logging y errores | ⚠️ Parcial | Webhook sin PII ✅; newsletter/contacto loguean email (menor) |
| 11. Control de acceso | ✅ Bueno | `requireAdmin` en todos los admin, órdenes filtradas por usuario; IDOR parcial menor en orden pública |

---

## Requisitos de despliegue (producción)

Variables de entorno obligatorias (sin ellas la app falla a propósito):

```
JWT_SECRET=            # mínimo 32 caracteres, aleatorio
ADMIN_EMAIL=           # correo del administrador
ADMIN_PASSWORD=        # cumple política: 8+ chars, mayúscula, número
MP_ACCESS_TOKEN=       # token real de MercadoPago (APP_USR-...)
NEXT_PUBLIC_MP_PUBLIC_KEY=  # key pública de producción (APP_USR-...)
MP_WEBHOOK_SECRET=     # RECOMENDADO/FUTURO-OBLIGATORIO: secreto del webhook
```

Recomendadas: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting distribuido en Vercel).
