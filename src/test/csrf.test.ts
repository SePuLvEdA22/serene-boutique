import { describe, it, expect } from 'vitest';
import {
  validateRequestOrigin,
  requireCsrf,
  csrfBlocked,
  csrfSafeMethod,
} from '@/lib/csrf';

function makeRequest(
  method: string,
  url = 'https://switchandtech.com/api/test',
  headers: Record<string, string> = {}
) {
  return new Request(url, { method, headers });
}

describe('validateRequestOrigin', () => {
  it('debería_aceptar_origin_en_allowlist', () => {
    const request = makeRequest('POST', undefined, {
      origin: 'https://switchandtech.com',
    });
    expect(validateRequestOrigin(request)).toBe(true);
  });

  it('debería_aceptar_www_variante', () => {
    const request = makeRequest('POST', undefined, {
      origin: 'https://www.switchandtech.com',
    });
    expect(validateRequestOrigin(request)).toBe(true);
  });

  it('debería_aceptar_localhost_en_desarrollo', () => {
    const request = makeRequest(
      'POST',
      'http://localhost:3000/api/test',
      { origin: 'http://localhost:3000' }
    );
    expect(validateRequestOrigin(request)).toBe(true);
  });

  it('debería_aceptar_origen_same-origin_aunque_no_esté_en_allowlist', () => {
    const request = makeRequest('POST', 'https://preview.vercel.app/api/test', {
      origin: 'https://preview.vercel.app',
    });
    expect(validateRequestOrigin(request)).toBe(true);
  });

  it('debería_rechazar_dominio_con_prefijo_malicioso', () => {
    // `https://switchandtech.com.evil.com` NO debe pasar aunque empiece con el dominio permitido
    const request = makeRequest('POST', undefined, {
      origin: 'https://switchandtech.com.evil.com',
    });
    expect(validateRequestOrigin(request)).toBe(false);
  });

  it('debería_rechazar_dominio_no_permitido', () => {
    const request = makeRequest('POST', undefined, {
      origin: 'https://evil.com',
    });
    expect(validateRequestOrigin(request)).toBe(false);
  });

  it('debería_rechazar_sin_origin_ni_referer', () => {
    const request = makeRequest('POST');
    expect(validateRequestOrigin(request)).toBe(false);
  });

  it('debería_aceptar_referer_como_respaldo', () => {
    const request = makeRequest('POST', undefined, {
      referer: 'https://switchandtech.com/admin/login',
    });
    expect(validateRequestOrigin(request)).toBe(true);
  });

  it('debería_rechazar_origen_malformado', () => {
    const request = makeRequest('POST', undefined, { origin: 'not-a-url' });
    expect(validateRequestOrigin(request)).toBe(false);
  });
});

describe('csrfSafeMethod / requireCsrf', () => {
  it('debería_tratar_GET_HEAD_OPTIONS_como_seguros', () => {
    expect(csrfSafeMethod('GET')).toBe(true);
    expect(csrfSafeMethod('HEAD')).toBe(true);
    expect(csrfSafeMethod('OPTIONS')).toBe(true);
    expect(csrfSafeMethod('POST')).toBe(false);
    expect(csrfSafeMethod('PUT')).toBe(false);
    expect(csrfSafeMethod('DELETE')).toBe(false);
  });

  it('debería_permitir_GET_sin_origin', () => {
    expect(requireCsrf(makeRequest('GET'))).toBe(true);
  });

  it('debería_bloquear_POST_sin_origin', () => {
    expect(requireCsrf(makeRequest('POST'))).toBe(false);
  });

  it('debería_permitir_POST_con_origin_válido', () => {
    const request = makeRequest('POST', undefined, {
      origin: 'https://switchandtech.com',
    });
    expect(requireCsrf(request)).toBe(true);
  });
});

describe('csrfBlocked', () => {
  it('debería_devolver_null_cuando_el_origen_es_válido', () => {
    const request = makeRequest('POST', undefined, {
      origin: 'https://switchandtech.com',
    });
    expect(csrfBlocked(request)).toBeNull();
  });

  it('debería_devolver_403_cuando_el_origen_es_inválido', () => {
    const response = csrfBlocked(makeRequest('POST'));
    expect(response?.status).toBe(403);
  });
});
