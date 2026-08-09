import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Switch&Tech',
  description:
    'Conoce cómo Switch&Tech recopila, usa y protege tus datos personales. Cumplimiento con la Ley 1581 de 2012 (Colombia) y regulaciones aplicables.',
  alternates: { canonical: '/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <div className="container-store py-12 animate-fade-in">
      <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">
        Política de Privacidad
      </h1>
      <p className="mt-3 font-body text-sm text-on-surface-variant">
        Última actualización: Julio 2026
      </p>

      <div className="mt-10 flex max-w-3xl flex-col gap-8 font-body text-base leading-relaxed text-on-surface-variant">
        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            1. Introducción
          </h2>
          <p>
            En <strong className="text-on-surface">Switch&Tech</strong> nos tomamos muy en serio la
            privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos,
            utilizamos, almacenamos y protegemos tus datos personales cuando visitas nuestro sitio
            web o realizas una compra, en cumplimiento con la{' '}
            <strong className="text-on-surface">Ley 1581 de 2012</strong> de Protección de Datos
            Personales en Colombia y demás normativa aplicable.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            2. Datos que recopilamos
          </h2>
          <p>Podemos recopilar la siguiente información:</p>
          <ul className="mt-3 flex flex-col gap-2 pl-5 list-disc">
            <li>
              <strong className="text-on-surface">Datos de identificación:</strong> nombre, correo
              electrónico, teléfono, dirección de envío.
            </li>
            <li>
              <strong className="text-on-surface">Datos de navegación:</strong> dirección IP, tipo
              de navegador, páginas visitadas, tiempo de sesión.
            </li>
            <li>
              <strong className="text-on-surface">Datos de compra:</strong> historial de pedidos,
              preferencias de productos, método de pago utilizado (sin almacenar datos de tarjetas).
            </li>
            <li>
              <strong className="text-on-surface">Datos de suscripción:</strong> correo electrónico
              si te suscribes a nuestro newsletter.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            3. Finalidad del tratamiento
          </h2>
          <p>Utilizamos tus datos para:</p>
          <ul className="mt-3 flex flex-col gap-2 pl-5 list-disc">
            <li>Procesar y gestionar tus pedidos y devoluciones.</li>
            <li>Enviarte información sobre el estado de tu pedido.</li>
            <li>Responder a tus consultas a través del formulario de contacto.</li>
            <li>Enviarte comunicaciones comerciales (si has dado tu consentimiento).</li>
            <li>Mejorar nuestra tienda y personalizar tu experiencia.</li>
            <li>Cumplir con obligaciones legales y fiscales.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            4. Base legal del tratamiento
          </h2>
          <p>
            El tratamiento de tus datos se fundamenta en tu consentimiento explícito al aceptar esta
            política, así como en la ejecución del contrato de compraventa cuando realizas un pedido.
            Tienes derecho a retirar tu consentimiento en cualquier momento.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            5. Almacenamiento y seguridad
          </h2>
          <p>
            Tus datos se almacenan de forma segura en servidores con medidas de protección técnicas
            y organizativas. No almacenamos datos de tarjetas de crédito o débito — los pagos son
            procesados directamente por{' '}
            <strong className="text-on-surface">MercadoPago</strong>, plataforma certificada
            PCI-DSS.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            6. Compartición de datos
          </h2>
          <p>
            No vendemos tus datos personales a terceros. Podemos compartir información con:
          </p>
          <ul className="mt-3 flex flex-col gap-2 pl-5 list-disc">
            <li>Procesadores de pago (MercadoPago) para completar transacciones.</li>
            <li>Empresas de logística y paquetería para realizar envíos.</li>
            <li>Autoridades competentes cuando la ley lo requiera.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            7. Tus derechos (ARCO)
          </h2>
          <p>
            De acuerdo con la Ley 1581 de 2012, tienes los siguientes derechos sobre tus datos
            personales:
          </p>
          <ul className="mt-3 flex flex-col gap-2 pl-5 list-disc">
            <li>
              <strong className="text-on-surface">Acceso:</strong> conocer qué datos tenemos
              tuyos.
            </li>
            <li>
              <strong className="text-on-surface">Rectificación:</strong> solicitar la corrección
              de datos inexactos.
            </li>
            <li>
              <strong className="text-on-surface">Cancelación:</strong> solicitar la eliminación de
              tus datos.
            </li>
            <li>
              <strong className="text-on-surface">Oposición:</strong> oponerte al tratamiento de
              tus datos para fines específicos.
            </li>
          </ul>
          <p className="mt-3">
            Para ejercer tus derechos, escríbenos a{' '}
            <span className="text-primary">privacidad@switchandtech.mx</span>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            8. Cookies
          </h2>
          <p>
            Nuestro sitio utiliza cookies esenciales para el funcionamiento de la tienda (carrito de
            compras, sesión de usuario). No utilizamos cookies de rastreo publicitario sin tu
            consentimiento previo. Puedes configurar tu navegador para rechazar cookies, aunque
            algunas funcionalidades podrían verse afectadas.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            9. Contacto
          </h2>
          <p>
            Si tienes preguntas sobre esta política o deseas ejercer tus derechos ARCO, contáctanos:
          </p>
          <div className="mt-3 rounded-xl bg-surface-container p-4">
            <p className="text-on-surface">
              <strong>Switch&Tech</strong>
            </p>
            <p>Email: privacidad@switchandtech.mx</p>
            <p>Teléfono: +57 300 123 4567</p>
            <p>Bogotá, Colombia</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-2xl font-medium text-on-surface">
            10. Cambios a esta política
          </h2>
          <p>
            Nos reservamos el derecho de actualizar esta política en cualquier momento. Los cambios
            serán publicados en esta página con la fecha de actualización correspondiente. Te
            recomendamos revisar periódicamente esta sección.
          </p>
        </section>

        <div className="rounded-2xl bg-surface-container p-6 text-center">
          <p className="text-on-surface font-medium">
            Al usar nuestro sitio, aceptas esta Política de Privacidad.
          </p>
          <p className="mt-2 text-sm">
            Consulta también nuestros{' '}
            <Link href="/terminos" className="text-primary underline transition-colors hover:text-primary/80">
              Términos y Condiciones
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
