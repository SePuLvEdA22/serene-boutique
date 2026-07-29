import { z } from 'zod';

export const categorySchema = z.enum(['fundas', 'cargadores', 'termos', 'personalizados']);

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  price: z.number().nonnegative(),
  images: z.array(z.string()).default(['/images/placeholder.svg']),
  image: z.string().optional(),
  category: categorySchema,
  featured: z.boolean().default(false),
  colors: z.array(z.string()).default([]),
  stock: z.number().int().nonnegative().optional(),
  createdAt: z.string(),
});

export type Product = z.infer<typeof ProductSchema>;
export type Category = z.infer<typeof categorySchema>;
