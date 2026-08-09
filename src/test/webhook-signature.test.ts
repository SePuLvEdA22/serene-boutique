import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyWebhookSignature } from '@/lib/webhook-signature';

const SECRET = 'test-webhook-secret';
const DATA_ID = '123456789';
const REQUEST_ID = '4ed4fa2b-0b31-42ec-a62f-ad793c486c59';

function buildManifest(ts: number, dataId: string, requestId: string): string {
  return `id:${dataId};request-id:${requestId};ts:${ts};`;
}

function sign(ts: number, dataId: string, requestId: string, secret: string): string {
  const manifest = buildManifest(ts, dataId, requestId);
  return createHmac('sha256', secret).update(manifest).digest('hex');
}

function buildHeader(ts: number, v1: string): string {
  return `ts=${ts},v1=${v1}`;
}

describe('verifyWebhookSignature', () => {
  it('debería_aceptar_firma_válida', () => {
    const ts = Math.floor(Date.now() / 1000);
    const v1 = sign(ts, DATA_ID, REQUEST_ID, SECRET);

    const result = verifyWebhookSignature({
      signatureHeader: buildHeader(ts, v1),
      requestId: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });

    expect(result).toBe(true);
  });

  it('debería_rechazar_firma_con_secreto_incorrecto', () => {
    const ts = Math.floor(Date.now() / 1000);
    const v1 = sign(ts, DATA_ID, REQUEST_ID, 'otro-secreto');

    const result = verifyWebhookSignature({
      signatureHeader: buildHeader(ts, v1),
      requestId: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });

    expect(result).toBe(false);
  });

  it('debería_rechazar_si_se_manipula_el_data_id', () => {
    const ts = Math.floor(Date.now() / 1000);
    const v1 = sign(ts, DATA_ID, REQUEST_ID, SECRET);

    const result = verifyWebhookSignature({
      signatureHeader: buildHeader(ts, v1),
      requestId: REQUEST_ID,
      dataId: '999999',
      secret: SECRET,
    });

    expect(result).toBe(false);
  });

  it('debería_rechazar_si_se_manipula_el_request_id', () => {
    const ts = Math.floor(Date.now() / 1000);
    const v1 = sign(ts, DATA_ID, REQUEST_ID, SECRET);

    const result = verifyWebhookSignature({
      signatureHeader: buildHeader(ts, v1),
      requestId: 'otro-request-id',
      dataId: DATA_ID,
      secret: SECRET,
    });

    expect(result).toBe(false);
  });

  it('debería_rechazar_timestamp_muy_antiguo', () => {
    const oldTs = Math.floor(Date.now() / 1000) - 3600; // 1 hora atrás
    const v1 = sign(oldTs, DATA_ID, REQUEST_ID, SECRET);

    const result = verifyWebhookSignature({
      signatureHeader: buildHeader(oldTs, v1),
      requestId: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });

    expect(result).toBe(false);
  });

  it('debería_respetar_la_tolerancia_de_timestamp', () => {
    const ts = Math.floor(Date.now() / 1000) - 60; // 1 minuto atrás, dentro de 300s
    const v1 = sign(ts, DATA_ID, REQUEST_ID, SECRET);

    const result = verifyWebhookSignature({
      signatureHeader: buildHeader(ts, v1),
      requestId: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });

    expect(result).toBe(true);
  });

  it('debería_rechazar_formato_de_cabecera_inválido', () => {
    const result = verifyWebhookSignature({
      signatureHeader: 'garbage-without-equals',
      requestId: REQUEST_ID,
      dataId: DATA_ID,
      secret: SECRET,
    });

    expect(result).toBe(false);
  });

  it('debería_rechazar_si_faltan_datos', () => {
    expect(
      verifyWebhookSignature({
        signatureHeader: null,
        requestId: null,
        dataId: '',
        secret: SECRET,
      })
    ).toBe(false);
  });
});
