'use client';

import { useState, type FormEvent } from 'react';
import Spinner from '@/components/Spinner';
import { contactSchema, formatZodErrors } from '@/lib/validation';

export default function ContactoPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setErrorMsg('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    const result = contactSchema.safeParse(data);
    if (!result.success) {
      setErrors(formatZodErrors(result.error.issues));
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al enviar');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Error al enviar el mensaje');
    }
  };

  if (status === 'success') {
    return (
      <div className="container-store py-12">
        <div className="mx-auto max-w-lg rounded-2xl bg-surface-container p-8 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22l-4-9-9-4z" />
            </svg>
          </div>
          <h2 className="font-heading text-2xl font-medium text-on-surface">¡Mensaje enviado!</h2>
          <p className="mt-2 font-body text-base text-on-surface-variant">
            Gracias por contactarnos. Te responderemos a la brevedad.
          </p>
          <button
            onClick={() => { setStatus('idle'); setErrors({}); }}
            className="btn-primary mt-6"
          >
            Enviar otro mensaje
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-store py-12 animate-fade-in">
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Contacto</h1>
        <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-on-surface-variant">
          Estamos aquí para ayudarte. Escríbenos y te responderemos lo antes posible.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                Nombre *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`input-field ${errors.name ? 'border-error' : ''}`}
                required
              />
              {errors.name && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`input-field ${errors.email ? 'border-error' : ''}`}
                required
              />
              {errors.email && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.email}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Asunto *
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              className={`input-field ${errors.subject ? 'border-error' : ''}`}
              required
            />
            {errors.subject && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.subject}</p>}
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Mensaje *
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              className={`input-field resize-none ${errors.message ? 'border-error' : ''}`}
              required
            />
            {errors.message && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.message}</p>}
          </div>
          {status === 'error' && (
            <p className="font-body text-sm text-error" role="alert">{errorMsg}</p>
          )}
          <button type="submit" className="btn-primary" disabled={status === 'loading'}>
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2"><Spinner /> Enviando...</span>
            ) : 'Enviar mensaje'}
          </button>
        </form>

        <div className="flex flex-col gap-8">
          <div className="rounded-2xl bg-surface-container p-6">
            <h3 className="font-heading text-lg font-medium text-on-surface">Información de contacto</h3>
            <div className="mt-4 flex flex-col gap-4">
              {[
                { label: 'Email', value: 'hola@switchandtech.com' },
                { label: 'Teléfono', value: '+57 300 123 4567' },
                { label: 'Horario', value: 'Lun - Vie: 9:00 - 18:00' },
                { label: 'Ubicación', value: 'Bogotá, Colombia' },
              ].map((info) => (
                <div key={info.label}>
                  <p className="font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                    {info.label}
                  </p>
                  <p className="mt-1 font-body text-base text-on-surface">{info.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container p-6">
            <h3 className="font-heading text-lg font-medium text-on-surface">Síguenos</h3>
            <p className="mt-2 font-body text-sm text-on-surface-variant">
              Mantente al día con nuestras últimas novedades y colecciones.
            </p>
            <div className="mt-4 flex gap-3">
              {[
                { name: 'Instagram', url: 'https://instagram.com/switchandtech' },
                { name: 'Facebook', url: 'https://facebook.com/switchandtech' },
                { name: 'TikTok', url: 'https://tiktok.com/@switchandtech' },
                { name: 'Pinterest', url: 'https://pinterest.com/switchandtech' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                  aria-label={social.name}
                >
                  {social.name[0]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
