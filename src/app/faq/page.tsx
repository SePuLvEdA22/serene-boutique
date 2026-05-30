import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | Switch&Tech',
  description: 'Preguntas frecuentes sobre nuestros productos, envíos, devoluciones y más.',
};

export default function FAQPage() {
  return (
    <div className="container-store py-12 animate-fade-in">
      <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Preguntas frecuentes</h1>
      <div className="mt-10 flex max-w-3xl flex-col gap-8 font-body text-base leading-relaxed text-on-surface-variant">
        <FaqItem question="¿Hacen envíos a toda la República?">
          Sí, realizamos envíos a toda la República Mexicana con cobertura completa. Los tiempos varían según la zona.
        </FaqItem>

        <FaqItem question="¿Cuánto tarda mi pedido?">
          El tiempo de entrega depende de tu ubicación. Generalmente es de 1 a 3 días en CDMX y hasta 7 días en zonas remotas. Consulta nuestra página de <a href="/envios" className="text-primary underline transition-colors hover:text-primary/80">Envíos</a> para más detalles.
        </FaqItem>

        <FaqItem question="¿Puedo devolver un producto personalizado?">
          Los productos personalizados solo son elegibles para devolución si presentan defectos de fabricación. Para más información, consulta nuestra <a href="/devoluciones" className="text-primary underline transition-colors hover:text-primary/80">Política de devoluciones</a>.
        </FaqItem>

        <FaqItem question="¿Qué métodos de pago aceptan?">
          Aceptamos tarjetas de crédito y débito (Visa, Mastercard), transferencia bancaria y pago en efectivo en tiendas de conveniencia a través de nuestra pasarela de pago.
        </FaqItem>

        <FaqItem question="¿Cómo puedo rastrear mi pedido?">
          Una vez que tu pedido sea enviado, recibirás un correo con el número de guía para rastrearlo en tiempo real.
        </FaqItem>

        <FaqItem question="¿Ofrecen cambios de talla o color?">
          Sí, ofrecemos cambios dentro de los primeros 30 días. El producto debe estar en perfectas condiciones y en su empaque original.
        </FaqItem>

        <FaqItem question="¿Los precios incluyen IVA?">
          Todos nuestros precios ya incluyen el IVA correspondiente. No hay cargos ocultos.
        </FaqItem>
      </div>
    </div>
  );
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 font-heading text-lg font-medium text-on-surface">{question}</h2>
      <p className="text-on-surface-variant">{children}</p>
    </div>
  );
}
