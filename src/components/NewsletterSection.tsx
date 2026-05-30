'use client';

import { useState, type FormEvent } from 'react';

export default function NewsletterSection() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <section className="section-gap rounded-2xl bg-surface-container-high px-6 py-16 text-center md:py-20 animate-fade-in-up">
      <h2 className="font-heading text-3xl font-medium text-on-surface md:text-4xl">
        Mantente al día
      </h2>
      <p className="mx-auto mt-3 max-w-md font-body text-base leading-relaxed text-on-surface-variant">
        Suscríbete para recibir novedades, colecciones exclusivas y ofertas especiales.
      </p>
      <form
        className="mx-auto mt-6 flex max-w-md gap-3"
        onSubmit={handleSubmit}
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Correo electrónico
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="Tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field flex-1"
          required
          disabled={status === 'loading' || status === 'success'}
        />
        <button
          type="submit"
          className="btn-primary whitespace-nowrap"
          disabled={status === 'loading' || status === 'success'}
        >
          {status === 'loading' ? 'Enviando...' : status === 'success' ? '¡Suscrito!' : 'Suscribirse'}
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-3 font-body text-sm text-error" role="alert">
          Error al suscribir. Intenta de nuevo.
        </p>
      )}
      {status === 'success' && (
        <p className="mt-3 font-body text-sm text-green-600" role="status">
          ¡Gracias por suscribirte!
        </p>
      )}
    </section>
  );
}
