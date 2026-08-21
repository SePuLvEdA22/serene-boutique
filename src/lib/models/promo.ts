import { z } from 'zod';

/** Cupón de descuento aplicable en el checkout. */
export const PromoSchema = z.object({
  id: z.string().min(1),
  code: z
    .string()
    .min(3)
    .max(30)
    .transform((v) => v.trim().toUpperCase()),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  minOrder: z.number().nonnegative().optional().default(0),
  active: z.boolean().optional().default(true),
  usageLimit: z.number().int().positive().optional(),
  usedCount: z.number().int().nonnegative().optional().default(0),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
});

export type Promo = z.infer<typeof PromoSchema>;
export type PromoType = Promo['type'];