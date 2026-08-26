/**
 * Validación server-side de items de orden contra el catálogo de productos.
 *
 * El frontend envía items con `price`/`unit_price` calculados en el navegador.
 * Confiar en esos valores permite manipulación de precios (p. ej. pagar $1 por
 * un producto caro). Esta función:
 *
 * - Verifica que cada producto exista y esté activo en el catálogo.
 * - Verifica que la cantidad sea razonable (1..MAX_ITEM_QUANTITY).
 * - Compara el precio enviado por el cliente con el precio efectivo del
 *   catálogo (`getPrice`) y rechaza cualquier discrepancia.
 * - Devuelve items canónicos (nombre y precio tomados del catálogo, nunca del
 *   cliente) y el total recalculado en el servidor.
 */
import { getProductRepo } from '@/lib/repositories';
import { getPrice } from '@/lib/format-price';

export const MAX_ITEM_QUANTITY = 99;

export interface OrderItemCandidate {
  productId: string;
  quantity: number;
  /** Precio enviado por el cliente (`price` en /api/orders, `unit_price` en create-preference). */
  price?: number;
  unit_price?: number;
  color?: string;
}

export interface ValidatedOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
}

export interface OrderItemsValidationResult {
  ok: boolean;
  items: ValidatedOrderItem[];
  total: number;
  errors: string[];
}

export async function validateOrderItems(
  input: OrderItemCandidate[]
): Promise<OrderItemsValidationResult> {
  const items: ValidatedOrderItem[] = [];
  const errors: string[] = [];

  // Cargar el catálogo UNA sola vez (no un findById por ítem: cada consulta
  // lee la colección completa, O(n) por línea del carrito).
  const products = await getProductRepo().findAll();
  const byId = new Map(products.map((p) => [p.id, p]));

  for (const candidate of input) {
    const clientPrice = candidate.price ?? candidate.unit_price;

    if (clientPrice === undefined || !Number.isFinite(clientPrice)) {
      errors.push('Precio inválido');
      continue;
    }

    if (!Number.isInteger(candidate.quantity) || candidate.quantity < 1) {
      errors.push('Cantidad inválida');
      continue;
    }

    if (candidate.quantity > MAX_ITEM_QUANTITY) {
      errors.push('Cantidad excede el máximo permitido');
      continue;
    }

    const product = byId.get(candidate.productId);
    if (!product) {
      errors.push('Producto no encontrado');
      continue;
    }

    if (product.active === false) {
      errors.push('Producto no disponible');
      continue;
    }

    const catalogPrice = getPrice(product);
    // Comparación exacta: cualquier centavo de diferencia es manipulación.
    if (clientPrice !== catalogPrice) {
      errors.push('Precio inválido');
      continue;
    }

    items.push({
      productId: product.id,
      name: product.name,
      price: catalogPrice,
      quantity: candidate.quantity,
      ...(candidate.color ? { color: candidate.color } : {}),
    });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    ok: errors.length === 0 && items.length > 0,
    items,
    total,
    errors,
  };
}
