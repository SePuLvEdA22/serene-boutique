/**
 * Utilidades para integración con MercadoPago Checkout Pro.
 * Todos los pagos en pesos colombianos (COP). Soporta tarjeta y PSE (Colombia).
 */

// ─── Constantes de entorno ────────────────────────────────────────────

export const MP_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? 'TEST-1234-5678-9012-3456';

export const MP_ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ?? 'TEST-4321-8765-2109-6543';

/**
 * Indica si estamos en modo de prueba (sandbox) de MercadoPago.
 * Usa NEXT_PUBLIC_MP_PUBLIC_KEY (disponible tanto en server como cliente)
 * para determinar si las credenciales son de prueba (TEST-) o producción (APP_USR-).
 */
export const isTestMode = !(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.startsWith('APP_USR-') ?? false);

// ─── Tipos de identificación para Colombia ────────────────────────────

export const COL_IDENTIFICATION_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'Pasaporte', label: 'Pasaporte' },
] as const;

export type ColIdentificationType = (typeof COL_IDENTIFICATION_TYPES)[number]['value'];

// ─── Métodos de pago ──────────────────────────────────────────────────

export type PaymentMethodType = 'card' | 'pse';

export const PAYMENT_METHODS: { value: PaymentMethodType; label: string; description: string }[] = [
  {
    value: 'card',
    label: 'Tarjeta de crédito/débito',
    description: 'Visa, Mastercard, American Express y más',
  },
  {
    value: 'pse',
    label: 'PSE – Débito desde cuenta bancaria',
    description: 'Pagos Seguros en Línea (Colombia)',
  },
];

// ─── Tarjetas de prueba ───────────────────────────────────────────────

export const TEST_CARD_NUMBERS = [
  { label: 'Visa', number: '4000 0000 0000 0004' },
  { label: 'Mastercard', number: '5031 7557 3453 0604' },
  { label: 'American Express', number: '3739 5334 5237 9004' },
];

// ─── Interfaces ───────────────────────────────────────────────────────

export interface PayerIdentification {
  type: ColIdentificationType;
  number: string;
}

export interface MercadoPagoPreferenceItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id: 'COP';
}

export interface MercadoPagoPreference {
  items: MercadoPagoPreferenceItem[];
  /** Referencia externa (ID de la orden) que MercadoPago devuelve en el pago.
   *  El webhook la usa para correlacionar el pago con la orden. */
  external_reference?: string;
  payer?: {
    name?: string;
    email?: string;
    identification?: PayerIdentification;
  };
  payment_methods?: {
    excluded_payment_types?: { id: string }[];
    excluded_payment_methods?: { id: string }[];
    default_payment_method_id?: string;
    installments?: number;
  };
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: 'approved' | 'all';
  notification_url?: string;
  statement_descriptor?: string;
}

// ─── Constructores de preferencia ─────────────────────────────────────

export interface PreferenceInput {
  items: { id: string; name: string; price: number; quantity: number }[];
  paymentMethod: PaymentMethodType;
  /** ID de la orden en tu sistema; viaja como external_reference para
   *  que el webhook pueda actualizar la orden correcta. */
  orderId: string;
  payer?: {
    name?: string;
    email?: string;
    identification?: PayerIdentification;
  };
  baseUrl: string;
}

/**
 * Construye el cuerpo de la preferencia para MercadoPago Checkout Pro.
 * Según el método de pago seleccionado, configura la moneda y
 * los métodos de pago disponibles.
 */
export function buildPreference(input: PreferenceInput): MercadoPagoPreference {
  const { items, paymentMethod, payer, baseUrl } = input;

  const isPse = paymentMethod === 'pse';

  const preference: MercadoPagoPreference = {
    items: items.map((item) => ({
      id: item.id,
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'COP',
    })),
    external_reference: input.orderId,
    back_urls: {
      success: `${baseUrl}/orden?status=success&id=${input.orderId}`,
      failure: `${baseUrl}/carrito?status=failure`,
      pending: `${baseUrl}/orden?status=pending&id=${input.orderId}`,
    },
    auto_return: 'approved',
    notification_url: `${baseUrl}/api/mercadopago/webhook`,
    statement_descriptor: 'SWITCH&TECH',
  };

  // Configurar datos del pagador
  if (payer) {
    preference.payer = {
      name: payer.name,
      email: payer.email,
      ...(payer.identification
        ? { identification: payer.identification }
        : {}),
    };
  }

  // Configurar métodos de pago según selección
  if (isPse) {
    // PSE: solo disponible en COP, forzar método PSE
    preference.payment_methods = {
      default_payment_method_id: 'pse',
      excluded_payment_types: [
        { id: 'credit_card' },
        { id: 'debit_card' },
        { id: 'prepaid_card' },
        { id: 'ticket' },
        { id: 'atm' },
        { id: 'digital_currency' },
      ],
      installments: 1,
    };

  } else {
    // Tarjeta: permitir todos los métodos, configurar cuotas
    preference.payment_methods = {
      excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }, { id: 'digital_currency' }],
      installments: 12,
    };
  }

  return preference;
}

// ─── Mensajes de prueba ──────────────────────────────────────────────

export function getTestCardMessage(): string {
  return (
    `🧪 Entorno de prueba — No se realizarán cargos reales.\n\n` +
    `Tarjetas de prueba disponibles:\n` +
    TEST_CARD_NUMBERS.map((c) => `  • ${c.label}: ${c.number}`).join('\n') +
    `\n\nCualquier fecha futura y CVC 123 funcionan.`
  );
}

export function getPseTestMessage(): string {
  return (
    `🧪 Entorno de prueba — PSE (Colombia)\n\n` +
    `Para probar PSE en modo test:\n` +
    `  • Usa un número de identificación válido simulado\n` +
    `  • Serás redirigido al entorno de prueba de PSE\n` +
    `  • No se realizarán cargos reales\n\n` +
    `💡 Los pagos se procesan en COP (Peso Colombiano).`
  );
}

export function getTestMessage(paymentMethod: PaymentMethodType): string {
  return paymentMethod === 'pse' ? getPseTestMessage() : getTestCardMessage();
}

// ─── SDK de MercadoPago (carga dinámica) ─────────────────────────────

/**
 * Carga el SDK de MercadoPago dinámicamente en el navegador.
 * Útil para usar Wallet Brick o CardForm en el frontend si se desea.
 */
export function loadMercadoPagoSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('MercadoPago SDK solo se puede cargar en el navegador'));
      return;
    }

    const scriptId = 'mercadopago-sdk';
    if (document.getElementById(scriptId)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Error al cargar SDK de MercadoPago'));
    document.body.appendChild(script);
  });
}
