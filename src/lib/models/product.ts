import { z } from "zod";

export const categorySchema = z.enum(["fundas", "cargadores", "termos", "personalizados"]);

export const ProductSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).default(""),
    price: z.number().nonnegative(),
    /** Precio de oferta (opcional): si existe y es menor que `price`, se usa para mostrar y cobrar. */
    salePrice: z.number().nonnegative().optional(),
    images: z.array(z.string()).default(["/images/placeholder.svg"]),
    image: z.string().optional(),
    category: categorySchema,
    featured: z.boolean().default(false),
    /** Producto visible en la tienda (los inactivos solo se ven en admin). */
    active: z.boolean().default(true).optional(),
    colors: z.array(z.string()).default([]),
    /** Etiquetas libres (opcionales) para clasificar productos. */
    tags: z.array(z.string()).default([]).optional(),
    stock: z.number().int().nonnegative().optional(),
    createdAt: z.string(),
  })
  .strict();

export type Product = z.infer<typeof ProductSchema>;
export type Category = z.infer<typeof categorySchema>;
