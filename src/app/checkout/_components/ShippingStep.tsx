'use client';

import type { FormEvent } from 'react';
import { formatZodErrors, shippingSchema } from '@/lib/validation';

export interface ShippingForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

export const EMPTY_SHIPPING: ShippingForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  notes: '',
};

interface ShippingStepProps {
  shipping: ShippingForm;
  onShippingChange: (shipping: ShippingForm) => void;
  errors: Record<string, string>;
  onErrorsChange: (errors: Record<string, string>) => void;
  onSubmit: () => void;
}

const TEXT_FIELDS = [
  { id: 's-phone', field: 'phone', label: 'Teléfono *', type: 'tel', autoComplete: 'tel' },
  { id: 's-address', field: 'address', label: 'Dirección *', type: 'text', autoComplete: 'street-address' },
] as const;

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 font-body text-xs text-error" role="alert">
      {message}
    </p>
  );
}

export default function ShippingStep({
  shipping,
  onShippingChange,
  errors,
  onErrorsChange,
  onSubmit,
}: ShippingStepProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onErrorsChange({});

    const result = shippingSchema.safeParse(shipping);
    if (!result.success) {
      onErrorsChange(formatZodErrors(result.error.issues));
      return;
    }

    onSubmit();
  };

  const inputClass = (field: string) => `input-field ${errors[field] ? 'border-error' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <h2 className="font-heading text-2xl font-medium text-on-surface">
        Información de envío
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="s-name"
            className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
          >
            Nombre completo *
          </label>
          <input
            id="s-name"
            value={shipping.name}
            onChange={(e) => onShippingChange({ ...shipping, name: e.target.value })}
            className={`input-field ${errors.name ? 'border-error' : ''}`}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'err-s-name' : undefined}
            required
          />
          <FieldError id="err-s-name" message={errors.name} />
        </div>
        <div>
          <label
            htmlFor="s-email"
            className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
          >
            Email *
          </label>
          <input
            id="s-email"
            type="email"
            value={shipping.email}
            onChange={(e) => onShippingChange({ ...shipping, email: e.target.value })}
            className={`input-field ${errors.email ? 'border-error' : ''}`}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'err-s-email' : undefined}
            required
          />
          <FieldError id="err-s-email" message={errors.email} />
        </div>
      </div>
      {TEXT_FIELDS.map(({ id, field, label, type, autoComplete }) => (
        <div key={id}>
          <label
            htmlFor={id}
            className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
          >
            {label}
          </label>
          <input
            id={id}
            type={type}
            value={shipping[field]}
            onChange={(e) => onShippingChange({ ...shipping, [field]: e.target.value })}
            className={inputClass(field)}
            autoComplete={autoComplete}
            aria-invalid={Boolean(errors[field])}
            aria-describedby={errors[field] ? `err-${id}` : undefined}
            required
          />
          <FieldError id={`err-${id}`} message={errors[field]} />
        </div>
      ))}
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label
            htmlFor="s-city"
            className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
          >
            Ciudad *
          </label>
          <input
            id="s-city"
            value={shipping.city}
            onChange={(e) => onShippingChange({ ...shipping, city: e.target.value })}
            className={inputClass('city')}
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? 'err-s-city' : undefined}
            required
          />
          <FieldError id="err-s-city" message={errors.city} />
        </div>
        <div>
          <label
            htmlFor="s-state"
            className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
          >
            Estado/Depto *
          </label>
          <input
            id="s-state"
            value={shipping.state}
            onChange={(e) => onShippingChange({ ...shipping, state: e.target.value })}
            className={inputClass('state')}
            autoComplete="address-level1"
            aria-invalid={Boolean(errors.state)}
            aria-describedby={errors.state ? 'err-s-state' : undefined}
            required
          />
          <FieldError id="err-s-state" message={errors.state} />
        </div>
        <div>
          <label
            htmlFor="s-zip"
            className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
          >
            Código Postal *
          </label>
          <input
            id="s-zip"
            value={shipping.zip}
            onChange={(e) => onShippingChange({ ...shipping, zip: e.target.value })}
            className={inputClass('zip')}
            autoComplete="postal-code"
            aria-invalid={Boolean(errors.zip)}
            aria-describedby={errors.zip ? 'err-s-zip' : undefined}
            required
          />
          <FieldError id="err-s-zip" message={errors.zip} />
        </div>
      </div>
      <div>
        <label
          htmlFor="s-notes"
          className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
        >
          Notas (opcional)
        </label>
        <textarea
          id="s-notes"
          rows={3}
          value={shipping.notes}
          onChange={(e) => onShippingChange({ ...shipping, notes: e.target.value })}
          className="input-field resize-none"
        />
      </div>
      <button type="submit" className="btn-primary">
        Continuar al pago
      </button>
    </form>
  );
}
