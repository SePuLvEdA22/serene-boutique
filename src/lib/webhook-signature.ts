import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verificación de firma de webhooks de MercadoPago (Checkout Pro).
 *
 * MercadoPago firma cada notificación con un HMAC-SHA256 (hex) calculado
 * sobre el manifest:
 *
 *   id:{data.id};request-id:{x-request-id};ts:{ts};
 *
 * donde `ts` y `v1` (el hash) vienen en la cabecera `x-signature`
 * (`ts=<timestamp>,v1=<hash>`) y el id único en `x-request-id`.
 *
 * Referencia: https://www.mercadopago.com.co/developers/en/docs/your-integrations/notifications/webhooks
 * (sección "Verificar firma").
 */

export interface WebhookSignatureInput {
  /** Valor de la cabecera `x-signature` (formato `ts=...,v1=...`). */
  signatureHeader: string | null;
  /** Valor de la cabecera `x-request-id`. */
  requestId: string | null;
  /** Identificador del recurso notificado (`data.id`). */
  dataId: string;
  /** Secreto del webhook (MP_WEBHOOK_SECRET). */
  secret: string;
  /** Tolerancia de antigüedad del timestamp en segundos (anti-replay). */
  maxAgeSeconds?: number;
}

export function verifyWebhookSignature({
  signatureHeader,
  requestId,
  dataId,
  secret,
  maxAgeSeconds = 300,
}: WebhookSignatureInput): boolean {
  if (!signatureHeader || !requestId || !dataId || !secret) {
    return false;
  }

  const params = new Map<string, string>();
  for (const part of signatureHeader.split(',')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    params.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
  }

  const ts = params.get('ts');
  const v1 = params.get('v1');
  if (!ts || !v1) return false;

  const tsNumber = Number(ts);
  if (!Number.isFinite(tsNumber)) return false;

  // Anti-replay: rechazar firmas con timestamp demasiado antiguo.
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsNumber) > maxAgeSeconds) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(v1.toLowerCase(), 'hex');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
