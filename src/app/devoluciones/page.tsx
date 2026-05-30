import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Devoluciones | Switch&Tech',
  description: 'Política de devoluciones y cambios. Si no estás satisfecho con tu compra, te ayudamos.',
};

export default function DevolucionesPage() {
  return (
    <div className="container-store py-12 animate-fade-in">
      <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Devoluciones</h1>
      <div className="mt-10 flex flex-col gap-8 font-body text-base leading-relaxed text-on-surface-variant max-w-3xl">
        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">Política de devolución</h2>
          <p>
            En Switch&Tech queremos que estés completamente satisfecho con tu compra.
            Si por algún motivo no es así, aceptamos devoluciones dentro de los primeros <strong className="text-on-surface">30 días</strong> posteriores a la entrega.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">Requisitos</h2>
          <ul className="mt-3 flex flex-col gap-2 pl-5 list-disc">
            <li>El producto debe estar en su estado original, sin señales de uso</li>
            <li>Debe incluir todos los accesorios y empaque original</li>
            <li>Es necesario presentar el comprobante de compra o número de pedido</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">Proceso de devolución</h2>
          <ol className="mt-3 flex flex-col gap-2 pl-5 list-decimal">
            <li>Envíanos un correo a <span className="text-primary">devoluciones@switchandtech.mx</span> con tu número de pedido</li>
            <li>Te enviaremos una guía de devolución prepagada</li>
            <li>Empaca el producto de forma segura y entrega el paquete en la paquetería indicada</li>
            <li>Una vez recibido e inspeccionado, procesaremos tu reembolso (3–5 días hábiles)</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">Excepciones</h2>
          <p>
            Los productos personalizados no aplican para devolución a menos que presenten un defecto de fabricación.
            En ese caso, contáctanos dentro de los primeros 7 días para evaluar el caso.
          </p>
        </section>
      </div>
    </div>
  );
}
