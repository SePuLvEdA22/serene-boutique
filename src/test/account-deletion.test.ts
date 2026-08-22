import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getUserRepo, getOrderRepo } from '@/lib/repositories';
import { deleteUserAccount } from '@/lib/account-deletion';
import type { Order } from '@/lib/models';

/**
 * Borrado de cuenta (derecho de cancelación, Ley 1581): elimina al usuario,
 * sus órdenes (con datos personales) y su suscripción al newsletter.
 */

function makeOrder(id: string, userId: string): Order {
  return {
    id,
    userId,
    items: [{ productId: 'funda-silicone-clear', name: 'Funda', price: 249000, quantity: 1 }],
    shipping: {
      name: 'Cliente',
      email: 'cliente@example.com',
      phone: '5551234',
      address: 'Calle 1',
      city: 'Bogotá',
      state: 'Cundinamarca',
      zip: '11001',
    },
    total: 249000,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
}

beforeEach(async () => {
  await db.users.set([]);
  await db.orders.set([]);
  await db.subscribers.set([]);
  await db.contacts.set([]);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('deleteUserAccount', () => {
  it('debería_eliminar_usuario_órdenes_y_suscripción_del_newsletter', async () => {
    const email = 'del@example.com';
    await getUserRepo().create({
      id: 'user-del',
      name: 'Cliente',
      email,
      password: bcrypt.hashSync('Clave123!', 4),
      isAdmin: false,
    });
    await db.orders.set([makeOrder('ORD-1', 'user-del'), makeOrder('ORD-2', 'user-del')]);
    await db.subscribers.set([{ id: 'sub-1', email, subscribedAt: new Date().toISOString() }]);

    await deleteUserAccount('user-del');

    expect(await getUserRepo().findById('user-del')).toBeUndefined();
    expect(await getOrderRepo().findAll()).toHaveLength(0);
    expect(await db.subscribers.get()).toHaveLength(0);
  });

  it('debería_no_tocar_datos_de_otros_usuarios', async () => {
    await getUserRepo().create({
      id: 'user-del',
      name: 'A eliminar',
      email: 'del@example.com',
      password: bcrypt.hashSync('Clave123!', 4),
      isAdmin: false,
    });
    await getUserRepo().create({
      id: 'user-other',
      name: 'Otro',
      email: 'other@example.com',
      password: bcrypt.hashSync('Clave123!', 4),
      isAdmin: false,
    });
    await db.orders.set([makeOrder('ORD-1', 'user-del'), makeOrder('ORD-2', 'user-other')]);
    await db.subscribers.set([
      { id: 'sub-1', email: 'del@example.com', subscribedAt: new Date().toISOString() },
      { id: 'sub-2', email: 'other@example.com', subscribedAt: new Date().toISOString() },
    ]);

    await deleteUserAccount('user-del');

    // El otro usuario y sus datos se mantienen intactos
    expect(await getUserRepo().findById('user-other')).toBeDefined();
    const remaining = await getOrderRepo().findAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('ORD-2');
    const subscribers = await db.subscribers.get();
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0].email).toBe('other@example.com');
  });

  it('debería_no_fallar_si_el_usuario_no_existe', async () => {
    await expect(deleteUserAccount('no-existe')).resolves.toBeUndefined();
  });
});
