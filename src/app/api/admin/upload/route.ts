import { NextResponse } from 'next/server';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'products');
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

/**
 * Sube una imagen de producto a `public/images/products/` y devuelve su URL.
 *
 * ⚠️ Limitación de plataforma: en Vercel el sistema de archivos es efímero, por
 * lo que las subidas no persisten entre deploys (igual que lowdb). Para
 * producción real conviene almacenamiento externo (Vercel Blob, S3, etc.).
 */
export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  const rl = await checkRouteRateLimit(request, { maxRequests: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo no recibido' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Formato no permitido. Usa JPG, PNG, WebP, AVIF o GIF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen supera el límite de 2 MB.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT_BY_TYPE[file.type]}`;

    mkdirSync(UPLOAD_DIR, { recursive: true });
    writeFileSync(path.join(UPLOAD_DIR, name), bytes);

    return NextResponse.json({ url: `/images/products/${name}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 });
  }
}
