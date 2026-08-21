'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatPrice } from '@/lib/format-price';
import { STATUS_LABELS, STATUS_FLOW } from '@/lib/admin-constants';
import PageHeader from '@/components/admin/PageHeader';

interface OrderDetail {
  id: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number; color?: string }>;
  shipping: { name: string; email: string; phone: string; address: string; city: string; state: string; zip: string; notes?: string };
  total: number;
  status: string;
  createdAt: string;
}

const statusOptions = STATUS_FLOW.map((value) => ({ value, label: STATUS_LABELS[value] }));

export default function AdminPedidoDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${encodeURIComponent(params.id)}`)
      .then(res => {
        if (res.status === 401) { router.push('/admin/login'); return null; }
        if (res.status === 404) { router.push('/admin/pedidos'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setOrder(data.order);
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const updateStatus = async (status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(params.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 rounded bg-surface-container-high animate-pulse" />
        <div className="h-64 rounded-xl bg-surface-container-high animate-pulse" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title={`Pedido ${order.id}`} backHref="/admin/pedidos" backLabel="Volver a pedidos" />

      <div className="grid gap-6">
        <div className="admin-card admin-card-pad">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-medium text-on-surface">Estado</h2>
            <div className="flex items-center gap-2">
              <select
                value={order.status}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={saving}
                className="input-field w-44 py-2 text-sm"
              >
                {statusOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {saving && <span className="font-body text-xs text-on-surface-variant">Guardando...</span>}
            </div>
          </div>
          <p className="font-body text-xs text-on-surface-variant">
            Creado el {new Date(order.createdAt).toLocaleString('es-MX')}
          </p>
        </div>

        <div className="admin-card admin-card-pad">
          <h2 className="mb-4 font-heading text-lg font-medium text-on-surface">Productos</h2>
          <div className="flex flex-col gap-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-3">
                <div>
                  <p className="font-body text-sm font-medium text-on-surface">{item.name}</p>
                  <p className="font-body text-xs text-on-surface-variant">
                    Cantidad: {item.quantity}{item.color ? ` — Color: ${item.color}` : ''}
                  </p>
                </div>
                <span className="font-body text-sm text-on-surface">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-outline-variant/30 pt-3">
            <span className="font-body text-base font-medium text-on-surface">Total</span>
            <span className="font-heading text-lg font-medium text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="admin-card admin-card-pad">
          <h2 className="mb-4 font-heading text-lg font-medium text-on-surface">Información de envío</h2>
          <div className="grid gap-3 font-body text-sm sm:grid-cols-2">
            <div>
              <p className="admin-label mb-1">Nombre</p>
              <p className="text-on-surface">{order.shipping.name}</p>
            </div>
            <div>
              <p className="admin-label mb-1">Email</p>
              <p className="text-on-surface">{order.shipping.email}</p>
            </div>
            <div>
              <p className="admin-label mb-1">Teléfono</p>
              <p className="text-on-surface">{order.shipping.phone}</p>
            </div>
            <div>
              <p className="admin-label mb-1">Dirección</p>
              <p className="text-on-surface">{order.shipping.address}</p>
            </div>
            <div>
              <p className="admin-label mb-1">Ciudad / Estado / CP</p>
              <p className="text-on-surface">{order.shipping.city}, {order.shipping.state} — {order.shipping.zip}</p>
            </div>
            {order.shipping.notes && (
              <div className="sm:col-span-2">
                <p className="admin-label mb-1">Notas</p>
                <p className="text-on-surface">{order.shipping.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
