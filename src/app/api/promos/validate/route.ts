import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPromoRepo } from '@/lib/repositories';
import { validateCoupon } from '@/lib/promos';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

const validateSchema = z.object({
  code: z.string().min(3).max(30),
  subtotal: z.number().nonnegative(),
});

/**
 * Valida un cupón de descuento en el checkout del storefront.
 * La aplicación autoritativa ocurre en /api/mercadopago/create-preference.
 */
export async function POST(request: Request) {
  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  try {
    const rl = await checkRouteRateLimit(request, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { code, subtotal } = parsed.data;
    const promo = getPromoRepo().findByCode(code);
    const result = validateCoupon(promo, subtotal);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.reason }, { status: 200 });
    }

    return NextResponse.json(
      {
        valid: true,
        discount: result.discount,
        code: result.promo?.code,
        type: result.promo?.type,
        value: result.promo?.value,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Error al validar el cupón' }, { status: 500 });
  }
}