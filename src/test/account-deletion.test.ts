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

beforeEach(() => {
  db.users.set([]);
  db.orders.set([]);
  db.subscribers.set([]);
  db.contacts.set([]);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('deleteUserAccount', () => {
  it('debería_eliminar_usuario_órdenes_y_suscripción_del_newsletter', () => {
    const email = 'del@example.com';
    getUserRepo().create({
      id: 'user-del',
      name: 'Cliente',
      email,
      password: bcrypt.hashSync('Clave123!', 4),
      isAdmin: false,
    });
    db.orders.set([makeOrder('ORD-1', 'user-del'), makeOrder('ORD-2', 'user-del')]);
    db.subscribers.set([{ id: 'sub-1', email, subscribedAt: new Date().toISOString() }]);

    deleteUserAccount('user-del');

    expect(getUserRepo().findById('user-del')).toBeUndefined();
    expect(getOrderRepo().findAll()).toHaveLength(0);
    expect(db.subscribers.get()).toHaveLength(0);
  });

  it('debería_no_tocar_datos_de_otros_usuarios', () => {
    getUserRepo().create({
      id: 'user-del',
      name: 'A eliminar',
      email: 'del@example.com',
      password: bcrypt.hashSync('Clave123!', 4),
      isAdmin: false,
    });
    getUserRepo().create({
      id: 'user-other',
      name: 'Otro',
      email: 'other@example.com',
      password: bcrypt.hashSync('Clave123!', 4),
      isAdmin: false,
    });
    db.orders.set([makeOrder('ORD-1', 'user-del'), makeOrder('ORD-2', 'user-other')]);
    db.subscribers.set([
      { id: 'sub-1', email: 'del@example.com', subscribedAt: new Date().toISOString() },
      { id: 'sub-2', email: 'other@example.com', subscribedAt: new Date().toISOString() },
    ]);

    deleteUserAccount('user-del');

    // El otro usuario y sus datos se mantienen intactos
    expect(getUserRepo().findById('user-other')).toBeDefined();
    expect(getOrderRepo().findAll()).toHaveLength(1);
    expect(getOrderRepo().findAll()[0].id).toBe('ORD-2');
    expect(db.subscribers.get()).toHaveLength(1);
    expect(db.subscribers.get()[0].email).toBe('other@example.com');
  });

  it('debería_no_fallar_si_el_usuario_no_existe', () => {
    expect(() => deleteUserAccount('no-existe')).not.toThrow();
  });
});
