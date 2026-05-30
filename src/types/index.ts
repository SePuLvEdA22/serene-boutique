export type Category = 'fundas' | 'cargadores' | 'termos' | 'personalizados';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: Category;
  featured: boolean;
  colors?: string[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}
