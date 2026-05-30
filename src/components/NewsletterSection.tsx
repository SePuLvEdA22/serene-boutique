'use client';

export default function NewsletterSection() {
  return (
    <section className="section-gap rounded-2xl bg-surface-container-high px-6 py-16 text-center md:py-20">
      <h2 className="font-heading text-3xl font-medium text-on-surface md:text-4xl">
        Mantente al día
      </h2>
      <p className="mx-auto mt-3 max-w-md font-body text-base leading-relaxed text-on-surface-variant">
        Suscríbete para recibir novedades, colecciones exclusivas y ofertas especiales.
      </p>
      <form
        className="mx-auto mt-6 flex max-w-md gap-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          placeholder="Tu correo electrónico"
          className="input-field flex-1"
          required
        />
        <button type="submit" className="btn-primary whitespace-nowrap">
          Suscribirse
        </button>
      </form>
    </section>
  );
}
