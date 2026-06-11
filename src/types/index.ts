export type Category = 'fundas' | 'cargadores' | 'termos' | 'personalizados';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  image?: string;
  category: Category;
  featured: boolean;
  colors?: string[];
  stock?: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}
