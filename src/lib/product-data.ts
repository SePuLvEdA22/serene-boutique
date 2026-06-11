import type { Product } from '@/types';

export const initialProducts: Product[] = [
  {
    id: 'funda-silicone-clear', name: 'Funda Silicona Transparente',
    description: 'Funda transparente de silicona suave con protección anti-impacto. Diseño delgado que mantiene el perfil original de tu dispositivo. Resistente a amarillamiento.',
    price: 249.00, images: [
      '/images/fundas-silicone-01.jpeg',
      '/images/fundas-silicone-02.jpeg',
    ], image: '/images/fundas-silicone-01.jpeg',
    category: 'fundas', featured: true,
    colors: ['Transparente', 'Negro', 'Rosa'], stock: 45, createdAt: '2025-01-15',
  },
  {
    id: 'funda-floral-rose', name: 'Funda Floral Rosa',
    description: 'Funda con estampado floral en tonos rosas y dorados. Diseño exclusivo con protección completa y bordes elevados para la cámara.',
    price: 299.00, images: [
      '/images/fundas-floral-01.jpeg',
      '/images/fundas-floral-02.jpeg',
    ], image: '/images/fundas-floral-01.jpeg',
    category: 'fundas', featured: true,
    colors: ['Rosa', 'Blanco', 'Lavanda'], stock: 30, createdAt: '2025-02-20',
  },
  {
    id: 'funda-leather-classic', name: 'Funda Piel Clásica',
    description: 'Funda de piel genuina con acabado premium. Compartimiento para tarjetas y cierre magnético. Elegancia y funcionalidad en un solo producto.',
    price: 449.00, images: [
      '/images/fundas-leather-01.jpeg',
      '/images/fundas-leather-02.jpeg',
    ], image: '/images/fundas-leather-01.jpeg',
    category: 'fundas', featured: true,
    colors: ['Marrón', 'Negro', 'Burdeos'], stock: 18, createdAt: '2025-03-10',
  },
  {
    id: 'funda-marble-white', name: 'Funda Mármol Blanco',
    description: 'Funda con diseño de mármol blanco y dorado. Estampado de alta resolución con capa protectora UV.',
    price: 279.00, images: [
      '/images/fundas-marble-01.jpeg',
      '/images/fundas-marble-02.jpeg',
    ], image: '/images/fundas-marble-01.jpeg',
    category: 'fundas', featured: false,
    colors: ['Blanco', 'Gris', 'Rosa'], stock: 22, createdAt: '2025-03-15',
  },
  {
    id: 'cargador-rapido-20w', name: 'Cargador Rápido 20W USB-C',
    description: 'Cargador rápido de 20W con puerto USB-C. Compatible con carga rápida para dispositivos iPhone y Android. Protección contra sobrecarga.',
    price: 349.00, images: [
      '/images/cargadores-rapido-01.jpeg',
      '/images/cargadores-rapido-02.jpeg',
    ], image: '/images/cargadores-rapido-01.jpeg',
    category: 'cargadores', featured: true,
    stock: 50, createdAt: '2025-01-10',
  },
  {
    id: 'cargador-inalambrico', name: 'Cargador Inalámbrico Dual',
    description: 'Base de carga inalámbrica para cargar dos dispositivos simultáneamente. Compatible con todos los estándares Qi. LED indicador nocturno.',
    price: 599.00, images: [
      '/images/cargadores-inalambrico-01.jpeg',
      '/images/cargadores-inalambrico-02.jpeg',
    ], image: '/images/cargadores-inalambrico-01.jpeg',
    category: 'cargadores', featured: true,
    stock: 12, createdAt: '2025-02-05',
  },
  {
    id: 'cable-trenzado-usb', name: 'Cable Trenzado USB-C / Lightning',
    description: 'Cable trenzado de alta resistencia con conectores USB-C y Lightning. Longitud de 1.5m con refuerzo en puntas para mayor durabilidad.',
    price: 199.00, images: [
      '/images/cables-trenzado-01.jpeg',
      '/images/cables-trenzado-02.jpeg',
    ], image: '/images/cables-trenzado-01.jpeg',
    category: 'cargadores', featured: false,
    colors: ['Negro', 'Blanco', 'Rosa'], stock: 100, createdAt: '2025-02-20',
  },
  {
    id: 'cargador-portatil-10000', name: 'Batería Portátil 10000mAh',
    description: 'Batería externa de 10000mAh con dos puertos USB y carga rápida. Diseño delgado que cabe en cualquier bolsillo.',
    price: 699.00, images: [
      '/images/cargadores-portatil-01.jpeg',
      '/images/fundas-silicone-01.jpeg',
    ], image: '/images/cargadores-portatil-01.jpeg',
    category: 'cargadores', featured: true,
    colors: ['Negro', 'Blanco', 'Menta'], stock: 25, createdAt: '2025-03-01',
  },
  {
    id: 'termo-acero-500ml', name: 'Termo Acero Inoxidable 500ml',
    description: 'Termo de acero inoxidable con doble pared al vacío. Mantiene bebidas frías por 24h y calientes por 12h. Diseño elegante con tapa a prueba de derrames.',
    price: 459.00, images: [
      '/images/termos-acero-01.jpeg',
      '/images/cargadores-rapido-01.jpeg',
    ], image: '/images/termos-acero-01.jpeg',
    category: 'termos', featured: true,
    colors: ['Plata', 'Negro', 'Rosa', 'Menta'], stock: 35, createdAt: '2025-01-20',
  },
  {
    id: 'termo-vidrio-350ml', name: 'Termo Vidrio 350ml',
    description: 'Termo de vidrio borosilicato con funda de silicona. Conserva el sabor natural de tus bebidas. Tapa de bambú con sello hermético.',
    price: 379.00, images: [
      '/images/termos-vidrio-01.jpeg',
      '/images/cargadores-inalambrico-01.jpeg',
    ], image: '/images/termos-vidrio-01.jpeg',
    category: 'termos', featured: false,
    colors: ['Transparente', 'Rosa', 'Verde'], stock: 8, createdAt: '2025-02-15',
  },
  {
    id: 'termo-deportivo-750ml', name: 'Termo Deportivo 750ml',
    description: 'Termo deportivo con marcador de tiempo y pajilla incorporada. Diseño ergonómico para llevar al gimnasio, oficina o viaje.',
    price: 529.00, images: [
      '/images/termos-deportivo-01.jpeg',
      '/images/cargadores-portatil-01.jpeg',
    ], image: '/images/termos-deportivo-01.jpeg',
    category: 'termos', featured: true,
    colors: ['Negro', 'Azul', 'Rosa', 'Verde'], stock: 20, createdAt: '2025-03-05',
  },
  {
    id: 'funda-personalizada', name: 'Funda Personalizada',
    description: 'Crea tu propia funda con el diseño que quieras. Sube tu foto, ilustración o texto y lo imprimimos en alta calidad sobre funda de silicona.',
    price: 349.00, images: [
      '/images/personalizados-funda-01.jpeg',
      '/images/cables-trenzado-01.jpeg',
    ], image: '/images/personalizados-funda-01.jpeg',
    category: 'personalizados', featured: true,
    stock: 0, createdAt: '2025-01-05',
  },
  {
    id: 'termo-personalizado', name: 'Termo Personalizado',
    description: 'Termo de acero inoxidable grabado con tu diseño personalizado. Elige entre varios colores de base y agrega tu texto, logo o ilustración.',
    price: 579.00, images: [
      '/images/personalizados-termo-01.jpeg',
      '/images/termos-acero-01.jpeg',
    ], image: '/images/personalizados-termo-01.jpeg',
    category: 'personalizados', featured: true,
    stock: 15, createdAt: '2025-02-10',
  },
  {
    id: 'pack-personalizado', name: 'Pack Personalizado (Funda + Termo)',
    description: 'Ahorra con nuestro pack personalizado. Incluye funda y termo con tu diseño personalizado. Ideal para regalos corporativos o eventos especiales.',
    price: 799.00, images: [
      '/images/fundas-silicone-01.jpeg',
      '/images/termos-vidrio-01.jpeg',
    ], image: '/images/fundas-silicone-01.jpeg',
    category: 'personalizados', featured: false,
    stock: 5, createdAt: '2025-03-20',
  },
];

export const products = [...initialProducts];
