import { NextResponse } from 'next/server';

const subscribers: string[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'El email es obligatorio' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (subscribers.includes(email)) {
      return NextResponse.json(
        { message: 'Ya estás suscrito' },
        { status: 200 }
      );
    }

    subscribers.push(email);
    console.log('[Newsletter] Nuevo suscriptor:', email);

    return NextResponse.json(
      { message: 'Suscripción exitosa' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
}
