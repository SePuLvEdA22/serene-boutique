// @vitest-environment node
//
// Entorno node: jose (JWT) exige TextEncoder/Uint8Array del mismo ámbito.
//
// Verifica que en producción la app FALLA explícitamente si faltan
// JWT_SECRET / ADMIN_EMAIL / ADMIN_PASSWORD o si no cumplen la política,
// en lugar de arrancar con credenciales por defecto conocidas.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getAdminEmail, getAdminPassword } from '@/lib/admin-config';

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('credenciales de administrador (admin-config)', () => {
  it('debería_usar_ADMIN_EMAIL_del_entorno', () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@mystore.com');
    expect(getAdminEmail()).toBe('admin@mystore.com');
  });

  it('debería_lanzar_en_producción_si_falta_ADMIN_EMAIL', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_EMAIL', '');
    expect(() => getAdminEmail()).toThrow(/ADMIN_EMAIL/);
  });

  it('debería_aceptar_ADMIN_PASSWORD_que_cumple_la_política', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'Admin-Secreto-2026!');
    expect(getAdminPassword()).toBe('Admin-Secreto-2026!');
  });

  it('debería_rechazar_ADMIN_PASSWORD_débil_aunque_esté_definida', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'admin123');
    expect(() => getAdminPassword()).toThrow(/política/);
  });

  it('debería_lanzar_en_producción_si_falta_ADMIN_PASSWORD', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect(() => getAdminPassword()).toThrow(/ADMIN_PASSWORD/);
  });
});

describe('secreto JWT (auth)', () => {
  it('debería_lanzar_al_importar_en_producción_sin_JWT_SECRET', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', '');

    vi.resetModules();
    await expect(import('@/lib/auth')).rejects.toThrow(/JWT_SECRET/);
  });

  it('debería_lanzar_al_importar_en_producción_con_JWT_SECRET_corto', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', 'secreto-corto');

    vi.resetModules();
    await expect(import('@/lib/auth')).rejects.toThrow(/32 caracteres/);
  });

  it('debería_importar_y_firmar_con_JWT_SECRET_válido', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', 'un-secreto-muy-largo-de-al-menos-32-caracteres!!');

    vi.resetModules();
    const auth = await import('@/lib/auth');
    const token = await auth.signUserToken({ id: 'u1', email: 'a@b.co', name: 'A' });
    expect(token).toBeTruthy();

    const payload = await auth.verifyUserToken(token);
    expect(payload?.id).toBe('u1');
  });
});
