import type { Product } from '@/types';

export interface StoreUser {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
}

export interface StoreOrder {
  id: string;
  userId?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
  }>;
  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    notes?: string;
  };
  total: number;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface StoreData {
  users: StoreUser[];
  products: Product[];
  orders: StoreOrder[];
}

export interface DataStore {
  getUsers(): StoreUser[];
  setUsers(users: StoreUser[]): void;
  getProducts(): Product[];
  setProducts(products: Product[]): void;
  getOrders(): StoreOrder[];
  setOrders(orders: StoreOrder[]): void;
  getAdminInitialized(): boolean;
  setAdminInitialized(val: boolean): void;
}
