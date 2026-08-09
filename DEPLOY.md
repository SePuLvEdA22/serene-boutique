# 🚀 Deploy — Switch&Tech

Guía paso a paso para desplegar **Switch&Tech** en **Vercel** con integración continua (CI/CD) mediante GitHub Actions.

---

## 📋 Prerequisitos

- Cuenta en [GitHub](https://github.com) con el repositorio del proyecto
- Cuenta en [Vercel](https://vercel.com) (plan **Hobby** gratuito)
- Node.js 20+ instalado localmente (opcional, para probar antes del deploy)

---

## 🧱 Paso 1: Configurar el proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com) e iniciar sesión (con GitHub)
2. Click en **"Add New..." > "Project"**
3. Conectar el repositorio de GitHub (`switchandtech`)
4. Vercel detectará automáticamente Next.js — **no cambiar configuración**
5. En **"Environment Variables"**, agregar las siguientes:

| Variable | Valor | Propósito |
|---|---|---|
| `JWT_SECRET` | `(tu clave secreta, mí­n. 32 caracteres)` | Firma de tokens de autenticación |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | `(tu public key de MercadoPago)` | SDK de MercadoPago en frontend |
| `MP_ACCESS_TOKEN` | `(tu access token de MercadoPago)` | API de MercadoPago en backend |
| `ADMIN_EMAIL` | `admin@switchandtech.mx` | Email del administrador |
| `ADMIN_PASSWORD` | `(contraseña segura)` | Contraseña del administrador |
| `STORE_DRIVER` | `lowdb` | Usar almacenamiento persistente en archivo |
| `MP_WEBHOOK_SECRET` | `(secret del webhook, panel MP)` | Verificar firma de webhooks de MercadoPago |
| `UPSTASH_REDIS_REST_URL` | `(opcional)` | Rate limiting distribuido entre instancias |
| `UPSTASH_REDIS_REST_TOKEN` | `(opcional)` | Token REST de Upstash Redis |

6. Click en **"Deploy"**
7. Esperar a que termine el primer deploy — Vercel mostrará una URL tipo `switchandtech.vercel.app`

> ✅ **¡Tu tienda ya está en línea!** Ahora configuraremos CI/CD automático.

---

## 🔧 Paso 2: Obtener credenciales de Vercel para GitHub Actions

Necesitamos 3 valores para que GitHub Actions pueda desplegar automáticamente:

### 2.1 VERCEL_TOKEN

1. Ir a [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click en **"Create"**
3. Nombre: `GitHub Actions CI/CD`
4. Scope: **"Full Account"**
5. Click en **"Create"**
6. **Copiar el token** (no se volverá a mostrar)

### 2.2 VERCEL_ORG_ID y VERCEL_PROJECT_ID

La forma más fácil de obtener ambos IDs:

1. Ir a tu proyecto en [vercel.com](https://vercel.com)
2. Click en **"Settings" > "General"**
3. **Mirar la URL del navegador** — contiene ambos IDs como parámetros:

   ```
   https://vercel.com/{teamId}/~/project/{projectId}/settings/general
   ```

   - `{teamId}` → **VERCEL_ORG_ID** (para cuentas personales es el `username` o un UUID)
   - `{projectId}` → **VERCEL_PROJECT_ID**

4. Copiar cada valor por separado

> ⚠️ Si la URL no muestra el `teamId` explí­citamente, usa el CLI:
> `npx vercel whoami --token <token>` para obtener tu username (ORG ID)

---

## 🔐 Paso 3: Configurar Secrets en GitHub

1. Ir a tu repositorio en GitHub
2. **"Settings" > "Secrets and variables" > "Actions"**
3. Click en **"New repository secret"**
4. Agregar los siguientes secrets:

| Secret | Valor |
|---|---|
| `VERCEL_TOKEN` | Token de Vercel del paso 2.1 |
| `VERCEL_ORG_ID` | ID del team del paso 2.2 |
| `VERCEL_PROJECT_ID` | ID del proyecto del paso 2.3 |

---

## 📂 Paso 4: Estructura de archivos de CI/CD

El proyecto ya incluye estos archivos; si los borraste, aquí está lo que hacen:

```
📁 .github/workflows/
├── ci.yml          # Pipeline de calidad: lint → typecheck → test → build → security audit
└── deploy.yml      # Pipeline de deploy: quality gates → Vercel deploy

📄 vercel.json      # Configuración de build, regiones y headers para Vercel
```

### Flujo de trabajo

```
Pull Request a main/Helger
    │
    ▼
┌──────────────────────────────────────────┐
│              CI (ci.yml)                 │
│                                          │
│  🔍 Lint → 🌀 TypeScript → 🧪 Tests     │
│  → ♻️ Cache → 🏗️ Build                 │
│                                          │
│  Si pasa: 🛡️ npm audit (solo en main)   │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│           Deploy (deploy.yml)            │
│                                          │
│  Quality Gates (lint + tsc + test)       │
│       ↓                                  │
│  🚀 Vercel Deploy                        │
│       ↓                                  │
│  Main → Producción                       │
│  PR    → Preview (+ comentario en PR)    │
└──────────────────────────────────────────┘
```

---

## 🚀 Paso 5: Usar el pipeline

### Para un Preview (PR)

1. Crear una rama y abrir un Pull Request a `main` o `Helger`
2. Automáticamente:
   - GitHub Actions ejecuta `ci.yml` (lint + typecheck + tests + build)
   - GitHub Actions ejecuta `deploy.yml` (quality + deploy a Vercel preview)
   - Un bot comenta la URL del preview en el PR

### Para Producción

1. Mergear el PR a `main`
2. Automáticamente:
   - GitHub Actions pasa todos los quality gates
   - Vercel despliega a producción con `--prod`
   - Se ejecuta `npm audit` como verificación de seguridad

---

## 🌎 Paso 6: Dominio personalizado (opcional)

1. En Vercel, ir a tu proyecto > **"Settings" > "Domains"**
2. Agregar tu dominio (`switchandtech.com`)
3. Seguir las instrucciones para configurar DNS (registro CNAME apuntando a `cname.vercel-dns.com`)
4. Vercel emitirá SSL automáticamente (Let's Encrypt)

---

## 🔄 Actualizar variables de entorno

Para cambiar variables en producción sin redeploy:

1. **Vercel Dashboard** > Proyecto > **"Settings" > "Environment Variables"**
2. Agregar/editar variables
3. Ir a **"Deployments"** y hacer click en **"Redeploy"** en el último deploy exitoso

---

## 🛠️ Comandos útiles

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Probar build localmente
npm run build

# Correr tests
npm test

# Ejecutar linter
npm run lint

# TypeScript check
npx tsc --noEmit
```

---

## ❓ Troubleshooting

| Problema | Solución |
|---|---|
| Build falla en CI pero funciona local | Verificar `STORE_DRIVER=memory` en CI env vars |
| Preview URL no aparece en PR | Verificar que `VERCEL_TOKEN` tenga permisos suficientes |
| Variables de entorno no se reflejan | Hacer redeploy manual desde Vercel Dashboard |
| npm audit bloquea el pipeline | Es informativo (`continue-on-error: true`) — revisar reporte |
| 404 en rutas después del deploy | Next.js rutas dinámicas — Vercel las maneja automáticamente |
| MercadoPago no funciona en producción | Verificar que las MP keys son de producción (APP_USR-*) |
| Datos se pierden al recargar | ⚠️ **lowdb no persiste en serverless.** Vercel ejecuta cada request en una instancia efí­mera; el archivo `data/db.json` se crea y destruye con cada invocación. Para producción real, migrar a una base de datos externa (Neon/PostgreSQL, MongoDB Atlas, Supabase). Para entornos nonprod/prueba, funciona correctamente porque se usa en memoria. |

---

## 📊 Plan gratuito de Vercel (Hobby)

| Recurso | Límite |
|---|---|
| Ancho de banda | 100 GB / mes |
| Minutos de build | 6,000 / mes |
| Funciones serverless | 100 GB-h / mes |
| Sites | Ilimitados |
| SSL | Automático (Let's Encrypt) |
| CDN | Global (más de 100 regions) |
| Preview Deployments | Ilimitados |
| Equipo | Hasta 3 miembros |

Para más detalles: [vercel.com/pricing](https://vercel.com/pricing)
