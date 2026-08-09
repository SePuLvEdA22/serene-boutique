import { describe, it, expect } from 'vitest';
import { formatPrice } from '@/lib/format-price';
import { buildPreference as buildMpPreference, COL_IDENTIFICATION_TYPES } from '@/lib/mercadopago';

describe('formatPrice', () => {
  it('debería_formatear_en_COP_por_defecto', () => {
    expect(formatPrice(249)).toBe('$249');
  });
});

describe('COL_IDENTIFICATION_TYPES', () => {
  it('debería_incluir_CC_CE_NIT_y_Pasaporte', () => {
    const values = COL_IDENTIFICATION_TYPES.map((t) => t.value);
    expect(values).toContain('CC');
    expect(values).toContain('CE');
    expect(values).toContain('NIT');
    expect(values).toContain('Pasaporte');
  });
});

describe('buildPreference (MercadoPago)', () => {
  const baseInput = {
    items: [
      { id: 'prod-1', name: 'Funda Test', price: 299, quantity: 2 },
    ],
    paymentMethod: 'card' as const,
    baseUrl: 'https://switchandtech.com',
  };

  it('debería_crear_preferencia_con_items', () => {
    const result = buildMpPreference(baseInput);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Funda Test');
    expect(result.items[0].unit_price).toBe(299);
    expect(result.items[0].quantity).toBe(2);
  });

  it('debería_usar_COP_para_tarjeta', () => {
    const result = buildMpPreference(baseInput);
    expect(result.items[0].currency_id).toBe('COP');
  });

  it('debería_usar_COP_para_PSE', () => {
    const result = buildMpPreference({
      ...baseInput,
      paymentMethod: 'pse',
    });
    expect(result.items[0].currency_id).toBe('COP');
  });

  it('debería_incluir_back_urls', () => {
    const result = buildMpPreference(baseInput);
    expect(result.back_urls?.success).toContain('/orden');
    expect(result.back_urls?.failure).toContain('/carrito');
    expect(result.back_urls?.pending).toContain('/orden');
  });

  it('debería_configurar_auto_return_approved', () => {
    const result = buildMpPreference(baseInput);
    expect(result.auto_return).toBe('approved');
  });

  it('debería_incluir_notification_url', () => {
    const result = buildMpPreference(baseInput);
    expect(result.notification_url).toContain('/api/mercadopago/webhook');
  });

  it('debería_incluir_statement_descriptor', () => {
    const result = buildMpPreference(baseInput);
    expect(result.statement_descriptor).toBe('SWITCH&TECH');
  });

  describe('PSE configuration', () => {
    it('debería_excluir_métodos_no_PSE_cuando_es_PSE', () => {
      const result = buildMpPreference({
        ...baseInput,
        paymentMethod: 'pse',
      });
      const excluded = result.payment_methods?.excluded_payment_types?.map((t) => t.id) || [];
      expect(excluded).toContain('credit_card');
      expect(excluded).toContain('debit_card');
      expect(excluded).toContain('ticket');
      expect(excluded).toContain('atm');
    });

    it('debería_establecer_default_payment_method_id_a_pse', () => {
      const result = buildMpPreference({
        ...baseInput,
        paymentMethod: 'pse',
      });
      expect(result.payment_methods?.default_payment_method_id).toBe('pse');
    });

    it('debería_establecer_installments_a_1_para_PSE', () => {
      const result = buildMpPreference({
        ...baseInput,
        paymentMethod: 'pse',
      });
      expect(result.payment_methods?.installments).toBe(1);
    });
  });

  describe('Card configuration', () => {
    it('debería_excluir_solo_ticket_atm_y_digital_currency_para_tarjeta', () => {
      const result = buildMpPreference(baseInput);
      const excluded = result.payment_methods?.excluded_payment_types?.map((t) => t.id) || [];
      expect(excluded).toContain('ticket');
      expect(excluded).toContain('atm');
      expect(excluded).toContain('digital_currency');
      expect(excluded).not.toContain('credit_card');
      expect(excluded).not.toContain('debit_card');
    });

    it('debería_permitir_hasta_12_cuotas_para_tarjeta', () => {
      const result = buildMpPreference(baseInput);
      expect(result.payment_methods?.installments).toBe(12);
    });
  });

  describe('Payer identification', () => {
    it('debería_incluir_datos_del_pagador_cuando_se_proporcionan', () => {
      const result = buildMpPreference({
        ...baseInput,
        payer: {
          name: 'Juan Pérez',
          email: 'juan@example.com',
          identification: { type: 'CC', number: '1234567890' },
        },
      });
      expect(result.payer?.name).toBe('Juan Pérez');
      expect(result.payer?.email).toBe('juan@example.com');
      expect(result.payer?.identification?.type).toBe('CC');
      expect(result.payer?.identification?.number).toBe('1234567890');
    });

    it('debería_no_incluir_identification_si_no_se_proporciona', () => {
      const result = buildMpPreference(baseInput);
      expect(result.payer).toBeUndefined();
    });
  });
});
