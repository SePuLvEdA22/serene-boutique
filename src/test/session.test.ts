// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { getUserRepo } from '@/lib/repositories';
import { resetStore } from '@/lib/store';
import {
  issueRefreshToken,
  consumeRefreshToken,
  revokeRefreshToken,
  applyFailedLoginAttempt,
  resetLoginAttempts,
  getLockoutRemainingMs,
  MAX_LOGIN_ATTEMPTS,
} from '@/lib/session';

/**
 * Sesiones: refresh tokens opacos con rotación (el usado queda invalidado),
 * separación user/admin y bloqueo temporal de cuenta por fuerza bruta.
 */

async function seedUser(id: string, email: string): Promise<void> {
  await getUserRepo().create({
    id,
    name: 'Test',
    email,
    password: bcrypt.hashSync('Clave123!', 4),
    isAdmin: false,
  });
}

beforeEach(() => {
  const g = globalThis as Record<string, unknown>;
  g.__store_data = undefined;
  g.__adminInitialized = false;
  resetStore();
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('refresh tokens con rotación', () => {
  it('debería_rotar_el_refresh_token_y_dejar_inválido_el_anterior', async () => {
    await seedUser('u-rot', 'rot@example.com');

    const t1 = await issueRefreshToken('u-rot', 'user');
    const c1 = await consumeRefreshToken(t1, 'user');

    expect(c1).not.toBeNull();
    expect(c1!.user.id).toBe('u-rot');
    expect(c1!.newToken).not.toBe(t1);

    // El token usado queda invalidado (detección de reuso)
    expect(await consumeRefreshToken(t1, 'user')).toBeNull();
    // El nuevo token funciona
    expect(await consumeRefreshToken(c1!.newToken, 'user')).not.toBeNull();
  });

  it('debería_almacenar_solo_el_hash_y_nunca_el_token_en_claro', async () => {
    await seedUser('u-hash', 'hash@example.com');

    const token = await issueRefreshToken('u-hash', 'user');
    const stored = (await getUserRepo().findById('u-hash'))!;

    expect(stored.refreshTokens?.some((e) => e.hash === token)).toBe(false);
    expect(
      stored.refreshTokens?.some((e) => e.hash.length === 64 && e.hash !== token)
    ).toBe(true);
  });

  it('debería_separar_tokens_de_cliente_y_de_admin', async () => {
    await seedUser('u-kind', 'kind@example.com');

    const token = await issueRefreshToken('u-kind', 'user');
    // Un refresh de cliente NO puede renovar una sesión admin
    expect(await consumeRefreshToken(token, 'admin')).toBeNull();
    expect(await consumeRefreshToken(token, 'user')).not.toBeNull();
  });

  it('debería_rechazar_token_expirado', async () => {
    await seedUser('u-exp', 'exp@example.com');

    const token = await issueRefreshToken('u-exp', 'user');
    const user = (await getUserRepo().findById('u-exp'))!;
    await getUserRepo().update('u-exp', {
      refreshTokens: (user.refreshTokens ?? []).map((e) => ({
        ...e,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      })),
    });

    expect(await consumeRefreshToken(token, 'user')).toBeNull();
  });

  it('debería_revocar_el_token_con_revokeRefreshToken', async () => {
    await seedUser('u-rev', 'rev@example.com');

    const token = await issueRefreshToken('u-rev', 'user');
    await revokeRefreshToken(token);

    expect(await consumeRefreshToken(token, 'user')).toBeNull();
  });

  it('debería_ignorar_tokens_que_no_existen', async () => {
    expect(await consumeRefreshToken('token-inexistente', 'user')).toBeNull();
    await expect(revokeRefreshToken('token-inexistente')).resolves.toBeUndefined();
  });
});

describe('bloqueo temporal de cuenta', () => {
  it('debería_bloquear_tras_N_intentos_y_resetear_al_login_exitoso', async () => {
    await seedUser('u-lock', 'lock@example.com');

    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
      await applyFailedLoginAttempt('u-lock');
    }

    const locked = (await getUserRepo().findById('u-lock'))!;
    expect(locked.failedLoginAttempts).toBe(MAX_LOGIN_ATTEMPTS);
    expect(getLockoutRemainingMs(locked)).toBeGreaterThan(0);

    await resetLoginAttempts('u-lock');

    const after = (await getUserRepo().findById('u-lock'))!;
    expect(getLockoutRemainingMs(after)).toBe(0);
    expect(after.failedLoginAttempts).toBe(0);
    expect(after.lockoutUntil).toBeUndefined();
  });

  it('debería_devolver_0_si_no_hay_bloqueo', async () => {
    await seedUser('u-nolock', 'nolock@example.com');
    const user = (await getUserRepo().findById('u-nolock'))!;
    expect(getLockoutRemainingMs(user)).toBe(0);
  });

  it('debería_no_bloquear_con_menos_de_N_intentos', async () => {
    await seedUser('u-soft', 'soft@example.com');

    for (let i = 0; i < MAX_LOGIN_ATTEMPTS - 1; i++) {
      await applyFailedLoginAttempt('u-soft');
    }

    const user = (await getUserRepo().findById('u-soft'))!;
    expect(user.failedLoginAttempts).toBe(MAX_LOGIN_ATTEMPTS - 1);
    expect(getLockoutRemainingMs(user)).toBe(0);
  });
});
