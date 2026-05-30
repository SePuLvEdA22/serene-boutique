import Link from 'next/link';

const categories = [
  {
    title: 'Fundas',
    href: '/fundas',
    description: 'Protección con estilo',
    gradient: 'from-primary/20 to-primary-container',
  },
  {
    title: 'Cargadores',
    href: '/cargadores',
    description: 'Energía que inspira',
    gradient: 'from-secondary/20 to-secondary-container/50',
  },
  {
    title: 'Termos',
    href: '/termos',
    description: 'Tu esencia, siempre contigo',
    gradient: 'from-tertiary/20 to-tertiary-container',
  },
  {
    title: 'Personalizados',
    href: '/personalizados',
    description: 'Creado para ti',
    gradient: 'from-primary-container to-secondary-fixed-dim/50',
  },
];

export default function CategorySection() {
  return (
    <section className="section-gap">
      <h2 className="mb-8 font-heading text-3xl font-medium text-on-surface md:text-4xl">
        Categorías
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-stagger">
        {categories.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={`group relative flex h-48 flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-br p-6 transition-shadow duration-300 hover:shadow-medium ${cat.gradient}`}
          >
            <h3 className="font-heading text-2xl font-medium text-on-surface transition-colors group-hover:text-primary">
              {cat.title}
            </h3>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              {cat.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
