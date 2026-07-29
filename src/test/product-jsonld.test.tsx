import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ProductJsonLd from '@/components/ProductJsonLd';
import type { Product } from '@/lib/models';

const baseProduct: Product = {
  id: 'test-product-1',
  name: 'Funda de Prueba',
  description: 'Una descripción de prueba para verificar el Schema.org',
  price: 299.00,
  images: ['/images/test.jpg'],
  image: '/images/test.jpg',
  category: 'fundas',
  featured: true,
  colors: ['Negro', 'Blanco'],
  stock: 10,
  createdAt: '2026-01-01',
};

describe('ProductJsonLd', () => {
  it('debería_contener_script_tag_con_type_application_ld_json', () => {
    const { container } = render(<ProductJsonLd product={baseProduct} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('debería_incluir_nombre_del_producto_en_json_ld', () => {
    const { container } = render(<ProductJsonLd product={baseProduct} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed.name).toBe('Funda de Prueba');
  });

  it('debería_incluir_precio_y_moneda_en_offers', () => {
    const { container } = render(<ProductJsonLd product={baseProduct} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed.offers?.price).toBe(299.00);
    expect(parsed.offers?.priceCurrency).toBe('MXN');
  });

  it('debería_indicar_InStock_cuando_stock_mayor_a_cero', () => {
    const { container } = render(
      <ProductJsonLd product={{ ...baseProduct, stock: 5 }} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed.offers?.availability).toBe('https://schema.org/InStock');
  });

  it('debería_indicar_OutOfStock_cuando_stock_es_cero', () => {
    const { container } = render(
      <ProductJsonLd product={{ ...baseProduct, stock: 0 }} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed.offers?.availability).toBe('https://schema.org/OutOfStock');
  });

  it('debería_indicar_InStock_cuando_stock_es_indefinido', () => {
    const { container } = render(
      <ProductJsonLd product={{ ...baseProduct, stock: undefined }} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed.offers?.availability).toBe('https://schema.org/InStock');
  });

  it('debería_incluir_marca_SwitchTech', () => {
    const { container } = render(<ProductJsonLd product={baseProduct} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed.brand?.name).toBe('Switch&Tech');
  });

  it('debería_incluir_colores_cuando_existen', () => {
    const { container } = render(<ProductJsonLd product={baseProduct} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed.color).toBe('Negro, Blanco');
  });

  it('debería_no_incluir_color_si_no_hay_colores', () => {
    const { container } = render(
      <ProductJsonLd product={{ ...baseProduct, colors: [] }} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed.color).toBeUndefined();
  });
});
