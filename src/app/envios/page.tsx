import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Envíos | Switch&Tech',
  description:
    'Conoce nuestras políticas y tiempos de envío. Envíos a todo el territorio colombiano.',
  alternates: { canonical: '/envios' },
};

export default function EnviosPage() {
  return (
    <div className="container-store py-12 animate-fade-in">
      <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Envíos</h1>
      <div className="mt-10 flex flex-col gap-8 font-body text-base leading-relaxed text-on-surface-variant max-w-3xl">
        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">Tiempos de entrega</h2>
          <p>Realizamos envíos a todo el territorio colombiano. Los tiempos de entrega estimados son:</p>
          <ul className="mt-3 flex flex-col gap-2 pl-5 list-disc">
            <li>Bogotá y alrededores: 1–3 días hábiles</li>
            <li>Principales ciudades (Medellín, Cali, Barranquilla, Bucaramanga): 2–4 días hábiles</li>
            <li>Resto del país: 3–7 días hábiles</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">Costo de envío</h2>
          <p>El envío es <strong className="text-on-surface">gratuito</strong> en pedidos mayores a 450.000 COP. Para pedidos menores, el costo de envío es de 25.000 COP.</p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">Seguimiento</h2>
          <p>Una vez que tu pedido sea enviado, recibirás un correo electrónico con el número de guía y el enlace para rastrear tu paquete en tiempo real.</p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">Proceso de envío</h2>
          <ol className="mt-3 flex flex-col gap-2 pl-5 list-decimal">
            <li>Confirmación del pedido (inmediato después de la compra)</li>
            <li>Preparación del producto (1–2 días hábiles)</li>
            <li>Entrega a la paquetería (día siguiente)</li>
            <li>En tránsito hacia tu dirección</li>
            <li>Entrega final</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
