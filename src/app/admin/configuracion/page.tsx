'use client';

import { useState } from 'react';
import { useAdminFetch, readApiError } from '@/lib/use-admin-fetch';
import PageHeader from '@/components/admin/PageHeader';

interface Settings {
  storeName: string;
  supportEmail: string;
  whatsapp: string;
  instagram: string;
  shippingCost: number;
  freeShippingThreshold: number;
  announcement: string;
  announcementEnabled: boolean;
}

export default function AdminSettingsPage() {
  const { data, loading } = useAdminFetch<{ settings: Settings }>('/api/admin/settings');
  const [form, setForm] = useState<Settings | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ajuste de estado durante el render (patrón recomendado): inicializa el
  // formulario con los datos cargados sin setState síncrono en un effect.
  if (!initialized && data?.settings) {
    setInitialized(true);
    setForm(data.settings);
  }

  if (loading || !form) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-56 rounded bg-surface-container-high animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          shippingCost: Number(form.shippingCost) || 0,
          freeShippingThreshold: Number(form.freeShippingThreshold) || 0,
        }),
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      setSaved(true);
    } catch {
      setError('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<Settings>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Configuración" subtitle="Datos generales de la tienda" />

      <form onSubmit={save} className="admin-card admin-card-pad max-w-2xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="admin-label" htmlFor="cfg-name">Nombre de la tienda</label>
            <input id="cfg-name" value={form.storeName} onChange={(e) => set({ storeName: e.target.value })} required className="input-field" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="admin-label" htmlFor="cfg-email">Email de soporte</label>
            <input id="cfg-email" type="email" value={form.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} required className="input-field" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="admin-label" htmlFor="cfg-whatsapp">WhatsApp</label>
            <input id="cfg-whatsapp" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+57 300 000 0000" className="input-field" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="admin-label" htmlFor="cfg-instagram">Instagram</label>
            <input id="cfg-instagram" value={form.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="@switchandtech" className="input-field" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="admin-label" htmlFor="cfg-shipping">Costo de envío ($)</label>
            <input id="cfg-shipping" type="number" min="0" step="0.01" value={form.shippingCost} onChange={(e) => set({ shippingCost: Number(e.target.value) })} className="input-field" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="admin-label" htmlFor="cfg-freeship">Envío gratis desde ($)</label>
            <input id="cfg-freeship" type="number" min="0" step="0.01" value={form.freeShippingThreshold} onChange={(e) => set({ freeShippingThreshold: Number(e.target.value) })} className="input-field" />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <label className="admin-label" htmlFor="cfg-announcement">Anuncio (barra superior)</label>
          <textarea
            id="cfg-announcement"
            value={form.announcement}
            onChange={(e) => set({ announcement: e.target.value })}
            rows={2}
            maxLength={300}
            className="input-field resize-none"
          />
        </div>

        <label className="mt-4 flex items-center gap-2 font-body text-sm text-on-surface">
          <input
            type="checkbox"
            checked={form.announcementEnabled}
            onChange={(e) => set({ announcementEnabled: e.target.checked })}
            className="accent-primary"
          />
          Mostrar anuncio
        </label>

        {error && <p className="mt-3 font-body text-sm text-error">{error}</p>}
        {saved && <p className="mt-3 font-body text-sm text-green-600">Configuración guardada.</p>}

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary text-xs">
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}