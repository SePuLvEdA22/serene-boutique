import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Switch&Tech',
  description:
    'Términos y condiciones de uso de Switch&Tech. Políticas de compra, envío, devolución y uso del sitio web.',
  alternates: { canonical: '/terminos' },
};

export default function TerminosPage() {
  return (
    <div className="container-store py-12 animate-fade-in">
      <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">
        Términos y Condiciones
      </h1>
      <p className="mt-3 font-body text-sm text-on-surface-variant">
        Última actualización: Julio 2026
      </p>

      <div className="mt-10 flex max-w-3xl flex-col gap-8 font-body text-base leading-relaxed text-on-surface-variant">
        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            1. Aceptación de los términos
          </h2>
          <p>
            Al acceder y utilizar este sitio web, aceptas cumplir con estos Términos y Condiciones.
            Si no estás de acuerdo con alguna parte, no debes usar nuestros servicios.
            Switch&Tech se reserva el derecho de modificar estos términos en cualquier momento.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            2. Productos y precios
          </h2>
          <ul className="flex flex-col gap-2 pl-5 list-disc">
            <li>Todos los precios están expresados en pesos colombianos (COP) e incluyen el IVA correspondiente.</li>
            <li>Nos reservamos el derecho de modificar precios sin previo aviso.</li>
            <li>Las imágenes de los productos son referenciales. El producto real puede variar ligeramente.</li>
            <li>La disponibilidad de los productos está sujeta a inventario. En caso de agotamiento, te notificaremos y reembolsaremos el monto correspondiente.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            3. Proceso de compra
          </h2>
          <ol className="flex flex-col gap-2 pl-5 list-decimal">
            <li>Agrega los productos deseados al carrito de compras.</li>
            <li>Completa el formulario de envío con tus datos.</li>
            <li>Selecciona el método de pago y completa la transacción.</li>
            <li>Recibirás un correo de confirmación con los detalles de tu pedido.</li>
            <li>Te mantendremos informado sobre el estado de tu envío.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            4. Pagos
          </h2>
          <p>
            Los pagos se procesan a través de{' '}
            <strong className="text-on-surface">MercadoPago</strong>, plataforma certificada
            PCI-DSS. Aceptamos los siguientes métodos de pago:
          </p>
          <ul className="mt-3 flex flex-col gap-2 pl-5 list-disc">
            <li>Tarjetas de crédito y débito (Visa, Mastercard, American Express).</li>
            <li>Transferencia bancaria.</li>
            <li>Pago en efectivo en tiendas de conveniencia (a través de MercadoPago).</li>
          </ul>
          <p className="mt-3">
            <strong className="text-on-surface">Importante:</strong> Switch&Tech nunca almacena
            datos de tarjetas bancarias. Toda la información de pago es manejada directamente por
            MercadoPago.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            5. Envíos
          </h2>
          <p>
            Realizamos envíos a toda la República Mexicana. Los tiempos y costos de envío se
            detallan en nuestra{' '}
            <Link href="/envios" className="text-primary underline transition-colors hover:text-primary/80">
              página de envíos
            </Link>
            . Switch&Tech no se hace responsable por retrasos causados por la paquetería o
            situaciones de fuerza mayor.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            6. Devoluciones y cambios
          </h2>
          <p>
            Nuestra política de devoluciones está detallada en nuestra{' '}
            <Link href="/devoluciones" className="text-primary underline transition-colors hover:text-primary/80">
              página de devoluciones
            </Link>
            . En resumen:
          </p>
          <ul className="mt-3 flex flex-col gap-2 pl-5 list-disc">
            <li>Aceptamos devoluciones dentro de los primeros 30 días posteriores a la entrega.</li>
            <li>El producto debe estar en su estado original.</li>
            <li>Los productos personalizados no aplican para devolución, salvo defectos de fabricación.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            7. Propiedad intelectual
          </h2>
          <p>
            Todos los contenidos del sitio web (textos, imágenes, logotipos, diseños) son propiedad
            de Switch&Tech o tienen licencia de uso. Queda prohibida la reproducción total o parcial
            sin autorización expresa.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            8. Limitación de responsabilidad
          </h2>
          <p>
            Switch&Tech no será responsable por daños indirectos, pérdida de datos o lucro cesante
            derivados del uso del sitio web o de los productos adquiridos. Nuestra responsabilidad
            máxima se limita al valor del producto adquirido.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            9. Ley aplicable
          </h2>
          <p>
            Estos Términos y Condiciones se rigen por las leyes de los{' '}
            <strong className="text-on-surface">Estados Unidos Mexicanos</strong>. Cualquier
            controversia será sometida a los tribunales competentes de la Ciudad de México.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            10. Contacto
          </h2>
          <p>
            Para cualquier consulta sobre estos términos, contáctanos:
          </p>
          <div className="mt-3 rounded-xl bg-surface-container p-4">
            <p className="text-on-surface">
              <strong>Switch&Tech</strong>
            </p>
            <p>Email: legal@switchandtech.mx</p>
            <p>Teléfono: +52 55 1234 5678</p>
          </div>
        </section>

        <div className="rounded-2xl bg-surface-container p-6 text-center">
          <p className="text-on-surface font-medium">
            Al realizar una compra en nuestro sitio, aceptas estos Términos y Condiciones.
          </p>
          <p className="mt-2 text-sm">
            Consulta también nuestra{' '}
            <Link href="/privacidad" className="text-primary underline transition-colors hover:text-primary/80">
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
