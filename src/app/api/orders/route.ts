import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getOrderRepo } from '@/lib/repositories';
import { verifyUserToken } from '@/lib/auth';

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string().min(1),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
        color: z.string().optional(),
      })
    )
    .min(1),
  shipping: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      notes: z.string().optional(),
    })
    .optional(),
  total: z.number().positive(),
  paymentMethod: z.enum(['card', 'pse']).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de orden incompletos o inválidos' },
        { status: 400 }
      );
    }

    const { items, shipping, total, paymentMethod } = parsed.data;

    let userId: string | undefined;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value;
      if (token) {
        const payload = await verifyUserToken(token);
        userId = payload?.id;
      }
    } catch {}

    const order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId,
      items,
      shipping: shipping || {
        name: 'Pendiente',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
      },
      total,
      ...(paymentMethod ? { paymentMethod } : {}),
      status: 'confirmed' as const,
      createdAt: new Date().toISOString(),
    };

    getOrderRepo().create(order);

    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear la orden' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ orders: [] });
    }

    const payload = await verifyUserToken(token);
    if (!payload) {
      return NextResponse.json({ orders: [] });
    }

    const orders = getOrderRepo()
      .findByUser(payload.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ orders: [] });
  }
}
