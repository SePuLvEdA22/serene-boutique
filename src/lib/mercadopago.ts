export const MP_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? 'TEST-1234-5678-9012-3456';

export const MP_ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ?? 'TEST-4321-8765-2109-6543';

export const isTestMode = !process.env.MP_ACCESS_TOKEN;

export const TEST_CARD_NUMBERS = [
  { label: 'Visa', number: '4000 0000 0000 0004' },
  { label: 'Mastercard', number: '5031 7557 3453 0604' },
  { label: 'American Express', number: '3739 5334 5237 9004' },
];

export interface MercadoPagoPreference {
  items: {
    id: string;
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
    currency_id: 'MXN';
  }[];
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  notification_url?: string;
  statement_descriptor?: string;
}

export function createPreferenceBody(
  items: { id: string; name: string; price: number; quantity: number }[],
  baseUrl: string
): MercadoPagoPreference {
  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'MXN',
    })),
    back_urls: {
      success: `${baseUrl}/orden`,
      failure: `${baseUrl}/carrito`,
      pending: `${baseUrl}/orden`,
    },
    notification_url: `${baseUrl}/api/mercadopago/webhook`,
    statement_descriptor: 'SWITCH&TECH',
  };
}

export function getTestCardMessage(): string {
  return (
    `🧪 Entorno de prueba — No se realizarán cargos reales.\n\n` +
    `Tarjetas de prueba disponibles:\n` +
    TEST_CARD_NUMBERS.map((c) => `  • ${c.label}: ${c.number}`).join('\n') +
    `\n\nCualquier fecha futura y CVC 123 funcionan.`
  );
}
