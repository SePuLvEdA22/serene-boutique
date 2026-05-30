import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="section-gap relative overflow-hidden rounded-2xl bg-surface-container animate-fade-in-up">
      <div className="flex flex-col items-center px-6 py-20 text-center md:py-32">
        <span className="chip mb-4">Nueva Colección 2026</span>
        <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight tracking-tight text-on-surface md:text-6xl">
          Elegancia que te{' '}
          <span className="italic text-primary">acompaña</span>
        </h1>
        <p className="mt-4 max-w-xl font-body text-lg leading-relaxed text-on-surface-variant">
          Descubre nuestra colección de accesorios diseñados para quienes valoran la calidad, el estilo y los detalles que marcan la diferencia.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/fundas" className="btn-primary">
            Comprar ahora
          </Link>
          <Link href="/personalizados" className="btn-secondary">
            Personalizar
          </Link>
        </div>
      </div>
    </section>
  );
}
