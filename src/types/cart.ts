import type { Product } from '@/lib/models';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}
