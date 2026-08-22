import { NextResponse } from 'next/server';
import { getOrderRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { statusLabel } from '@/lib/admin-constants';

const PAYMENT_LABELS: Record<string, string> = {
  card: 'Tarjeta',
  pse: 'PSE',
  sin_metodo: 'Sin método',
};

function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return '"' + s.replace(/"/g, '""') + '"';
}

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const fromMs = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const toMs = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

  const orders = (await getOrderRepo().findAll()).filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      const t = new Date(o.createdAt).getTime();
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const header = ['ID', 'Cliente', 'Email', 'Fecha', 'Total', 'Estado', 'Método de pago', 'Productos'];

  const rows = orders.map((o) => [
    o.id,
    o.shipping?.name ?? '',
    o.shipping?.email ?? '',
    new Date(o.createdAt).toLocaleDateString('es-MX'),
    o.total,
    statusLabel(o.status),
    PAYMENT_LABELS[o.paymentMethod || 'sin_metodo'] || 'Sin método',
    o.items.map((i) => `${i.name} x${i.quantity}`).join(' | '),
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  // BOM para que Excel interprete UTF-8 correctamente.
  const body = '\uFEFF' + csv;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}