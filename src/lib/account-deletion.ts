/**
 * Borrado de cuenta y datos personales (derecho de cancelación, Ley 1581).
 *
 * Elimina:
 * - El usuario.
 * - Sus órdenes (contienen datos personales: nombre, email, teléfono, dirección).
 * - Su suscripción al newsletter (baja automática).
 *
 * Nota: para un negocio real puede haber obligaciones fiscales/contables que
 * exijan conservar un registro mínimo (p. ej. monto y fecha de la compra) sin
 * datos personales; si aplica, anonimizar en lugar de borrar el registro.
 */
import { db } from './db';
import { getOrderRepo, getUserRepo } from './repositories';

export async function deleteUserAccount(userId: string): Promise<void> {
  const user = await getUserRepo().findById(userId);
  if (!user) return;

  // Eliminar órdenes con datos personales del usuario
  const orders = await getOrderRepo().findByUser(userId);
  for (const order of orders) {
    await getOrderRepo().delete(order.id);
  }

  // Baja automática del newsletter (mismo email)
  const subscribers = await db.subscribers.get();
  await db.subscribers.set(subscribers.filter((s) => s.email !== user.email));

  // Eliminar el usuario (y con él sus refresh tokens y contador de intentos)
  await getUserRepo().delete(userId);
}
