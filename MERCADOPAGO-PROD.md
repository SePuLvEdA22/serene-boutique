# 🚀 MercadoPago + PSE — Guía para producción

> Documento paso a paso para migrar MercadoPago de modo sandbox (test) a producción.

---

## 📋 Prerequisitos

- [ ] Cuenta de [MercadoPago](https://www.mercadopago.com.co/) activa (la real de tu negocio)
- [ ] Aplicación desplegada en [Vercel](https://vercel.com)
- [ ] Las variables de entorno ya definidas localmente en `.env` (modo test)

---

## 🔑 Paso 1: Obtener credenciales de producción

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.co/developers/panel)
2. Inicia sesión con tu cuenta de MercadoPago (la real de tu negocio)
3. Entra a **"Tus integraciones"** → **"Credenciales"**

Verás dos pares de llaves:

| | Public Key (empieza con) | Access Token (empieza con) |
|---|---|---|
| 🟡 Test | `TEST-...` | `TEST-...` |
| 🟢 Producción | `APP_USR-...` | `APP_USR-...` |

4. Copia las credenciales de **producción** (las que empiezan con `APP_USR-`).

> ⚠️ No compartas tu Access Token. Es una credencial sensible.

---

## ⚙️ Paso 2: Configurar variables de entorno en Vercel

1. Ve a tu [Dashboard de Vercel](https://vercel.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

| Variable | Valor | Ámbitos | ¿Qué es? |
|---|---|---|---|
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | `APP_USR-xxxx-xxxx-xxxx-xxxx` | Production, Preview, Development | Public Key de producción. Es pública, por eso lleva `NEXT_PUBLIC_`. |
| `MP_ACCESS_TOKEN` | `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxx` | **Solo Production** | Access Token de producción. **Nunca se expone al frontend**. |
| `MP_WEBHOOK_SECRET` | `(secret del webhook)` | Production | Secreto para **verificar la firma** de las notificaciones del webhook. Se obtiene en el panel de MP → **Webhooks**. |

> ⚠️ `MP_ACCESS_TOKEN` **NO** debe tener el prefijo `NEXT_PUBLIC_` porque es una credencial secreta. Solo el backend la usa.
> 🔐 `MP_WEBHOOK_SECRET` también es secreto: el webhook la usa para validar que la notificación realmente viene de MercadoPago (firma HMAC-SHA256 en `x-signature`). Sin ella, el webhook verifica el pago contra la API real de MP en producción (y **rechaza** notificaciones no verificables).

5. Después de agregarlas, ve a **Deployments** y haz clic en **"Redeploy"** del último deploy exitoso para que las nuevas variables se activen.

---

## 🔗 Paso 3: Configurar Webhook en MercadoPago

Los webhooks permiten que MercadoPago notifique a tu servidor cuando un pago se aprueba, rechaza o queda pendiente.

1. En el panel de [MercadoPago Developers](https://www.mercadopago.com.co/developers/panel), ve a la sección **"Webhooks"**
2. Haz clic en **"Agregar Webhook"**
3. Ingresa la URL:
   ```
   https://tudominio.vercel.app/api/mercadopago/webhook
   ```
   (Reemplaza `tudominio.vercel.app` por tu dominio real. Ej: `https://switchandtech.vercel.app/api/mercadopago/webhook`)
4. Selecciona el evento **"Pagos"** (payment)
5. Guarda los cambios

> 🔍 Para verificar que funciona: MercadoPago envía un webhook de prueba al guardar. El código lo maneja automáticamente y responde `{ received: true }`.

6. **Configura el secret del webhook** (recomendado): en la misma sección Webhooks, MercadoPago muestra un **Secret** (o permite generarlo). Cópialo y agrégalo como variable de entorno `MP_WEBHOOK_SECRET` en Vercel (Production y Preview). Con esto, el webhook valida la firma `x-signature` de cada notificación antes de actualizar órdenes.

---

## ✅ Paso 4: Verificar que el código está listo

Tu código ya distingue automáticamente entre test y producción según las credenciales. No necesitas cambiar nada.

### ¿Cómo lo sabe?

En `src/lib/mercadopago.ts`:

```ts
export const isTestMode = !(
  process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.startsWith('APP_USR-') ?? false
);
```

- Si la `Public Key` empieza con `TEST-` → **modo test**
- Si la `Public Key` empieza con `APP_USR-` → **modo producción**

### Comportamiento en cada modo

| Componente | Modo Test (🟡) | Modo Producción (🟢) |
|---|---|---|
| **Checkout** | Muestra tarjetas de prueba y mensaje sandbox | No muestra información de prueba |
| **Create Preference** | Devuelve URL simulada sin llamar a MP | Llama a API real de MercadoPago |
| **Webhook** | Acepta notificaciones sin verificar (con aviso) | Verifica firma (`MP_WEBHOOK_SECRET`) o el pago contra la API real; rechaza lo no verificable |
| **Pago exitoso** | Redirige a `/orden?status=success` | Redirige a MP Checkout Pro → luego a `/orden` |

---

## 🔄 Flujo de pago en producción

```
Usuario en el checkout
    ↓
Selecciona método de pago (Tarjeta o PSE)
    ↓
Hace clic en "Pagar"
    ↓
Frontend → POST /api/mercadopago/create-preference
    ↓
Servidor crea la orden en estado "pending"
    ↓
Servidor llama a API de MercadoPago con Access Token
    ↓
MercadoPago devuelve init_point (URL de Checkout Pro)
    ↓
Usuario es redirigido a MercadoPago Checkout Pro
    ↓
Paga con tarjeta o PSE
    ↓
MercadoPago envía webhook → /api/mercadopago/webhook
    ↓
Webhook actualiza estado de la orden (confirmed / cancelled)
    ↓
Usuario vuelve a tu web vía back_urls
```

---

## 🧪 Paso 5: Probar en producción

### Con tarjeta de crédito real

1. Una vez configuradas las credenciales de producción, haz una compra real con tu propia tarjeta
2. Usa un monto pequeño (ej. $10,000 COP ≈ $2 USD)
3. Si todo funciona, puedes reembolsar desde el panel de MercadoPago

### Con PSE real

PSE requiere una cuenta bancaria colombiana real para probar. El flujo será:

1. Seleccionar PSE como método de pago
2. Ingresar tipo y número de documento
3. Ser redirigido al portal del banco
4. Autorizar el pago
5. Volver a la tienda

---

## 🐛 Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `"Modo de prueba"` en checkout | `MP_ACCESS_TOKEN` no está configurado en Vercel | Agregar variable y redeploy |
| `401 Unauthorized` al crear preferencia | Access Token inválido o expirado | Verificar credenciales en panel de MP |
| Webhook no actualiza órdenes | URL del webhook incorrecta o no configurada | Verificar en panel de MP → Webhooks |
| Error `"No se recibió la URL de pago"` | La API de MP no devolvió `init_point` | Revisar logs en Vercel |
| PSE no aparece como opción | Moneda incorrecta o país no configurado | PSE solo funciona con COP (Colombia) |

### Logs en Vercel

Para depurar errores:

1. Ve a tu [dashboard de Vercel](https://vercel.com)
2. Selecciona el proyecto → **Deployments**
3. Haz clic en el último deploy
4. Ve a **Functions** → busca la ruta `/api/mercadopago/create-preference`
5. Revisa los logs de error

---

## 📚 Referencias

- [Documentación Checkout Pro](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/landing)
- [Credenciales](https://www.mercadopago.com.co/developers/panel/credentials)
- [Webhooks / IPN](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks)
- [PSE](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/how-tos/payments-with-pse)
